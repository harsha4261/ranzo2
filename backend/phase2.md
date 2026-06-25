# 🗄️ Home Services: Database Schema & Collections (Phase 2)

All screen common elements for `Customer` role:
- Footer nav: Home, Dashboard (Active Bookings), Book (+), History.
- Header right: Profile (Allows role-specific profile view and edit).

---

## Enterprise-Grade Collections Architecture

*Note: All collections should automatically include `created_at`, `updated_at`, and `deleted_at` (for soft deletes).*

### 1. bookings
The core state machine. Requires strict indexing on `status`, `technician_id`, and a Geospatial index on `location`.
```json
{
    "id": "uuid",
    "customer_id": "ForeignKey(customer_profile.id) [INDEX]",
    "technician_id": "ForeignKey(technician_profile.id) [INDEX] // Nullable initially",
    "status": "ENUM(CREATED, BROADCASTING, TECH_ACCEPTED, CUSTOMER_CONFIRMED, IN_TRANSIT, IN_PROGRESS, COMPLETED, CANCELLED_BY_CUSTOMER, CANCELLED_BY_TECH, EXPIRED, DISPUTED) [INDEX]",
    "category": "String",
    "location": {
        "type": "Point",
        "coordinates": "[longitude, latitude]" // Requires 2dsphere / PostGIS Index
    },
    "address_details": {
        "house_flat": "String",
        "landmark": "String",
        "city": "String",
        "zip_code": "String"
    },
    "problem_description": "String",
    "images": ["Array of Image URLs"],
    "urgency_level": "ENUM(LOW, NORMAL, HIGH, EMERGENCY)",
    "verification": {
        "start_otp": "String",
        "end_otp": "String"
    },
    "timeline": {
        "booked_at": "Timestamp",
        "accepted_at": "Timestamp",
        "started_at": "Timestamp",
        "completed_at": "Timestamp"
    }
}
```

### 2. technician_wallets
Handles the high-frequency reads for balance checking before broadcasting.
```json
{
    "technician_id": "ForeignKey(technician_profile.id) [Primary Key]",
    "balance": "Decimal (Precision: 10, Scale: 2)",
    "currency": "String (Default: 'INR')",
    "status": "ENUM(ACTIVE, SUSPENDED_LOW_BALANCE)",
    "last_recharge_date": "Timestamp"
}
```

### 3. wallet_transactions
Immutable ledger for financial auditing.
```json
{
    "id": "uuid",
    "technician_id": "ForeignKey(technician_profile.id) [INDEX]",
    "type": "ENUM(CREDIT, DEBIT, REFUND)",
    "amount": "Decimal",
    "running_balance": "Decimal // Snapshot of balance after transaction",
    "description": "String",
    "related_booking_id": "ForeignKey(bookings.id) // Nullable",
    "idempotency_key": "String [UNIQUE] // Prevents double deductions"
}
```

### 4. technician_locations (Redis / High-Speed Cache)
*Do not store this in the primary transactional DB if tracking live.* This should be a Redis Geospatial key or an In-Memory DB.
```json
{
    "technician_id": "uuid",
    "location": {
        "latitude": "Float",
        "longitude": "Float"
    },
    "current_status": "ENUM(ONLINE, OFFLINE, BUSY)",
    "last_ping_at": "Timestamp // Tech app must ping every 10 seconds"
}
```

### 5. reviews & disputes
```json
{
    "id": "uuid",
    "booking_id": "ForeignKey(bookings.id) [UNIQUE]",
    "customer_id": "ForeignKey(customer_profile.id)",
    "technician_id": "ForeignKey(technician_profile.id)",
    "rating_by_customer": "Integer(1-5)",
    "review_by_customer": "Text",
    "rating_by_tech": "Integer(1-5)",
    "review_by_tech": "Text",
    "dispute_raised": "Boolean (Default: false)",
    "dispute_reason": "Text // Populated if dispute_raised is true",
    "dispute_status": "ENUM(OPEN, RESOLVED, REFUNDED) // Nullable"
}
```
