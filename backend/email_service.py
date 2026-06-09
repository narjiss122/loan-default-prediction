"""Email notification service — sends accept/refuse emails to applicants in French."""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

SMTP_HOST      = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT      = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER      = os.getenv("SMTP_USER", "")
SMTP_PASSWORD  = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "Banque Crédit Personnel")


def _build_email_content(full_name: str, decision: str) -> tuple[str, str]:
    """Returns (subject, body) based on the decision."""

    first_name = full_name.strip().split()[0]  # just the first name for the greeting

    if decision == "ACCEPTED":
        subject = "Votre demande de crédit a été acceptée"
        body = f"""Madame, Monsieur {full_name},

Nous avons le plaisir de vous informer que votre demande de crédit a été examinée et acceptée par nos services.

Un conseiller vous contactera prochainement pour finaliser les démarches nécessaires.

Nous vous remercions de votre confiance et restons à votre disposition pour toute question.

Cordialement,
{SMTP_FROM_NAME}"""

    else:  # REFUSED
        subject = "Votre demande de crédit — Suite donnée"
        body = f"""Madame, Monsieur {full_name},

Nous avons bien reçu et examiné votre demande de crédit avec toute l'attention qu'elle mérite.

Après étude approfondie de votre dossier, nous sommes dans l'obligation de vous informer que nous ne sommes pas en mesure de donner une suite favorable à votre demande.

Cette décision ne remet pas en cause votre situation personnelle. Nous vous encourageons à nous contacter si vous souhaitez plus d'informations.

Nous vous remercions de votre compréhension.

Cordialement,
{SMTP_FROM_NAME}"""

    return subject, body




def send_decision_email(applicant_name: str, applicant_email: str, decision: str) -> bool:
    """
    Sends an acceptance or refusal email to the applicant.
    Returns True if sent successfully, False if anything fails.
    """
    try:
        subject, body = _build_email_content(applicant_name, decision)

        # Build the email object
        msg = MIMEMultipart()
        msg["From"]    = f"{SMTP_FROM_NAME} <{SMTP_USER}>"
        msg["To"]      = applicant_email
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain", "utf-8"))

        # Connect, login, send
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()        # encrypts the connection
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_USER, applicant_email, msg.as_string())

        return True

    except Exception as e:
        print(f"[email_service] Failed to send email to {applicant_email}: {e}")
        return False