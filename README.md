# Loan Default Risk Prediction System
> Final Year Project — Multilayer Perceptron built from scratch using NumPy

---

## Project Overview

This project implements an intelligent system that predicts the probability of loan default using a neural network built entirely from scratch — no TensorFlow, no PyTorch, only NumPy and matrix operations.

The system goes beyond a simple model: it is deployed as a REST API and will be integrated into a full-stack web application that simulates a real bank loan assessment workflow.

---

## Project Status

| Document | Description | Status |
|---|---|---|
| Document 1 | System Design | ✅ Complete |
| Document 2 | Data Preprocessing | ✅ Complete |
| Document 3 | Neural Network Implementation | ✅ Complete |
| Document 4 | FastAPI Deployment | 🔄 In Progress |
| Document 5 | Full-Stack Web Application | ⏳ Planned |

---

## Model Results

| Metric | Value |
|---|---|
| Test Accuracy | 82.00% |
| Precision | 0.6396 |
| Recall | 0.6419 |
| F1 Score | 0.6407 |
| Decision Threshold | 0.4 |

---

## Dataset

- **Source:** Give Me Some Credit — [Kaggle](https://www.kaggle.com/c/GiveMeSomeCredit)
- **Original size:** 150,000 rows
- **After preprocessing:** 40,026 rows × 11 features
- **Target:** Default (0 = no default, 1 = default)
- **Class balance:** 75% no default / 25% default (after undersampling)

> Raw data files are not tracked by Git due to file size. Download the original dataset from the Kaggle link above and place it in `data/raw/`.

---

## Neural Network Architecture

```
Input Layer       →   11 financial features
Hidden Layer      →   16 neurons, ReLU activation
Output Layer      →   1 neuron, Sigmoid activation
Loss Function     →   Binary Cross-Entropy
Learning Rate     →   0.5
Epochs            →   3000
```

Forward pass convention:
```python
Z1 = np.dot(X, W1) + b1   # (n, 11) × (11, 16) = (n, 16)
Z2 = np.dot(A1, W2) + b2  # (n, 16) × (16, 1)  = (n, 1)
```

---

## API Usage

Start the server:
```bash
conda activate ml_basics
cd backend
uvicorn main:app --reload
```

The API will be available at `http://127.0.0.1:8000`  
Interactive documentation: `http://127.0.0.1:8000/docs`

### Example request

```bash
curl -X POST "http://127.0.0.1:8000/predict" \
     -H "Content-Type: application/json" \
     -d '{
       "CreditLineUsage": 0.3,
       "Age": 38,
       "Late30to59Days": 0,
       "DebtRatio": 0.2,
       "MonthlyIncome": 6000,
       "OpenCreditLines": 3,
       "Late90Days": 0,
       "RealEstateLoans": 1,
       "Late60to89Days": 0,
       "Dependents": 1,
       "MonthlyIncome_Was_Missing": 0
     }'
```

### Example response

```json
{
  "default_probability": 0.1823,
  "risk_verdict": "LOW RISK",
  "threshold_used": 0.4
}
```

> **Note:** Pass raw values — the API applies log1p transformation and MinMax scaling internally.

---

## Project Structure

```
PFE_Project/
├── backend/
│   ├── main.py              ← FastAPI application
│   ├── database.py          ← MySQL connection
│   ├── models.py            ← Database table definitions
│   ├── auth.py              ← JWT authentication
│   ├── email_service.py     ← Email notifications (SMTP)
│   └── uploads/             ← Uploaded applicant documents
├── data/
│   ├── processed/
│   │   └── clean_dataset.csv
│   └── raw/                 ← Not tracked (see Dataset section)
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── ApplicantForm.jsx
│   │   │   ├── Confirmation.jsx
│   │   │   ├── OfficerLogin.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   └── ApplicationDetail.jsx
│   │   ├── components/
│   │   └── App.jsx
│   └── index.html
├── model/
│   ├── model_weights.npz    ← Trained MLP weights (W1, b1, W2, b2)
│   └── scale_params.json    ← MinMax scaling parameters
├── notebooks/
│   ├── doc2_preprocessing.ipynb
│   ├── doc3_neural_network.ipynb
│   └── doc4_FastAPI_Deployment.ipynb
├── UML diagrams/
│   ├── use_case_diagram.svg
│   ├── class_diagram.svg
│   └── sequence_diagram.svg
└── README.md
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Neural Network | NumPy (from scratch) |
| Data Processing | Pandas, NumPy |
| Visualisation | Matplotlib |
| Backend API | FastAPI + uvicorn |
| Input Validation | Pydantic |
| Database | MySQL |
| Frontend | React + Tailwind CSS *(planned)* |
| Authentication | JWT tokens *(planned)* |
| Email | SMTP / smtplib *(planned)* |

---

## Planned Web Application

The final version of this project will include a full-stack web application with two interfaces:

**Applicant Portal** — A multi-step form where a loan applicant submits their personal and financial information along with supporting documents (ID card, bank statement, work certificate). The applicant receives a confirmation and waits for the bank's decision.

**Bank Employee Dashboard** — A secured dashboard where bank staff can log in, review all submitted applications, see the model's risk prediction for each applicant, and issue an Accept or Refuse decision. The system automatically sends a notification email to the applicant in French.

---

## Author

**Narjiss Maimouni**  
Final Year Project — Computer Science  
May 2026
