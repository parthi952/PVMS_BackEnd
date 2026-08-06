# Visitor Pass Management System - API Documentation

Base URL: `http://localhost:5000`

---

## Table of Contents
1. [Authentication API](#1-authentication-api)
2. [User Management API](#2-user-management-api)
3. [Visitor Management API](#3-visitor-management-api)
4. [Business Rules Quick Reference](#4-business-rules-quick-reference)

---

## 1. Authentication API

### 1.1 User Login
Authenticates user with email and password, returning JWT Access Token, Refresh Token, and User Role for RBAC.

- **HTTP Method**: `POST`
- **URL**: `http://localhost:5000/api/login`
- **Content-Type**: `application/json`

#### Request Body
```json
{
  "email": "admin123@gmail.com",
  "password": "pass123"
}
```

#### Success Response (200 OK)
```json
{
  "_id": "66b245a9f1b2c81234567890",
  "name": "Admin",
  "email": "admin123@gmail.com",
  "role": "admin",
  "employeeId": "admin001",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
}
```

#### Error Responses
- `400 Bad Request`: `{ "title": "Validation Error", "message": "Please provide email and password" }`
- `401 Unauthorized`: `{ "title": "Unauthorized", "message": "Invalid email or password" }`

---

## 2. User Management API

### 2.1 Get All Users
Retrieves all registered users in the system.

- **HTTP Method**: `GET`
- **URL**: `http://localhost:5000/api/users`

#### Success Response (200 OK)
```json
[
  {
    "_id": "66b245a9f1b2c81234567890",
    "name": "John Employee",
    "email": "john@company.com",
    "role": "employee",
    "employeeId": "employee1"
  }
]
```

---

### 2.2 Create New User
Registers a new user (admin, receptionist, or employee). Auto-generates `employeeId` if not specified.

- **HTTP Method**: `POST`
- **URL**: `http://localhost:5000/api/users`
- **Content-Type**: `application/json`

#### Request Body
```json
{
  "name": "Jane Receptionist",
  "email": "jane@company.com",
  "password": "password123",
  "role": "receptionist",
  "employeeId": "receptionist1"
}
```

#### Success Response (201 Created)
```json
{
  "_id": "66b245b0f1b2c81234567891",
  "name": "Jane Receptionist",
  "email": "jane@company.com",
  "role": "receptionist",
  "employeeId": "receptionist1"
}
```

---

## 3. Visitor Management API

### 3.1 Get Visitors List (With Filters)
Retrieves visitors with optional filtering by status, host employee ID, search term, or active-only list.

- **HTTP Method**: `GET`
- **URL**: `http://localhost:5000/api/visitors`
- **Query Parameters**:
  - `status` (optional): `Pending` | `Approved` | `Rejected` | `CheckedIn` | `CheckedOut` | `Cancelled`
  - `employeeId` (optional): Filter visits assigned to a specific host employee (e.g. `employee1`)
  - `search` (optional): Search by visitor name, phone, email, or purpose
  - `activeOnly` (optional): `true` (returns only active visits: `Pending`, `Approved`, `CheckedIn`)
  - `excludeCancelled` (optional): `true`

#### Examples
- `http://localhost:5000/api/visitors`
- `http://localhost:5000/api/visitors?status=Pending&employeeId=employee1`
- `http://localhost:5000/api/visitors?activeOnly=true`

#### Success Response (200 OK)
```json
[
  {
    "_id": "66b24600f1b2c81234567892",
    "visitorName": "Mark Taylor",
    "phone": "9876543210",
    "email": "mark@example.com",
    "purpose": "Client Meeting",
    "employeeId": "employee1",
    "visitDate": "2026-08-06T00:00:00.000Z",
    "expectedArrival": "14:30",
    "status": "Pending",
    "remarks": "Meeting regarding Q3 contract",
    "activity": [
      {
        "action": "Created",
        "performedBy": "66b245b0f1b2c81234567891",
        "role": "receptionist",
        "time": "2026-08-06T15:00:00.000Z",
        "remarks": "Visitor pass created"
      }
    ],
    "createdAt": "2026-08-06T15:00:00.000Z",
    "updatedAt": "2026-08-06T15:00:00.000Z"
  }
]
```

---

### 3.2 Get Visitor By ID
Retrieves details and complete history of a single visitor pass.

- **HTTP Method**: `GET`
- **URL**: `http://localhost:5000/api/visitors/:id`

#### Success Response (200 OK)
Returns the visitor object matching `:id`.

---

### 3.3 Create Visitor Request (Receptionist Flow)
Enforces Business Rules 1 to 5 upon creation.

- **HTTP Method**: `POST`
- **URL**: `http://localhost:5000/api/visitors`
- **Content-Type**: `application/json`

#### Request Body
```json
{
  "visitorName": "Mark Taylor",
  "phone": "9876543210",
  "email": "mark@example.com",
  "purpose": "Client Meeting",
  "employeeId": "employee1",
  "visitDate": "2026-08-06",
  "expectedArrival": "14:30",
  "remarks": "Meeting regarding Q3 contract",
  "performedBy": "66b245b0f1b2c81234567891",
  "role": "receptionist"
}
```

#### Enforced Validation Errors
- **Rule 1**: Visitor already has an active visit (`Pending`, `Approved`, `CheckedIn`).
- **Rule 2**: Duplicate registration for the same visitor on the same date.
- **Rule 3**: Visit date is earlier than today's date.
- **Rule 4**: Expected arrival time is earlier than current time for today's visit.
- **Rule 5**: Host employee already has 3 pending visitor requests awaiting approval.

---

### 3.4 Update Visitor Status (Workflow Actions)
Enforces Business Rules 6 to 10 for approval, check-in, check-out, and cancellation.

- **HTTP Method**: `PATCH`
- **URL**: `http://localhost:5000/api/visitors/:id/status`
- **Content-Type**: `application/json`

#### Allowed Status Actions:
1. `Approved` (Employee approves pending request)
2. `Rejected` (Employee rejects pending request)
3. `CheckedIn` (Receptionist checks in approved visitor)
4. `CheckedOut` (Receptionist checks out checked-in visitor)
5. `Cancelled` (Visit request cancelled)

#### Request Body (Example: Employee Approves)
```json
{
  "status": "Approved",
  "remarks": "Approved for meeting room 2",
  "performedBy": "66b245a9f1b2c81234567890",
  "role": "employee"
}
```

#### Request Body (Example: Receptionist Checks In)
```json
{
  "status": "CheckedIn",
  "remarks": "Issued Visitor Badge #402",
  "performedBy": "66b245b0f1b2c81234567891",
  "role": "receptionist"
}
```

#### Request Body (Example: Receptionist Checks Out)
```json
{
  "status": "CheckedOut",
  "remarks": "Badge returned",
  "performedBy": "66b245b0f1b2c81234567891",
  "role": "receptionist"
}
```

#### Enforced Validation Errors
- **Rule 6 & Rule 9**: Check-in allowed ONLY if current status is `Approved`.
- **Rule 7**: Visitor is already checked in.
- **Rule 8**: Check-out time must be later than check-in time.

---

### 3.5 Update Visitor Details
Updates visitor record fields.

- **HTTP Method**: `PUT`
- **URL**: `http://localhost:5000/api/visitors/:id`
- **Content-Type**: `application/json`

#### Request Body
```json
{
  "purpose": "Vendor Presentation",
  "remarks": "Room changed to Boardroom A"
}
```

---

### 3.6 Delete Visitor
Deletes a visitor pass from the system.

- **HTTP Method**: `DELETE`
- **URL**: `http://localhost:5000/api/visitors/:id`

#### Success Response (200 OK)
```json
{
  "message": "Visitor deleted successfully",
  "id": "66b24600f1b2c81234567892"
}
```

---

## 4. Business Rules Quick Reference

1. **Rule 1**: One active visit per visitor at a time.
2. **Rule 2**: No duplicate registrations on the same date for the same visitor.
3. **Rule 3**: `visitDate` cannot be earlier than current date.
4. **Rule 4**: For today's visits, `expectedArrival` time cannot be in the past.
5. **Rule 5**: Maximum 3 pending requests per host employee.
6. **Rule 6**: Visitors can only be checked in after approval.
7. **Rule 7**: Cannot check in an already checked-in visitor.
8. **Rule 8**: Check-out time must be strictly after check-in time.
9. **Rule 9**: Rejected requests cannot be checked in.
10. **Rule 10**: Cancelled visits excluded from active lists (`?activeOnly=true`).
