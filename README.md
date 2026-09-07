# HustleHub+ : Secure Backend Foundations (Part 1) 

HustleHub+ is a secure freelance marketplace platform being built incrementally across three POE stages. **This submission covers Part 1 only**: the secure backend foundation supporting user registration and authentication.

## Demonstration Video

LINK: https://youtu.be/7Gcj34gJVoY 

## 1. System Overview

HustleHub+ will eventually let **freelancers** advertise services, **clients** browse and book them, and the platform will track resulting income and estimated tax for freelancers. Security is treated as a core requirement throughout, not an add-on.

**Intended users (full system):**
- **Clients** - browse gigs, make bookings
- **Freelancers** - list gigs, manage bookings, track income/tax
- **Admins** - platform oversight (later parts)

**Part 1 scope:** only the authentication layer - registration, login, and JWT-protected routes. Marketplace features (gigs, bookings, transactions, tax) are out of scope until Part 2/3.

## 2. Project Structure

```
src/
├── app.js                 # Express app setup, middleware, route mounting
├── server.js              # HTTPS server bootstrap, env/cert checks
├── routes/
│   └── authRoutes.js       # /api/auth/register, /login, /me
├── controllers/
│   └── authController.js   # Register/login/profile business logic
├── middleware/
│   ├── authMiddleware.js   # JWT verification (protect)
│   ├── validators.js       # express-validator rules
│   └── errorHandler.js     # Centralised, safe error responses
├── models/
│   └── userStore.js        # File-based user persistence (data/users.json)
└── utils/
    └── generateToken.js    # JWT signing helper
```

## 3. Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm
- OpenSSL (to generate a local self-signed certificate)

### Installation

```bash
git clone <your-repo-url>
cd <repo-folder>
npm install
```

### Environment setup

Copy the example environment file and fill in your own values:

```bash
cp .env.example .env
```

```
PORT=5443
JWT_SECRET=your-secure-jwt-secret-here
JWT_EXPIRES_IN=1h
BCRYPT_SALT_ROUNDS=12
SSL_KEY_PATH=./certs/key.pem
SSL_CERT_PATH=./certs/cert.pem
```

### Generate a local SSL certificate

The server will not start without one. Generate a self-signed cert for local development:

```bash
mkdir certs
openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout certs/key.pem -out certs/cert.pem -days 365 \
  -subj "/CN=localhost"
```

### Run the server

```bash
npm run dev     # nodemon, auto-restart
# or
npm start
```

The API will be available at `https://localhost:5443` (your browser/Postman will warn about the self-signed cert - this is expected in a local dev environment).

## 4. API Endpoints

| Method | Endpoint             | Auth required | Description                          |
|--------|-----------------------|----------------|--------------------------------------|
| POST   | `/api/auth/register`  | No             | Register a new user (client/freelancer) |
| POST   | `/api/auth/login`     | No             | Authenticate and receive a JWT       |
| GET    | `/api/auth/me`        | Yes (Bearer)   | Return the authenticated user's profile |

## 5. Security Decisions

**Password hashing (bcrypt)**
Passwords are never stored or logged in plain text. On registration, the password is hashed using `bcrypt` with a configurable cost factor (`BCRYPT_SALT_ROUNDS`, default 12). On login, the submitted password is compared against the stored hash using `bcrypt.compare`, so the plain-text password is never persisted or re-derivable.

**Token-based authentication (JWT)**
On successful registration or login, the server issues a signed JWT containing the user's `id`, `email`, and `role`, expiring after a configurable period (default 1 hour). Protected routes (e.g. `GET /api/auth/me`) require an `Authorization: Bearer <token>` header. The `protect` middleware verifies the token's signature and expiry against `JWT_SECRET` before allowing the request through, and rejects missing, malformed, or expired tokens with a `401`.

**Input validation**
All registration and login input is validated with `express-validator` before it reaches any controller logic: email format and normalisation, password length and complexity (upper-case, lower-case, digit), and role restricted to an explicit whitelist (`client`/`freelancer`). Requests that fail validation are rejected with a `400` and never reach the business logic layer.

**HTTPS**
The API only runs over HTTPS, using a locally generated SSL certificate loaded in `server.js`. If the certificate files are missing or unreadable, the server refuses to start rather than falling back to plain HTTP. This protects credentials and tokens in transit from interception, even in local development.

**Safe error handling**
A centralised error handler ensures no internal details - stack traces, file paths, or environment values - are ever returned to the client. Unexpected errors return a generic `500` message while being logged server-side for debugging; malformed JSON bodies are caught and return a clean `400`.

## 6. Testing

API testing was performed using **Postman**. The collection (`/Postman Collection/HustleHub-Part1-API-Tests.postman_collection.json`) includes 14 requests covering both expected and edge-case behaviour:

- Successful registration and login
- Duplicate email registration
- Invalid email format
- Weak password rejection
- Missing required fields (email/password)
- Invalid role value
- Successful vs. incorrect-password login
- Protected route access with a valid token, an invalid token, and no token
- Malformed JSON body handling
- Unknown endpoint (404) handling

Evidence of these test runs is included in `/Evidence/Testing - Postman.pdf`.
