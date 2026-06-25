# 🚀 Home Services Platform: Core Workflow & Architecture

This document defines the enterprise-grade workflow, state machine, and architectural choices designed for maximum robustness, top 1% performance, and scalability.

## 1. High-Level Architecture & Performance Choices
To achieve real-time performance and handle high concurrency:
- **Primary Database:** PostgreSQL (with PostGIS for advanced geospatial queries) or MongoDB (with 2dsphere indexes).
- **In-Memory Cache & Geospatial:** Redis (for caching service categories, managing real-time technician locations `GEOADD`, and fast radius queries `GEORADIUS`).
- **Real-Time Communication:** WebSockets (Socket.io or AWS API Gateway WebSockets) for live tracking and instant booking requests.
- **Background Jobs:** Redis/BullMQ or AWS SQS for processing the Radius-Expansion matchmaking without blocking the main event loop.

---

## 2. The Booking State Machine (Strict Flow)
A robust system relies on strict state transitions to prevent race conditions.

`CREATED` ➔ `BROADCASTING` ➔ `TECH_ACCEPTED` ➔ `CUSTOMER_CONFIRMED` ➔ `IN_TRANSIT` ➔ `IN_PROGRESS` ➔ `COMPLETED`

**Exception States:** `CANCELLED_BY_CUSTOMER`, `CANCELLED_BY_TECH`, `EXPIRED` (No tech accepted), `DISPUTED` (Conflict at completion).

---

## 3. Detailed End-to-End Workflow

### Step 1: Customer Booking Creation
1. **Service Selection:** Customer selects a category. (Categories are fetched from Redis Cache in < 10ms).
2. **Details Collection:** Customer provides Auto-GPS (Lat/Lng), precise address, problem description, optional images, and urgency level.
3. **Initialization:** Booking created with status `CREATED`.

### Step 2: Intelligent Matchmaking (Radius Expansion Algorithm)
*We do not broadcast to all 50 technicians at once (prevents 49 rejection errors).*
1. **Initial Batch:** System queries Redis Geo for top 3-5 available, qualified technicians within a **3km radius**.
2. **State:** Booking enters `BROADCASTING`.
3. **Queue:** A background worker sends push notifications/WebSocket events to Batch 1.
4. **Expansion:** If no acceptance in 45 seconds, the worker expands the radius to **5km**, selects the next 5 technicians, and broadcasts.
5. **Timeout:** If no acceptance after max radius (e.g., 15km), state becomes `EXPIRED`, and the customer is notified.

### Step 3: Technician Acceptance & Pre-conditions
1. **Pre-condition Check:** Before a technician can even see the broadcast, the system verifies their `technician_wallets` balance is ≥ 50₹.
2. **Acceptance:** Technician clicks "Accept". The system uses an atomic lock (Redis Lock or DB Row Lock) to ensure only ONE technician can claim the job.
3. **State Change:** Booking becomes `TECH_ACCEPTED`. Customer details (Name, Address) are unmasked.

### Step 4: Customer Confirmation & Masked Communication
1. Customer receives the technician's profile (Name, Rating, Distance, ETA).
2. Customer confirms. State becomes `CUSTOMER_CONFIRMED`.
3. **Communication:** Both parties can call each other using a masked communication API (e.g., Twilio) to protect privacy.
4. Technician clicks "Start Journey". State becomes `IN_TRANSIT`. Real-time location is streamed via WebSockets.

### Step 5: Service Execution & Fraud Prevention (OTP + Geofence)
1. **Arrival & Start:** Technician arrives. *Geofence Check:* System verifies technician's GPS is within 200m of the customer. Technician enters the **Start OTP** (provided by the customer). State ➔ `IN_PROGRESS`.
2. **Completion:** Technician finishes the job and requests completion. Customer provides the **End OTP**. State ➔ `COMPLETED`.

### Step 6: Automated Financial Ledger (Wallet Escrow)
1. **Deduction:** Upon `COMPLETED`, the system atomically debits 50₹ from the `technician_wallets` and logs it in `wallet_transactions`.
2. **Threshold Enforcement:** If the wallet balance drops below 50₹, the technician's `is_online` status is forcefully set to `false`, pausing future broadcasts until recharge.

---

## 4. Edge Cases, Cancellations & Dispute Matrix

To handle the "Unhappy Path" gracefully:

| Scenario | State Triggered | Consequence / Action |
| :--- | :--- | :--- |
| Customer cancels in `CREATED` or `BROADCASTING` | `CANCELLED_BY_CUSTOMER` | No penalty. |
| Customer cancels while `IN_TRANSIT` | `CANCELLED_BY_CUSTOMER` | Customer charged a small cancellation fee (next booking); Tech receives a tiny compensation. |
| Tech cancels after `CUSTOMER_CONFIRMED` | `CANCELLED_BY_TECH` | Tech's rating penalized; repeated offenses lead to temporary ban. |
| Customer refuses to give End OTP | `DISPUTED` | 50₹ fee held in escrow. Admin intervention required to resolve. |