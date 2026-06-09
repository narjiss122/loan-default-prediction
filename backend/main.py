"""Loan Default Risk Prediction API"""

import os
import json
import shutil
import uuid
from datetime import datetime
from typing import List, Optional

import numpy as np
from fastapi import FastAPI, Depends, HTTPException, status, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from database import Base, engine, get_db
from models import Application, Document, Employee, DecisionStatus, RiskVerdict
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
    allow_origins=["http://localhost:5173"],   # Vite dev server
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
    doc_type: str
    original_filename: str
    uploaded_at: datetime

    class Config:
        from_attributes = True


class ApplicationSummary(BaseModel):
    """One row in the applications list (dashboard table)."""
    id: int
    submitted_at: datetime
    full_name: str
    email: str
    status: str
    risk_verdict: Optional[str]
    default_probability: Optional[float]

    class Config:
        from_attributes = True


class ApplicationDetail(BaseModel):
    """Full application data for the detail page."""
    id: int
    submitted_at: datetime
    full_name: str
    email: str
    phone: Optional[str]
    age: int
    monthly_income: float
    credit_line_usage: float
    debt_ratio: float
    late_30_59_days: int
    late_60_89_days: int
    late_90_days: int
    open_credit_lines: int
    real_estate_loans: int
    dependents: int
    income_was_missing: bool
    default_probability: Optional[float]
    risk_verdict: Optional[str]
    status: str
    decided_at: Optional[datetime]
    email_sent: bool
    documents: List[DocumentOut]

    class Config:
        from_attributes = True


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
    # Personal info
    full_name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(""),
    # Financial info
    age: int = Form(...),
    monthly_income: float = Form(...),
    credit_line_usage: float = Form(...),
    debt_ratio: float = Form(...),
    late_30_59_days: int = Form(0),
    late_60_89_days: int = Form(0),
    late_90_days: int = Form(0),
    open_credit_lines: int = Form(0),
    real_estate_loans: int = Form(0),
    dependents: int = Form(0),
    income_was_missing: bool = Form(False),
    # Documents
    id_card: UploadFile = File(...),
    bank_statement: UploadFile = File(...),
    work_certificate: UploadFile = File(...),
    # Database session
    db: Session = Depends(get_db),
):
    # 1. Build the raw dict in the exact feature order the model expects
    raw = {
        "CreditLineUsage": credit_line_usage,
        "Age": age,
        "Late30to59Days": late_30_59_days,
        "DebtRatio": debt_ratio,
        "MonthlyIncome": monthly_income,
        "OpenCreditLines": open_credit_lines,
        "Late90Days": late_90_days,
        "RealEstateLoans": real_estate_loans,
        "Late60to89Days": late_60_89_days,
        "Dependents": dependents,
        "MonthlyIncome_Was_Missing": int(income_was_missing),
    }

    # 2. Run the model
    probability = forward(scale_input(raw))
    verdict = "HIGH RISK" if probability >= THRESHOLD else "LOW RISK"

    # 3. Save the application row
    application = Application(
        full_name=full_name.strip(),
        email=email.strip().lower(),
        phone=phone.strip() or None,
        age=age,
        monthly_income=monthly_income,
        credit_line_usage=credit_line_usage,
        debt_ratio=debt_ratio,
        late_30_59_days=late_30_59_days,
        late_60_89_days=late_60_89_days,
        late_90_days=late_90_days,
        open_credit_lines=open_credit_lines,
        real_estate_loans=real_estate_loans,
        dependents=dependents,
        income_was_missing=income_was_missing,
        default_probability=round(probability, 4),
        risk_verdict=RiskVerdict.HIGH_RISK if verdict == "HIGH RISK" else RiskVerdict.LOW_RISK,
        status=DecisionStatus.PENDING,
    )
    db.add(application)
    db.flush()   # assigns application.id without committing yet

    # 4. Save the uploaded documents
    uploads = [
        (id_card, "id_card"),
        (bank_statement, "bank_statement"),
        (work_certificate, "work_certificate"),
    ]
    for upload_file, doc_type in uploads:
        ext = os.path.splitext(upload_file.filename)[-1].lower()
        safe_name = f"{uuid.uuid4().hex}{ext}"
        dest_path = os.path.join(UPLOAD_DIR, safe_name)

        with open(dest_path, "wb") as out:
            shutil.copyfileobj(upload_file.file, out)

        db.add(Document(
            application_id=application.id,
            doc_type=doc_type,
            original_filename=upload_file.filename,
            stored_filename=safe_name,
            file_path=dest_path,
        ))

    # 5. Commit everything together
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
    return db.query(Application).order_by(Application.submitted_at.desc()).all()


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

    if application.status != DecisionStatus.PENDING:
        raise HTTPException(status_code=409, detail=f"Already decided: {application.status.value}.")

    # Update the decision
    application.status = DecisionStatus[body.decision]
    application.decided_by_employee_id = employee.id
    application.decided_at = datetime.utcnow()

    # Email comes in Step 4 (email_service.py) — placeholder for now
    # Send notification email to the applicant
    email_sent = send_decision_email(
        applicant_name=application.full_name,
        applicant_email=application.email,
        decision=body.decision,
    )
    application.email_sent = email_sent
    db.commit()

    return DecisionResponse(
        application_id=application.id,
        new_status=application.status.value,
        email_sent=email_sent,
    )