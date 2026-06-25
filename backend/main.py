"""Loan Default Risk Prediction API"""

import os
import json
import shutil
import uuid
from datetime import datetime
from typing import Annotated, List, Optional

import numpy as np
from fastapi import FastAPI, Depends, HTTPException, status, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from database import Base, engine, get_db
from models import (
    Application, Document, Employee,
    DecisionStatus, RiskVerdict, ProfessionalStatus, DocumentType,
)
from auth import router as auth_router, get_current_employee
from email_service import send_decision_email

# Create all tables on startup (safe: only creates what doesn't exist)
Base.metadata.create_all(bind=engine)

# Base directory = the folder where main.py is (backend/)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, '..', 'model')

# ── Load model weights once at startup ────────────────────────────────────────
weights = np.load(os.path.join(MODEL_DIR, 'model_weights.npz'))
W1 = weights["W1"]
b1 = weights["b1"]
W2 = weights["W2"]
b2 = weights["b2"]

with open(os.path.join(MODEL_DIR, 'scale_params.json'), 'r') as f:
    scale_params = json.load(f)

THRESHOLD = 0.4





# ── Activation functions ───────────────────────────────────────────────────────
def relu(Z):
    return np.maximum(0, Z)

def sigmoid(Z):
    Z = np.clip(Z, -500, 500)
    return 1 / (1 + np.exp(-Z))

# ── Feature order (must match training) ────────────────────────────────────────
FEATURE_ORDER = [
    "CreditLineUsage", "Age", "Late30to59Days", "DebtRatio",
    "MonthlyIncome", "OpenCreditLines", "Late90Days",
    "RealEstateLoans", "Late60to89Days", "Dependents",
    "MonthlyIncome_Was_Missing"
]

# ── Features that got log1p in preprocessing (Cell 7) ──────────────────────────
LOG_FEATURES = {
    "CreditLineUsage", "DebtRatio", "MonthlyIncome",
    "Late90Days", "Late30to59Days", "Late60to89Days",
    "Dependents", "OpenCreditLines", "RealEstateLoans",
}

# ── Scaling: log1p first, then MinMax (same order as training) ─────────────────
def scale_input(raw: dict) -> np.ndarray:
    scaled = []
    for feature in FEATURE_ORDER:
        value = float(raw[feature])

        if feature == "MonthlyIncome_Was_Missing":
            scaled.append(value)
            continue

        if feature in LOG_FEATURES:
            value = float(np.log1p(value))

        f_min = scale_params[feature]["min"]
        f_max = scale_params[feature]["max"]
        value = float(np.clip((value - f_min) / (f_max - f_min), 0.0, 1.0))
        scaled.append(value)

    return np.array(scaled).reshape(1, -1)

# ── Inference ──────────────────────────────────────────────────────────────────
def forward(X):
    """Forward pass. X shape: (1, 11)."""
    Z1 = np.dot(X, W1) + b1
    A1 = relu(Z1)
    Z2 = np.dot(A1, W2) + b2
    A2 = sigmoid(Z2)
    return float(A2[0, 0])




# ── FastAPI app ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Loan Default Risk Prediction API",
    description="MLP built from scratch with NumPy — Narjiss Maimouni",
    version="2.0.0"
)

# ── CORS: allow the React frontend to call this API ────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],   # Vite dev server (port can shift if 5173 is taken)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Mount the authentication routes (/register and /login) ─────────────────────
app.include_router(auth_router)

# ── Folder where uploaded documents are saved ──────────────────────────────────
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)





# ══════════════════════════════════════════════════════════════════════════════
# SCHEMAS
# ══════════════════════════════════════════════════════════════════════════════

class DocumentOut(BaseModel):
    id: int
    document_type: str
    original_filename: str
    uploaded_at: datetime

    class Config:
        from_attributes = True


class ApplicationSummary(BaseModel):
    """One row in the applications list (dashboard table)."""
    id: int
    created_at: datetime
    full_name: str
    email: str
    professional_status: str
    declared_monthly_income: float
    loan_amount: float
    status: str                        # SUBMITTED | PREDICTED | ACCEPTED | REFUSED
    risk_verdict: Optional[str]
    default_probability: Optional[float]

    class Config:
        from_attributes = True


class ApplicationDetail(BaseModel):
    """Full application data for the detail page."""
    id: int

    # Applicant-declared
    full_name: str
    email: str
    phone: str
    age: int
    professional_status: str
    declared_monthly_income: float
    number_of_dependents: int
    real_estate_loans: int
    loan_amount: float
    created_at: datetime

    # Employee-verified
    verified_monthly_income: Optional[float]
    credit_line_usage: Optional[float]
    debt_ratio: Optional[float]
    late_30_59: Optional[int]
    late_60_89: Optional[int]
    late_90: Optional[int]
    open_credit_lines: Optional[int]

    # Model output
    default_probability: Optional[float]
    risk_verdict: Optional[str]
    predicted_at: Optional[datetime]

    # Decision / workflow
    status: str
    decided_at: Optional[datetime]
    email_sent: bool

    documents: List[DocumentOut]

    class Config:
        from_attributes = True


class ReviewRequest(BaseModel):
    """Employee-entered verified financials, submitted to run the model."""
    verified_monthly_income: float
    credit_line_usage: float
    debt_ratio: float
    late_30_59: int = 0
    late_60_89: int = 0
    late_90: int = 0
    open_credit_lines: int = 0


class ReviewResponse(BaseModel):
    application_id: int
    default_probability: float
    risk_verdict: str
    status: str


class DecisionRequest(BaseModel):
    decision: str                      # "ACCEPTED" or "REFUSED"


class DecisionResponse(BaseModel):
    application_id: int
    new_status: str
    email_sent: bool





# ══════════════════════════════════════════════════════════════════════════════
# APPLICANT ENDPOINT
# ══════════════════════════════════════════════════════════════════════════════

@app.post("/apply", status_code=status.HTTP_201_CREATED, summary="Submit a loan application")
def apply(
    # Personal / declared info
    full_name: Annotated[str, Form(...)],
    email: Annotated[str, Form(...)],
    phone: Annotated[str, Form(...)],
    age: Annotated[int, Form(...)],
    professional_status: Annotated[ProfessionalStatus, Form(...)],
    declared_monthly_income: Annotated[float, Form(...)],
    loan_amount: Annotated[float, Form(...)],
    # Documents (parallel lists: documents[i] has type document_types[i]).
    # Annotated[...] form is required here — List[UploadFile] = File(...)
    # generates a broken OpenAPI schema (array<string>) that makes Swagger UI
    # render a text box instead of a file picker.
    documents: Annotated[List[UploadFile], File(...)],
    document_types: Annotated[List[str], Form(...)],
    number_of_dependents: Annotated[int, Form()] = 0,
    real_estate_loans: Annotated[int, Form()] = 0,
    # Database session
    db: Session = Depends(get_db),
):
    # 1. Validate the document/type lists line up
    if len(documents) != len(document_types):
        raise HTTPException(
            status_code=422,
            detail="documents and document_types must have the same length.",
        )

    valid_types = {t.value for t in DocumentType}
    for doc_type in document_types:
        if doc_type not in valid_types:
            raise HTTPException(status_code=422, detail=f"Invalid document_type '{doc_type}'.")

    # 2. Save the application row — no prediction yet, employee-verified and
    #    model-output columns stay null until the employee review step.
    application = Application(
        full_name=full_name.strip(),
        email=email.strip().lower(),
        phone=phone.strip(),
        age=age,
        professional_status=professional_status,
        declared_monthly_income=declared_monthly_income,
        number_of_dependents=number_of_dependents,
        real_estate_loans=real_estate_loans,
        loan_amount=loan_amount,
        status=DecisionStatus.SUBMITTED,
    )
    db.add(application)
    db.flush()   # assigns application.id without committing yet

    # 3. Save the uploaded documents
    for upload_file, doc_type in zip(documents, document_types):
        ext = os.path.splitext(upload_file.filename)[-1].lower()
        safe_name = f"{uuid.uuid4().hex}{ext}"
        dest_path = os.path.join(UPLOAD_DIR, safe_name)

        with open(dest_path, "wb") as out:
            shutil.copyfileobj(upload_file.file, out)

        db.add(Document(
            application_id=application.id,
            document_type=DocumentType(doc_type),
            original_filename=upload_file.filename,
            stored_filename=safe_name,
            file_path=dest_path,
        ))

    # 4. Commit everything together
    db.commit()

    return {"message": "Application submitted successfully.", "application_id": application.id}




# ══════════════════════════════════════════════════════════════════════════════
# EMPLOYEE ENDPOINTS (protected — require a valid JWT)
# ══════════════════════════════════════════════════════════════════════════════

@app.get("/applications", response_model=List[ApplicationSummary], summary="List all applications")
def list_applications(
    employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    return db.query(Application).order_by(Application.created_at.desc()).all()


@app.get("/applications/{app_id}", response_model=ApplicationDetail, summary="One application in full")
def get_application(
    app_id: int,
    employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    application = db.query(Application).filter(Application.id == app_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found.")
    return application



@app.post("/applications/{app_id}/review", response_model=ReviewResponse, summary="Enter verified financials and run the model")
def review_application(
    app_id: int,
    body: ReviewRequest,
    employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    application = db.query(Application).filter(Application.id == app_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found.")

    if application.status != DecisionStatus.SUBMITTED:
        raise HTTPException(
            status_code=409,
            detail=f"Application is in status {application.status.value}; review can only run once, from SUBMITTED.",
        )

    # 1. Save the employee-verified fields
    application.verified_monthly_income = body.verified_monthly_income
    application.credit_line_usage = body.credit_line_usage
    application.debt_ratio = body.debt_ratio
    application.late_30_59 = body.late_30_59
    application.late_60_89 = body.late_60_89
    application.late_90 = body.late_90
    application.open_credit_lines = body.open_credit_lines

    # 2. Build the raw dict in the exact feature order the model expects.
    #    MonthlyIncome uses the VERIFIED income, never the declared one.
    #    MonthlyIncome_Was_Missing is hardcoded to 0: verified_monthly_income
    #    is mandatory here, so it is never missing by the time the model runs.
    raw = {
        "CreditLineUsage": body.credit_line_usage,
        "Age": application.age,
        "Late30to59Days": body.late_30_59,
        "DebtRatio": body.debt_ratio,
        "MonthlyIncome": body.verified_monthly_income,
        "OpenCreditLines": body.open_credit_lines,
        "Late90Days": body.late_90,
        "RealEstateLoans": application.real_estate_loans,
        "Late60to89Days": body.late_60_89,
        "Dependents": application.number_of_dependents,
        "MonthlyIncome_Was_Missing": 0,
    }

    # 3. Run the model
    probability = forward(scale_input(raw))
    verdict = RiskVerdict.HIGH_RISK if probability >= THRESHOLD else RiskVerdict.LOW_RISK

    application.default_probability = round(probability, 4)
    application.risk_verdict = verdict
    application.predicted_at = datetime.utcnow()
    application.status = DecisionStatus.PREDICTED

    db.commit()

    return ReviewResponse(
        application_id=application.id,
        default_probability=application.default_probability,
        risk_verdict=verdict.value,
        status=application.status.value,
    )


@app.post("/applications/{app_id}/decision", response_model=DecisionResponse, summary="Accept or refuse")
def make_decision(
    app_id: int,
    body: DecisionRequest,
    employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    if body.decision not in ("ACCEPTED", "REFUSED"):
        raise HTTPException(status_code=422, detail="Decision must be 'ACCEPTED' or 'REFUSED'.")

    application = db.query(Application).filter(Application.id == app_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found.")

    if application.status != DecisionStatus.PREDICTED:
        raise HTTPException(
            status_code=409,
            detail=f"Cannot decide before the model has run (status: {application.status.value}). "
                   f"Run POST /applications/{app_id}/review first.",
        )

    # Update the decision
    application.status = DecisionStatus[body.decision]
    application.decided_by_employee_id = employee.id
    application.decided_at = datetime.utcnow()

    # Send notification email to the applicant
    email_sent = send_decision_email(
        applicant_name=application.full_name,
        applicant_email=application.email,
        decision=body.decision,
    )
    application.email_sent = email_sent
    application.email_sent_at = datetime.utcnow() if email_sent else None
    db.commit()

    return DecisionResponse(
        application_id=application.id,
        new_status=application.status.value,
        email_sent=email_sent,
    )