# Visitor Pass Management System - API Documentation

## Base URLs
- **Local Environment**: `http://localhost:5000/api`
- **Production Environment**: `https://pvms-backend.onrender.com/api`

---

## Authentication & Headers

All protected endpoints require the **JWT Access Token** passed in the `Authorization` header.

```http
Authorization: Bearer <your_access_token>
Content-Type: application/json
```

---

## Table of Contents
1. [Authentication API](#1-authentication-api)
2. [User Management API](#2-user-management-api)
3. [Visitor Management API](#3-visitor-management-api)
4. [Database Seeding](#4-database-seeding)
5. [Business Rules Quick Reference](#5-business-rules-quick-reference)

---

## 1. Authentication API

### 1.1 User Login
Authenticates a user using email and password. Returns JWT Access Token, Refresh Token, and user metadata for Role-Based Access Control (RBAC).

- **Method**: `POST`
- **Endpoint**: `/api/login`
- **Access**: Public

#### Request Body
```json
{
  "email": "admin123@gmail.com",
  "password": "pass123"
}
```

#### Success Response (`200 OK`)
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
- `400 Bad Request`: Missing email or password
  ```json
  {
    "message": "Please provide email and password"
  }
  ```
- `401 Unauthorized`: Invalid credentials
  ```json
  {
    "message": "Invalid email or password"
  }
  ```

---

## 2. User Management API

### 2.1 Get All Users
Retrieves all registered users in the system.

- **Method**: `GET`
- **Endpoint**: `/api/users`
- **Access**: Restricted to `admin`

#### Request Headers
```http
Authorization: Bearer <admin_access_token>
```

#### Success Response (`200 OK`)
```json
[
  {
    "_id": "66b245a9f1b2c81234567890",
    "name": "Admin",
    "email": "admin123@gmail.com",
    "role": "admin",
    "employeeId": "admin001"
  },
  {
    "_id": "66b245b0f1b2c81234567891",
    "name": "Jane Receptionist",
    "email": "jane@company.com",
    "role": "receptionist",
    "employeeId": "receptionist1"
  }
]
```

---

### 2.2 Create New User
Creates a new user account (admin, receptionist, or employee) with a bcrypt-hashed password. Auto-generates an `employeeId` if one is not provided.

- **Method**: `POST`
- **Endpoint**: `/api/users`
- **Access**: Restricted to `admin`

#### Request Body
```json
{
  "name": "Jane Receptionist",
  "email": "jane@company.com",
  "password": "SecurePassword123!",
  "role": "receptionist",
  "employeeId": "receptionist1"
}
```

#### Success Response (`201 Created`)
```json
{
  "_id": "66b245b0f1b2c81234567891",
  "name": "Jane Receptionist",
  "email": "jane@company.com",
  "role": "receptionist",
  "employeeId": "receptionist1"
}
```

#### Error Responses
- `400 Bad Request`: Email already exists or missing required fields.
  ```json
  {
    "message": "User with this email already exists"
  }
  ```

---

## 3. Visitor Management API

### 3.1 Get Visitors List (with Filters)
Retrieves visitors with optional filtering by status, host employee ID, search term, or active-only list.

- **Method**: `GET`
- **Endpoint**: `/api/visitors`
- **Access**: `admin`, `receptionist`, `employee`

#### Query Parameters
| Parameter | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `status` | `string` | Filter by visit status (`Pending`, `Approved`, `Rejected`, `CheckedIn`, `CheckedOut`, `Cancelled`) | `?status=Pending` |
| `employeeId` | `string` | Filter by host employee ID | `?employeeId=employee950` |
| `search` | `string` | Search term matching visitor name, phone, email, or purpose | `?search=Mohan` |
| `activeOnly` | `boolean` | `true` to return only active visits (`Pending`, `Approved`, `CheckedIn`) | `?activeOnly=true` |
| `excludeCancelled` | `boolean` | `true` to exclude cancelled visits | `?excludeCancelled=true` |

#### Success Response (`200 OK`)
```json
[
  {
    "_id": "66b24600f1b2c81234567892",
    "visitorName": "Mark Taylor",
    "phone": "9876543210",
    "email": "mark@example.com",
    "purpose": "Client Meeting",
    "employeeId": "employee950",
    "visitDate": "2026-08-07T00:00:00.000Z",
    "expectedArrival": "14:30",
    "status": "Pending",
    "remarks": "Meeting regarding Q3 contract",
    "activity": [
      {
        "action": "Created",
        "performedBy": "66b245b0f1b2c81234567891",
        "role": "receptionist",
        "time": "2026-08-07T10:00:00.000Z",
        "remarks": "Visitor pass created"
      }
    ],
    "createdAt": "2026-08-07T10:00:00.000Z",
    "updatedAt": "2026-08-07T10:00:00.000Z"
  }
]
```

---

### 3.2 Get Visitor By ID
Retrieves details and activity history for a specific visitor pass.

- **Method**: `GET`
- **Endpoint**: `/api/visitors/:id`
- **Access**: `admin`, `receptionist`, `employee`

#### Success Response (`200 OK`)
Returns the single visitor object matching `:id`.

#### Error Response
- `404 Not Found`:
  ```json
  {
    "message": "Visitor not found"
  }
  ```

---

### 3.3 Create Visitor Request
Registers a new visitor pass. Enforces Business Rules 1–5.

- **Method**: `POST`
- **Endpoint**: `/api/visitors`
- **Access**: `admin`, `receptionist`, `employee`

#### Request Body
```json
{
  "visitorName": "Mark Taylor",
  "phone": "9876543210",
  "email": "mark@example.com",
  "purpose": "Client Meeting",
  "employeeId": "employee950",
  "visitDate": "2026-08-07",
  "expectedArrival": "14:30",
  "remarks": "Meeting regarding Q3 contract",
  "performedBy": "66b245b0f1b2c81234567891",
  "role": "receptionist"
}
```

#### Success Response (`201 Created`)
Returns the created visitor object.

#### Business Rule Validation Errors (`400 Bad Request`)
- **Rule 1 Violation**: Active visit exists for phone number.
- **Rule 2 Violation**: Duplicate registration for same date.
- **Rule 3 Violation**: Visit date is earlier than today's date.
- **Rule 4 Violation**: Expected arrival time is earlier than current time for today's visit.
- **Rule 5 Violation**: Host employee already has 3 pending visitor requests awaiting approval.

---

### 3.4 Update Visitor Status (Workflow Actions)
Updates the workflow status of a visitor pass (`Approved`, `Rejected`, `CheckedIn`, `CheckedOut`, `Cancelled`). Enforces Business Rules 6–10.

- **Method**: `PATCH`
- **Endpoint**: `/api/visitors/:id/status`
- **Access**: `admin`, `receptionist`, `employee`

#### Request Body (Approve / Reject)
```json
{
  "status": "Approved",
  "remarks": "Approved for Conference Room B",
  "performedBy": "66b245a9f1b2c81234567890",
  "role": "employee"
}
```

#### Request Body (Check-In)
```json
{
  "status": "CheckedIn",
  "remarks": "Visitor badge #104 issued",
  "performedBy": "66b245b0f1b2c81234567891",
  "role": "receptionist"
}
```

#### Request Body (Check-Out)
```json
{
  "status": "CheckedOut",
  "remarks": "Badge returned",
  "performedBy": "66b245b0f1b2c81234567891",
  "role": "receptionist"
}
```

#### Business Rule Validation Errors (`400 Bad Request`)
- **Rule 6 & Rule 9 Violation**: Visitor can only be checked in after status is `Approved`.
- **Rule 7 Violation**: Visitor is already checked in.
- **Rule 8 Violation**: Check-out time must be later than check-in time.

---

### 3.5 Update Visitor Details
Updates editable fields on a visitor pass.

- **Method**: `PUT`
- **Endpoint**: `/api/visitors/:id`
- **Access**: `admin`, `receptionist`

#### Request Body
```json
{
  "purpose": "Vendor Presentation",
  "remarks": "Meeting moved to main auditorium"
}
```

#### Success Response (`200 OK`)
Returns the updated visitor object.

---

### 3.6 Delete Visitor
Deletes a visitor pass from the system.

- **Method**: `DELETE`
- **Endpoint**: `/api/visitors/:id`
- **Access**: Restricted to `admin`

#### Success Response (`200 OK`)
```json
{
  "message": "Visitor deleted successfully",
  "id": "66b24600f1b2c81234567892"
}
```

---

## 4. Database Seeding

To initialize or seed the database with default accounts (stored with bcrypt hashed passwords):

```bash
npm run seed
```

Default Seed Accounts:
- **Admin**: `admin123@gmail.com` / `pass123`
- **Employee**: `parthimp950@gmail.com` / `pass123`

---

## 5. Business Rules Quick Reference

1. **Rule 1**: One active visit per visitor at a time (`Pending`, `Approved`, `CheckedIn`).
2. **Rule 2**: No duplicate registrations on the same date for the same visitor.
3. **Rule 3**: `visitDate` cannot be earlier than current date.
4. **Rule 4**: For today's visits, `expectedArrival` time cannot be in the past.
5. **Rule 5**: Maximum 3 pending requests per host employee.
6. **Rule 6**: Visitors can only be checked in after approval.
7. **Rule 7**: Cannot check in an already checked-in visitor.
8. **Rule 8**: Check-out time must be strictly after check-in time.
9. **Rule 9**: Rejected or non-approved requests cannot be checked in.
10. **Rule 10**: Cancelled visits excluded from active lists (`?activeOnly=true`).
