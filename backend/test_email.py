import os
import sys
import django
from django.core.mail import send_mail

# Add backend to path and setup django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

def test_smtp():
    recipient = input("Enter recipient email address to send test email: ")
    if not recipient:
        print("Recipient email is required.")
        return

    print("Attempting to send email via SMTP...")
    try:
        send_mail(
            subject='Muallim SMTP Test',
            message='If you are reading this, your SMTP settings are configured correctly!',
            from_email=None,
            recipient_list=[recipient],
            fail_silently=False,
        )
        print("✓ Success! Email sent successfully.")
    except Exception as e:
        print("✗ Failed to send email:")
        print(f"Error type: {type(e).__name__}")
        print(f"Details: {str(e)}")

if __name__ == '__main__':
    test_smtp()
