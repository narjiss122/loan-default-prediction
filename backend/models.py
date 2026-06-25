import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base


class ProfessionalStatus(str, enum.Enum):
    SALARIE       = "SALARIE"
    SELF_EMPLOYED = "SELF_EMPLOYED"
    RETIRED       = "RETIRED"


class DecisionStatus(str, enum.Enum):
    SUBMITTED = "SUBMITTED"  # awaiting employee review
    PREDICTED = "PREDICTED"  # financials entered + model run, awaiting decision
    ACCEPTED  = "ACCEPTED"
    REFUSED   = "REFUSED"


class RiskVerdict(str, enum.Enum):
    LOW_RISK  = "LOW RISK"
    HIGH_RISK = "HIGH RISK"


class DocumentType(str, enum.Enum):
    CIN                   = "CIN"
    BULLETINS             = "BULLETINS"
    ATTESTATION_TRAVAIL   = "ATTESTATION_TRAVAIL"
    RELEVES_BANCAIRES     = "RELEVES_BANCAIRES"
    RIB                   = "RIB"
    PATENTE_RC            = "PATENTE_RC"
    DECLARATION_FISCALE   = "DECLARATION_FISCALE"
    ATTESTATION_PENSION   = "ATTESTATION_PENSION"


class Employee(Base):
    __tablename__ = "employees"

    id            = Column(Integer, primary_key=True, index=True)
    full_name     = Column(String(120), nullable=False)
    email         = Column(String(120), unique=True, nullable=False, index=True)
    password_hash = Column(String(256), nullable=False)
    is_active     = Column(Boolean, default=True)
    created_at    = Column(DateTime, default=datetime.utcnow)


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)

    # --- Zone 1: Applicant-declared (not null, set at submission) ---
    full_name               = Column(String(120), nullable=False)
    email                   = Column(String(120), nullable=False)
    phone                   = Column(String(30),  nullable=False)
    age                     = Column(Integer, nullable=False)
    professional_status     = Column(Enum(ProfessionalStatus), nullable=False)
    declared_monthly_income = Column(Float,   nullable=False)
    number_of_dependents    = Column(Integer, nullable=False, default=0)
    real_estate_loans       = Column(Integer, nullable=False, default=0)
    loan_amount             = Column(Float,   nullable=False)
    created_at              = Column(DateTime, default=datetime.utcnow, index=True)

    # --- Zone 2: Employee-verified (nullable, set during review) ---
    verified_monthly_income = Column(Float,   nullable=True)
    credit_line_usage       = Column(Float,   nullable=True)
    debt_ratio              = Column(Float,   nullable=True)
    late_30_59              = Column(Integer, nullable=True)
    late_60_89              = Column(Integer, nullable=True)
    late_90                 = Column(Integer, nullable=True)
    open_credit_lines       = Column(Integer, nullable=True)

    # --- Zone 3: Model output (nullable, set when prediction runs) ---
    default_probability = Column(Float, nullable=True)
    risk_verdict         = Column(Enum(RiskVerdict, values_callable=lambda x: [e.value for e in x]), nullable=True)
    predicted_at          = Column(DateTime, nullable=True)

    # --- Zone 4: Decision / workflow ---
    status = Column(Enum(DecisionStatus), default=DecisionStatus.SUBMITTED, nullable=False)
    decided_by_employee_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    decided_at             = Column(DateTime, nullable=True)
    email_sent             = Column(Boolean, default=False)
    email_sent_at          = Column(DateTime, nullable=True)

    # Relationships
    documents   = relationship("Document", back_populates="application", cascade="all, delete-orphan")
    decided_by  = relationship("Employee")


class Document(Base):
    __tablename__ = "documents"

    id             = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False, index=True)
    document_type     = Column(Enum(DocumentType), nullable=False)
    original_filename = Column(String(255), nullable=False)
    stored_filename   = Column(String(255), nullable=False)
    file_path         = Column(String(512), nullable=False)
    uploaded_at       = Column(DateTime, default=datetime.utcnow)

    application = relationship("Application", back_populates="documents")

    