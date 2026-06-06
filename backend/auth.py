import os
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from database import get_db
from models import Employee

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-this-in-production")
ALGORITHM  = "HS256"
TOKEN_EXPIRE_HOURS = 8


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)




def create_access_token(employee_id: int, email: str) -> str:
    expire = datetime.utcnow() + timedelta(hours=TOKEN_EXPIRE_HOURS)
    payload = {
        "sub": str(employee_id),
        "email": email,
        "exp": expire,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)



oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")


def get_current_employee(
    token: str = Depends(oauth2_scheme),
    db:    Session = Depends(get_db),
) -> Employee:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload     = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        employee_id = int(payload.get("sub"))
    except (JWTError, TypeError, ValueError):
        raise credentials_error

    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if employee is None or not employee.is_active:
        raise credentials_error

    return employee



router = APIRouter(tags=["Authentication"])


class RegisterRequest(BaseModel):
    full_name: str
    email:     EmailStr
    password:  str


class RegisterResponse(BaseModel):
    id:         int
    full_name:  str
    email:      str
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"






@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new bank employee account",
)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(Employee).filter(Employee.email == body.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"An employee with email '{body.email}' already exists.",
        )

    if len(body.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Password must be at least 8 characters.",
        )

    employee = Employee(
        full_name     = body.full_name.strip(),
        email         = body.email.lower().strip(),
        password_hash = hash_password(body.password),
    )
    db.add(employee)
    db.commit()
    db.refresh(employee)
    return employee



@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Employee login — returns a JWT access token",
)
def login(
    form: OAuth2PasswordRequestForm = Depends(),
    db:   Session = Depends(get_db),
):
    employee = db.query(Employee).filter(
        Employee.email == form.username.lower().strip()
    ).first()

    if not employee or not verify_password(form.password, employee.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not employee.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated.",
        )

    token = create_access_token(employee.id, employee.email)
    return TokenResponse(access_token=token)