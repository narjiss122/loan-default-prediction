
"""Loan Default Risk Prediction API"""

import numpy as np
import json
from fastapi import FastAPI
from pydantic import BaseModel, Field

# ── Load model weights once at startup ────────────────────────────────────────
# Loading files is slow — we do it once when the server starts,
# not on every request.
weights      = np.load("model/model_weights.npz")
W1           = weights["W1"]   # (11, 16)
b1           = weights["b1"]   # (1, 16)
W2           = weights["W2"]   # (16, 1)
b2           = weights["b2"]   # (1, 1)

with open("model/scale_params.json", "r") as f:
    scale_params = json.load(f)

THRESHOLD = 0.4   # chosen in Document 2 for best F1 score

# ── Activation functions ───────────────────────────────────────────────────────
def relu(Z):
    return np.maximum(0, Z)

def sigmoid(Z):
    Z = np.clip(Z, -500, 500)
    return 1 / (1 + np.exp(-Z))

# ── Scaling ────────────────────────────────────────────────────────────────────
FEATURE_ORDER = [
    "CreditLineUsage", "Age", "Late30to59Days", "DebtRatio",
    "MonthlyIncome", "OpenCreditLines", "Late90Days",
    "RealEstateLoans", "Late60to89Days", "Dependents",
    "MonthlyIncome_Was_Missing"
]

def scale_input(raw: dict) -> np.ndarray:
    scaled = []
    for feature in FEATURE_ORDER:
        value = raw[feature]
        if feature == "MonthlyIncome_Was_Missing":
            scaled.append(float(value))
            continue
        f_min = scale_params[feature]["min"]
        f_max = scale_params[feature]["max"]
        v = float(np.clip((value - f_min) / (f_max - f_min), 0.0, 1.0))
        scaled.append(v)
    return np.array(scaled).reshape(1, -1)

# ── Inference ──────────────────────────────────────────────────────────────────
def forward(X):
    """Forward pass. X shape: (1, 11)."""
    Z1 = np.dot(X, W1) + b1   # (1, 16)
    A1 = relu(Z1)              # (1, 16)
    Z2 = np.dot(A1, W2) + b2  # (1, 1)
    A2 = sigmoid(Z2)           # (1, 1)
    return float(A2[0, 0])

# ── FastAPI app ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Loan Default Risk Prediction API",
    description="MLP built from scratch with NumPy — Narjiss Maimouni",
    version="1.0.0"
)

# ── Input schema ───────────────────────────────────────────────────────────────
# Pydantic validates every incoming request against this class.
# Field(...) marks a field as required and lets us add a description.
class ApplicantInput(BaseModel):
    CreditLineUsage        : float = Field(..., description="Ratio of credit used (raw, will be log-scaled internally)")
    Age                    : int   = Field(..., ge=18, le=120, description="Applicant age in years")
    Late30to59Days         : float = Field(..., ge=0,  description="Number of times 30-59 days late (raw count)")
    DebtRatio              : float = Field(..., ge=0,  description="Monthly debt payments / monthly gross income")
    MonthlyIncome          : float = Field(..., ge=0,  description="Monthly income — pass log1p value as used in preprocessing")
    OpenCreditLines        : float = Field(..., ge=0,  description="Number of open credit lines (raw count)")
    Late90Days             : float = Field(..., ge=0,  description="Number of times 90+ days late (raw count)")
    RealEstateLoans        : float = Field(..., ge=0,  description="Number of real estate loans (raw count)")
    Late60to89Days         : float = Field(..., ge=0,  description="Number of times 60-89 days late (raw count)")
    Dependents             : float = Field(..., ge=0,  description="Number of dependents (raw count)")
    MonthlyIncome_Was_Missing : int = Field(..., ge=0, le=1, description="1 if income was originally missing, 0 otherwise")

# ── Output schema ──────────────────────────────────────────────────────────────
class PredictionOutput(BaseModel):
    default_probability : float
    risk_verdict        : str
    threshold_used      : float

# ── Health check endpoint ──────────────────────────────────────────────────────
@app.get("/", summary="Health check")
def root():
    return {"message": "Loan Default Prediction API is running. Visit /docs to test it."}

# ── Prediction endpoint ────────────────────────────────────────────────────────
@app.post("/predict", response_model=PredictionOutput, summary="Predict default risk")
def predict(applicant: ApplicantInput):

    # Convert Pydantic model to plain dict
    raw = applicant.model_dump()

    # Scale the input
    X_scaled = scale_input(raw)

    # Run forward propagation
    probability = forward(X_scaled)

    # Apply threshold
    verdict = "HIGH RISK" if probability >= THRESHOLD else "LOW RISK"

    return PredictionOutput(
        default_probability=round(probability, 4),
        risk_verdict=verdict,
        threshold_used=THRESHOLD
    )
