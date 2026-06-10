# Technical Research: Phase 3 (Seating Service & Razorpay Port)

## 1. Seating Allocation Algorithm Port

The seating allocation algorithm handles room assignment, section layout ordering, contiguous block fitting, and multi-priority seat placement. 

### Data Structure Mappings

```typescript
export interface TeamMemberInput {
  name: string;
  email: string;
}

export interface TeamAllocationInput {
  name: string;
  members: string[]; // List of names or emails
}

export interface RoomColumnConfig {
  bench_count: number;
  capacity: number;
}

export interface RoomConfig {
  room_no: string;
  type?: "open" | "configured";
  total_seats?: number;
  seats_per_row?: number;
  columns?: RoomColumnConfig[];
}

export interface BenchSlot {
  room: string;
  room_type: string;
  section: string;
  row: string;
  row_number: number;
  bench: number;
  seat_number?: number;
  capacity: number;
  assigned: Array<{ member: string; team: string }>;
}

export interface SeatAllocation {
  room: string;
  section: string;
  row: string;
  bench: number;
  seats: number[];
  members: string[];
}

export interface TeamAllocationResult {
  name: string;
  members: string[];
  member_count: number;
  seats: SeatAllocation[];
  proximity_score: number;
  unallocated: string[];
}
```

### Proximity Scoring Logic
Proximity scores are calculated in TS to ensure exact parity with python:
$$Score = \max(0, 100 - (rooms - 1) \times 50 - (rows - 1) \times 10 - (benches - 1) \times 2)$$

---

## 2. Razorpay Integration & REST Authentication

### Order Creation (Basic Auth API Request)
Instead of importing the large Razorpay Node SDK, we can use standard `fetch` with HTTP Basic Auth headers, matching the original Python `requests` logic.

```typescript
export async function createRazorpayOrder(amount: number, receipt: string) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay API credentials are not configured.");
  }

  // Razorpay expects amounts in paise (INR * 100)
  const amountInPaise = Math.round(amount * 100);

  const authHeader = "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    body: JSON.stringify({
      amount: amountInPaise,
      currency: "INR",
      receipt,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Razorpay API Error: ${response.statusText} - ${errorText}`);
  }

  return response.json();
}
```

### Signature Verification (HMAC-SHA256)
Webhooks and frontend client verifications compute HMAC-SHA256 signatures:

```typescript
import crypto from "crypto";

export function verifySignature(orderId: string, paymentId: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;

  const text = `${orderId}|${paymentId}`;
  const generatedSignature = crypto
    .createHmac("sha256", secret)
    .update(text)
    .digest("hex");

  const generatedBuffer = Buffer.from(generatedSignature, "hex");
  const signatureBuffer = Buffer.from(signature, "hex");

  if (generatedBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(generatedBuffer, signatureBuffer);
}
```

### Webhook Verification
Razorpay Webhook events (e.g., `payment.captured`) include an `x-razorpay-signature` header:

```typescript
export function verifyWebhookSignature(rawBody: string, signature: string, webhookSecret: string): boolean {
  const generatedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  const generatedBuffer = Buffer.from(generatedSignature, "hex");
  const signatureBuffer = Buffer.from(signature, "hex");

  if (generatedBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(generatedBuffer, signatureBuffer);
}
```

---

## 3. Database Updates and Transaction Context

When marking a payment as paid, we must perform a transaction to:
1. Update `participant_payment` status from `pending` to `paid`.
2. Update the corresponding `participant_team.is_registered = true`.

```typescript
import { prisma } from "@/lib/prisma";

export async function processPaymentSuccess(
  paymentId: number,
  teamId: number,
  razorpayPaymentId: string,
  razorpaySignature: string
) {
  return await prisma.$transaction([
    prisma.participant_payment.update({
      where: { id: paymentId },
      data: {
        status: "paid",
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
        updated_at: new Date(),
      },
    }),
    prisma.participant_team.update({
      where: { id: teamId },
      data: {
        is_registered: true,
        updated_at: new Date(),
      },
    }),
  ]);
}
```
