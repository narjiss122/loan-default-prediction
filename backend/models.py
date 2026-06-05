import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base


class DecisionStatus(str, enum.Enum):
    PENDING  = "PENDING"
    ACCEPTED = "ACCEPTED"
    REFUSED  = "REFUSED"


class RiskVerdict(str, enum.Enum):
    LOW_RISK  = "LOW RISK"
    HIGH_RISK = "HIGH RISK"


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

    id           = Column(Integer, primary_key=True, index=True)
    submitted_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Personal info
    full_name = Column(String(120), nullable=False)
    email     = Column(String(120), nullable=False)
    phone     = Column(String(30),  nullable=True)

    # Financial inputs (raw values)
    age                = Column(Integer, nullable=False)
    monthly_income     = Column(Float,   nullable=False)
    credit_line_usage  = Column(Float,   nullable=False)
    debt_ratio         = Column(Float,   nullable=False)
    late_30_59_days    = Column(Integer, nullable=False, default=0)
    late_60_89_days    = Column(Integer, nullable=False, default=0)
    late_90_days       = Column(Integer, nullable=False, default=0)
    open_credit_lines  = Column(Integer, nullable=False, default=0)
    real_estate_loans  = Column(Integer, nullable=False, default=0)
    dependents         = Column(Integer, nullable=False, default=0)
    income_was_missing = Column(Boolean, nullable=False, default=False)

    # Model prediction
    default_probability = Column(Float, nullable=True)
    risk_verdict        = Column(Enum(RiskVerdict), nullable=True)

    # Officer decision
    status                 = Column(Enum(DecisionStatus), default=DecisionStatus.PENDING, nullable=False)
    decided_by_employee_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    decided_at             = Column(DateTime, nullable=True)

    # Email tracking
    email_sent    = Column(Boolean, default=False)
    email_sent_at = Column(DateTime, nullable=True)

    # Relationships
    documents   = relationship("Document", back_populates="application", cascade="all, delete-orphan")
    decided_by  = relationship("Employee")


class Document(Base):
    __tablename__ = "documents"

    id             = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False, index=True)
    doc_type          = Column(String(50),  nullable=False)
    original_filename = Column(String(255), nullable=False)
    stored_filename   = Column(String(255), nullable=False)
    file_path         = Column(String(512), nullable=False)
    uploaded_at       = Column(DateTime, default=datetime.utcnow)

    application = relationship("Application", back_populates="documents")