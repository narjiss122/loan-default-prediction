# Loan Default Risk Prediction System
> Final Year Project (PFE) — A Multilayer Perceptron built from scratch in NumPy, deployed in a full-stack web application.

---

## Project Overview

This project implements an intelligent system that predicts the probability of loan default using a neural network built entirely from scratch — no TensorFlow, no PyTorch, only NumPy and matrix operations.

The model is integrated into a complete full-stack web application that reproduces a realistic two-role bank workflow: an **applicant** submits a request with supporting documents, and a **bank employee** reviews the documents, enters the verified financial data, runs the prediction, and issues the final decision. This separation is driven by data ownership — several decisive fields (debt ratio, credit-line usage, late-payment history) exist only in the consolidated credit report (*rapport de solvabilité*) and cannot be self-reported by the applicant.

---

## Project Status

| Component | Description | Status |
|---|---|---|
| Data Preprocessing | Cleaning, imbalance handling, scaling | ✅ Complete |
| Neural Network | MLP implemented from scratch in NumPy | ✅ Complete |
| Backend API | FastAPI, two-phase workflow, JWT auth | ✅ Complete |
| Database | MySQL (employees, applications, documents) | ✅ Complete |
| Frontend | React + Vite + Tailwind, 5 pages | ✅ Complete |
| Email Notifications | SMTP decision e-mails | ✅ Complete |

---

## Model Results

Evaluated on the held-out test set (12,008 samples) at the deployed decision threshold of 0.4:

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
- **Features:** 11 (including a `MonthlyIncome_Was_Missing` MNAR flag)
- **Target:** Default (0 = no default, 1 = default)
- **Imbalance handling:** the majority (non-defaulting) class was undersampled to 30,000 samples; the balanced data was split 70/30 into 28,018 training and 12,008 test samples (seed 42).

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

Forward pass convention (samples as rows):
```python
Z1 = np.dot(X, W1) + b1   # (n, 11) x (11, 16) = (n, 16)
Z2 = np.dot(A1, W2) + b2  # (n, 16) x (16, 1)  = (n, 1)
```

---

## Two-Phase Workflow & Main Endpoints

The prediction does **not** run when the applicant submits. It runs only after a bank employee has reviewed the documents and entered the verified financial fields.

| Method & endpoint | Access | Description |
|---|---|---|
| `POST /apply` | Public | Applicant submits declared fields + documents; saved as `SUBMITTED`. No model run. |
| `POST /applications/{id}/review` | Employee | Enters verified financial fields and runs the model; sets `PREDICTED`. |
| `POST /applications/{id}/decision` | Employee | Accepts/refuses and sends the e-mail. Requires `PREDICTED`. |
| `GET /applications` | Employee | Lists applications (status filtering). |
| `GET /applications/{id}` | Employee | Full detail of one application. |
| `GET /documents/{id}` | Employee | Serves an uploaded document for verification. |

Application lifecycle: `SUBMITTED → PREDICTED → ACCEPTED / REFUSED`

---

## Running the Project

Backend:
```bash
conda activate ml_basics
cd backend
uvicorn main:app --reload
```
API: `http://127.0.0.1:8000` — interactive docs at `http://127.0.0.1:8000/docs`

Frontend:
```bash
cd frontend
npm install
npm run dev
```

---

## Project Structure

```
PFE_Project/
├── backend/
│   ├── main.py              <- FastAPI application (two-phase workflow)
│   ├── database.py          <- MySQL connection
│   ├── models.py            <- SQLAlchemy table definitions
│   ├── auth.py              <- JWT authentication
│   ├── email_service.py     <- Decision e-mail notifications (SMTP)
│   └── uploads/             <- Uploaded applicant documents
├── data/
│   ├── processed/
│   │   └── clean_dataset.csv
│   └── raw/                 <- Not tracked (see Dataset section)
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── ApplicantForm.jsx
│   │   │   ├── Confirmation.jsx
│   │   │   ├── EmployerLogin.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   └── ApplicationDetail.jsx
│   │   ├── components/
│   │   └── App.jsx
│   └── index.html
├── model/
│   ├── model_weights.npz    <- Trained MLP weights (W1, b1, W2, b2)
│   └── scale_params.json    <- MinMax scaling parameters
├── notebooks/
│   ├── doc2_preprocessing.ipynb
│   └── doc3_neural_network.ipynb
└── README.md
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Neural Network | NumPy (from scratch) |
| Data Processing | Pandas, NumPy |
| Visualisation | Matplotlib |
| Backend API | FastAPI + Uvicorn |
| Input Validation | Pydantic |
| Database | MySQL + SQLAlchemy |
| Frontend | React + Vite + Tailwind CSS |
| Authentication | JWT + bcrypt |
| Email | SMTP / smtplib |

---

## Two-Role Web Application

**Applicant Portal** — A multi-step form where a loan applicant submits personal and financial information along with supporting documents that adapt to their professional status (salaried, self-employed, or retired). The applicant receives a confirmation and is later notified of the decision by e-mail.

**Bank Employee Dashboard** — A secured dashboard where staff log in, review submitted applications and their uploaded documents, enter the verified financial figures, run the model's risk prediction, and issue an Accept or Refuse decision. A notification e-mail is sent automatically to the applicant.

---

## Author

**Narjiss Maimouni**
Final Year Project (PFE) — Computer Science
Faculty of Sciences of Tétouan, Abdelmalek Essaadi University
2025–2026
