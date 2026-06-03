---
status: complete
phase: 03-seating-service-and-razorpay-port
source:
  - 03-01-SUMMARY.md
started: 2026-06-03T13:20:45Z
updated: 2026-06-03T20:10:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Run Seating Allocation Simulation
expected: |
  Organizer opens `/organizer/dashboard/seating`, selects a hackathon, enters room configuration, clicks "Run Seating Allocation", and views simulated seat layouts with room-by-row grid details, occupied seat lists, and unallocated team members.
result: pass

### 2. Fragmented Bench Warning Highlight
expected: |
  Benches containing participants from more than one team are visually highlighted with an `amber-500` border, showing a warning indicator.
result: pass

### 3. Save Seating Layout
expected: |
  Clicking "Save Seating Layout" on `/organizer/dashboard/seating` saves the layout JSON to the database, showing a success message.
result: pass

### 4. Participant Payment Card Integration
expected: |
  Participant opens `/participant/dashboard`. If their team is unregistered/unpaid, they see a "Complete Registration" card showing the registration fee amount and a "Pay & Register Team" button.
result: pass

### 5. Razorpay Payment Gateway Checkout
expected: |
  Clicking "Pay & Register Team" launches the standard Razorpay payment overlay modal with correct details (name, email, fee amount).
result: pass

### 6. Signature-Verified Webhook Payment Completion
expected: |
  Simulating a Razorpay webhook (`payment.captured` or `order.paid`) with valid signature to `/api/payment/webhook` updates the payment status to "paid" and registers the team atomically in the database.
result: pass

## Summary

total: 6
passed: 6
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[none]
