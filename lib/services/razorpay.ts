import crypto from "crypto";

/**
 * Create a Razorpay order via REST API.
 * Amount is in INR (rupees). Razorpay expects paise, so we multiply by 100.
 */
export async function createRazorpayOrder(amount: number, receipt: string): Promise<any> {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials are not configured in environment variables.");
  }

  const orderAmount = Math.round(amount * 100);

  const payload = {
    amount: orderAmount,
    currency: "INR",
    receipt: receipt,
  };

  const authString = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${authString}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Razorpay order creation failed: ${response.statusText} - ${errorText}`);
  }

  return response.json();
}

/**
 * Verify Razorpay payment signature using HMAC-SHA256.
 * Verifies frontend client returns where message is "razorpay_order_id|razorpay_payment_id".
 */
export function verifySignature(orderId: string, paymentId: string, signature: string): boolean {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    throw new Error("RAZORPAY_KEY_SECRET is not configured in environment variables.");
  }

  if (!orderId || !paymentId || !signature) {
    return false;
  }

  const message = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(message)
    .digest("hex");

  try {
    const expectedBuffer = Buffer.from(expectedSignature, "utf-8");
    const signatureBuffer = Buffer.from(signature, "utf-8");

    if (expectedBuffer.length !== signatureBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
  } catch (error) {
    return false;
  }
}

/**
 * Validates webhook payloads by computing HMAC-SHA256 of raw text body against the signature.
 */
export function verifyWebhookSignature(rawBody: string, signature: string, webhookSecret: string): boolean {
  if (!rawBody || !signature || !webhookSecret) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  try {
    const expectedBuffer = Buffer.from(expectedSignature, "utf-8");
    const signatureBuffer = Buffer.from(signature, "utf-8");

    if (expectedBuffer.length !== signatureBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
  } catch (error) {
    return false;
  }
}
