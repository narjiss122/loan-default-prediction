"""Email notification service — sends accept/refuse emails to applicants in English."""

import logging
import os
import smtplib
from email.header import Header
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formataddr
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("email_service")

SMTP_HOST      = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT      = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER      = os.getenv("SMTP_USER", "")
SMTP_PASSWORD  = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "Banque Crédit Personnel")


def _build_email_content(full_name: str, decision: str) -> tuple[str, str]:
    """Returns (subject, body) based on the decision."""

    first_name = full_name.strip().split()[0]  # just the first name for the greeting

    if decision == "ACCEPTED":
        subject = "Your Loan Application — Decision"
        body = f"""Dear {first_name},

Good news — your loan application has been approved. An advisor will contact you shortly with the next steps.

Thank you for choosing us.

Best regards,
{SMTP_FROM_NAME}"""

    else:  # REFUSED
        subject = "Your Loan Application — Decision"
        body = f"""Dear {first_name},

After careful review, we are unable to approve your loan application at this time.

Thank you for your understanding.

Best regards,
{SMTP_FROM_NAME}"""

    return subject, body




def send_decision_email(applicant_name: str, applicant_email: str, decision: str) -> bool:
    """
    Sends an acceptance or refusal email to the applicant.
    Returns True if sent successfully, False if anything fails.
    """
    try:
        subject, body = _build_email_content(applicant_name, decision)

        # Build the email object. formataddr + Header RFC-2047-encode the
        # display name so a non-ASCII sender name ("Banque Crédit Personnel")
        # doesn't produce a malformed header — un-encoded UTF-8 in headers can
        # get a message silently flagged as spam by some receiving servers.
        msg = MIMEMultipart()
        msg["From"]    = formataddr((str(Header(SMTP_FROM_NAME, "utf-8")), SMTP_USER))
        msg["To"]      = applicant_email
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain", "utf-8"))

        # Connect, login, send
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()        # encrypts the connection
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_USER, applicant_email, msg.as_string())

        logger.info("Decision email sent to %s (decision=%s)", applicant_email, decision)
        return True

    except smtplib.SMTPAuthenticationError:
        logger.exception("SMTP authentication failed while emailing %s — check SMTP_USER/SMTP_PASSWORD.", applicant_email)
        return False
    except smtplib.SMTPRecipientsRefused:
        logger.exception("SMTP server refused recipient %s.", applicant_email)
        return False
    except smtplib.SMTPException:
        logger.exception("SMTP error while sending decision email to %s.", applicant_email)
        return False
    except OSError:
        logger.exception("Network/connection error while sending decision email to %s.", applicant_email)
        return False