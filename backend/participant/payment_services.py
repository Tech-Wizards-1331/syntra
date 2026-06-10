import hashlib
import hmac
import requests
from django.conf import settings
from .models import Payment


def get_razorpay_auth():
    """Return HTTP Basic Auth tuple for Razorpay API."""
    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        raise ValueError("Razorpay keys are not configured in settings.")
    return (settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)


def create_razorpay_order(amount, team, user):
    """
    Create a Razorpay order via REST API.
    amount is in INR (rupees). Razorpay expects paise, so we multiply by 100.
    """
    auth = get_razorpay_auth()

    order_amount = int(amount * 100)
    order_receipt = f"team_{team.id}_user_{user.id}"

    payload = {
        'amount': order_amount,
        'currency': 'INR',
        'receipt': order_receipt,
    }

    response = requests.post(
        'https://api.razorpay.com/v1/orders',
        json=payload,
        auth=auth,
        timeout=15,
    )
    response.raise_for_status()
    razorpay_order = response.json()

    # Create the pending payment record
    payment = Payment.objects.create(
        team=team,
        user=user,
        amount=amount,
        razorpay_order_id=razorpay_order['id'],
        status='pending',
    )

    return razorpay_order, payment


def verify_razorpay_signature(order_id, payment_id, signature):
    """
    Verify Razorpay payment signature using HMAC-SHA256.
    No SDK needed — this is a standard cryptographic check.
    """
    if not order_id or not payment_id or not signature:
        return False

    secret = settings.RAZORPAY_KEY_SECRET.encode('utf-8')
    message = f"{order_id}|{payment_id}".encode('utf-8')

    expected_signature = hmac.new(secret, message, hashlib.sha256).hexdigest()

    return hmac.compare_digest(expected_signature, signature)
