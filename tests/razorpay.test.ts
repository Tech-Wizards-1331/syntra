import { describe, it, expect, beforeEach, afterEach } from "vitest";
import crypto from "crypto";
import { verifySignature, verifyWebhookSignature } from "../lib/services/razorpay";

describe("Razorpay Service", () => {
  const originalSecret = process.env.RAZORPAY_KEY_SECRET;
  const testSecret = "test_key_secret_123456";

  beforeEach(() => {
    process.env.RAZORPAY_KEY_SECRET = testSecret;
  });

  afterEach(() => {
    process.env.RAZORPAY_KEY_SECRET = originalSecret;
  });

  describe("verifySignature", () => {
    it("should return true for a valid signature", () => {
      const orderId = "order_abc123";
      const paymentId = "pay_xyz789";
      
      // Calculate valid signature manually
      const message = `${orderId}|${paymentId}`;
      const validSignature = crypto
        .createHmac("sha256", testSecret)
        .update(message)
        .digest("hex");

      const result = verifySignature(orderId, paymentId, validSignature);
      expect(result).toBe(true);
    });

    it("should return false for an invalid signature", () => {
      const orderId = "order_abc123";
      const paymentId = "pay_xyz789";
      const invalidSignature = "wrong_signature_hash";

      const result = verifySignature(orderId, paymentId, invalidSignature);
      expect(result).toBe(false);
    });
  });

  describe("verifyWebhookSignature", () => {
    it("should return true for a valid webhook signature", () => {
      const rawBody = JSON.stringify({ event: "payment.captured", entity: "event" });
      const webhookSecret = "test_webhook_secret_654321";
      
      const validSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

      const result = verifyWebhookSignature(rawBody, validSignature, webhookSecret);
      expect(result).toBe(true);
    });

    it("should return false for an invalid webhook signature", () => {
      const rawBody = JSON.stringify({ event: "payment.captured" });
      const webhookSecret = "test_webhook_secret_654321";
      const invalidSignature = "invalid_signature";

      const result = verifyWebhookSignature(rawBody, invalidSignature, webhookSecret);
      expect(result).toBe(false);
    });
  });
});
