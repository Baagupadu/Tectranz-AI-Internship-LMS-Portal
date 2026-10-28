# Tectranz Learning & Internship Management Portal (LMS)

[![Build & Typecheck](https://img.shields.io/badge/Next.js-15.5-black?logo=next.js)](https://nextjs.org/)
[![Database](https://img.shields.io/badge/SQLite-WAL%20Mode-blue?logo=sqlite)](https://sqlite.org/)
[![Test Suite](https://img.shields.io/badge/Tests-13%2F13%20Passing-brightgreen)](#automated-testing--acceptance-criteria)
[![PWA](https://img.shields.io/badge/PWA-Installable-purple)](/manifest.webmanifest)

An enterprise-grade, full-stack learning and internship management platform built for [Tectranz AI Internships](https://aiintern.tectranz.com/). This system provides authenticated post-payment infrastructure spanning the entire student journey: **payment verification → account activation → enrolment → onboarding → learning → assignments → partner capstones → mentor audits → logbooks → periodic reports → completion gates → QR-verifiable certificates**.

---

## 1. Architectural Highlights

- **Modular Monolith**: Strongly typed TypeScript architecture using Next.js App Router with server-side API handlers and React Server Components.
- **Relational Ledger**: Embedded SQLite database (`node:sqlite`) configured with `PRAGMA foreign_keys = ON;`, `PRAGMA journal_mode = WAL;`, and atomic transaction wrappers (`withTransaction()`).
- **Brand Design System**: Neo-brutalist tactile design reflecting Tectranz brand colors: Ink (`#0C0A33`), Volt Accent (`#00D856`), Iris Purple (`#2B00D9`), Paper Light Neutral (`#F8F8FC`), and Sand (`#F0EFEA`). Built completely with Vanilla CSS tokens—zero Tailwind bloat.
- **Progressive Web App**: Installable PWA with `/manifest.webmanifest` and custom service worker `/sw.js` enforcing strict privacy rules: **authenticated APIs, sensitive reports, tokens, and documents are never cached**.
- **Cryptographic Certificate Verification**: Each issued certificate features an immutable ID (distinct from Registration ID) with a dynamic QR code pointing to public verification endpoint `/verify/[certificateId]`.

---

## 2. Core Domain Model & Separation of Entities

The platform maintains distinct database entities rather than unstructured blobs:
1. **Users & Accounts** (`users`, `sessions`): Authentication credentials, bcrypt password hashing, session tokens with database revocation tracking, and roles.
2. **Student & Mentor Profiles** (`student_profiles`, `mentor_profiles`): Institution details, semester standing (4.1 vs 4.2), degree branch, timezones, and code of conduct consent.
3. **Tracks** (`tracks`): 6 initial tracks:
   - **L1**: GenAI & LLM Application Engineering (Flagship)
   - **L2**: MLOps & AI Infrastructure Engineering
   - **L3**: Data Engineering for AI Systems
   - **L4**: AI/ML Research & Data Science
   - **L5**: AI Security & Red Teaming
   - **L6**: Computer Vision Engineering
4. **Plans & Entitlements** (`plans`): Starter (₹1,999), Professional (₹4,999), Industry (₹9,999), Hybrid Campus (₹12,999), Immersive (₹15,999).
5. **Configurable Policy Versions** (`policy_versions`): Configurable rules for minimum attendance percentage, required engagement hours, project counts (1 vs 2), report frequencies, and passing thresholds.
6. **Cohorts & Timetables** (`cohorts`, `live_sessions`): Timezone-aware schedules (Asia/Kolkata default), mandatory vs optional classifications, and calendar feed generation.
7. **Student Enrolments** (`enrolments`): Unique, human-readable registration ID (e.g. `TZ-2026-AIE-0418`).
8. **Assignments & Submissions** (`assignments`, `assignment_submissions`): Multi-version history (`v1, v2, ...`), rubric weighting, reviewer scores, and line-by-line feedback.
9. **Partner Projects & Capstones** (`project_catalogue`, `student_projects`, `project_milestones`): Problem statements, milestones board, partner reviewer assignments, and defended viva defense records.
10. **Attendance & Corrections** (`attendance_records`, `attendance_corrections`): Present, late, excused, absent calculations, excluding cancelled sessions and protecting against student manipulation via audited correction requests.
11. **Activity Logbook & Reports** (`activity_logbook`, `periodic_reports`): Daily engineering hours log, fortnightly summaries with frozen verified metrics snapshots.
12. **Certificates & Registry** (`certificates`, `documents`): Authorized issuance, revocation handling, QR code generation, and public verification API.

---

## 3. Quickstart & Local Setup

### Prerequisites
- Node.js `v20+` or `v22+` / `v26+`
- npm `v10+`

### Installation
```bash
# Clone the repository and navigate into the workspace
git clone <repo-url> "Tectranz LMS"
cd "Tectranz LMS"

# Install dependencies
npm install

# Initialize schema and populate rich synthetic seed data
npm run db:seed

# Run automated domain and integration tests
npm test

# Build production bundle
npm run build

# Start local server
npm run dev
# Server runs at http://localhost:3000
```

---

## 4. Default Seed Accounts for Testing

The platform includes a built-in **1-Click Demo Persona Switcher** on `/login` and in the top navigation bar of every page:

| Persona | Name | Email | Password | Role & Context |
| :--- | :--- | :--- | :--- | :--- |
| **Student (Active)** | Aarav Sharma | `student@tectranz.com` | `tectranz123` | GenAI Track (L1), Week 4, Capstone in progress |
| **Student (Certified)** | Riya Verma | `riya.verma@tectranz.com` | `tectranz123` | Computer Vision (L6), Completed, QR Cert Issued |
| **Mentor / Faculty** | Dr. Vikramaditya Sen | `mentor@tectranz.com` | `tectranz123` | AI Systems Architect, Review & Grading Queue |
| **Programme Admin** | Sunita Rao | `admin@tectranz.com` | `tectranz123` | Academic Operations Director, Policy Editor |
| **Partner Reviewer** | Rajesh Nair | `reviewer@tectranz.com` | `tectranz123` | Lead Partner Engineer, Aethelgard AI Labs |
| **College Supervisor**| Prof. K. Ramanujan | `supervisor@tectranz.com`| `tectranz123` | Institutional Academic Credit Supervisor |
| **Finance Staff** | Ananya Deshmukh | `finance@tectranz.com` | `tectranz123` | Payment Reconciliation & Tax Invoices |

---

## 5. Automated Testing & Acceptance Criteria

Run the test suite at any time:
```bash
npm test
```

### Verified Test Cases (13 / 13 Passing)
- `[Pass]` Rejects webhook callbacks with invalid or tampered signatures.
- `[Pass]` Rejects payments where amount received is less than plan price.
- `[Pass]` Verifies valid payment and creates enrolment with unique registration ID (`TZ-2026-L1-0103`).
- `[Pass]` Handles duplicate webhook callbacks idempotently without duplicating enrolments.
- `[Pass]` Allows students to access their own enrolment and prevents cross-student record access (object-level authorization).
- `[Pass]` Grants administrators full operational access across records.
- `[Pass]` Calculates attendance percentage accurately, excluding cancelled sessions and correctly handling optional sessions.
- `[Pass]` Scorecard preserves pending work and missing assignments without corrupting scores to zero.
- `[Pass]` Enforces completion criteria gates and blocks certificate issuance for ineligible students.
- `[Pass]` Public certificate lookup returns legitimate recipient metadata for active certificates.
- `[Pass]` Reflects formal certificate revocation with explicit academic board reasons.
- `[Pass]` Background job queue deduplicates identical pending tasks.
- `[Pass]` Processes queued background jobs and records delivery status.

---

## 6. Payment Integration Contract

### Webhook Endpoint
- **URL**: `POST /api/payments/webhook`
- **Headers**: `x-razorpay-signature: <hmac-sha256-hash>` (or include `signature` in payload)
- **Secret**: Set via `PAYMENT_WEBHOOK_SECRET`

### Sample Webhook Payload
```json
{
  "orderId": "order_live_981245",
  "paymentId": "pay_live_817294",
  "signature": "sig_valid_test_token",
  "amount": 9999,
  "currency": "INR",
  "email": "student.name@college.edu",
  "fullName": "Student Name",
  "phone": "+91 98765 43210",
  "planSlug": "industry",
  "trackSlug": "genai-llm"
}
```

### Server-Side Guarantees
1. **Cryptographic Validation**: Never grants access based on client-side redirect parameters or uploaded screenshots.
2. **Idempotent Execution**: If a callback is re-sent by the provider, the existing enrolment and receipt are returned without re-inserting records.
3. **Atomic Transaction**: User account creation, registration ID generation (`TZ-2026-AIE-XXXX`), enrolment assignment, receipt generation, and background welcome job occur in an immediate transaction.

---

## 7. Role-Based Access Control (RBAC) Matrix

| Capability / Resource | Student | Mentor | Admin | Reviewer | Supervisor |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Access Personal Curriculum & Dashboard | ✓ | — | ✓ | — | — |
| Submit Assignments & Resubmissions | ✓ | — | — | — | — |
| Grade Code Submissions with Rubrics | — | ✓ | ✓ | — | — |
| Submit Daily Activity Logbook | ✓ | — | — | — | — |
| Approve Logbook & Hours | — | ✓ | ✓ | — | — |
| Request Attendance Correction | ✓ | — | — | — | — |
| Adjudicate Attendance Appeals | — | ✓ | ✓ | — | — |
| Evaluate Capstone Viva Defense | — | ✓ | ✓ | ✓ | — |
| View Verified Student Hours Docket | ✓ | ✓ | ✓ | — | ✓ |
| Edit Programme Policies & Weights | — | — | ✓ | — | — |
| Issue / Revoke Verified Certificates | — | — | ✓ | — | — |

---

## 8. External Integrations Checklist (Production Deployment)

| Integration | Current Implementation | Production Requirement |
| :--- | :--- | :--- |
| **Payment Gateway** | Signature verification adapter (`razorpay`/`stripe`/`upi_direct`) | Add production Razorpay Key ID & Webhook Secret |
| **Email Service** | Background job queue with sandbox dev logger | Connect Resend / AWS SES API key in `.env` |
| **Conferencing** | Dynamic Google Meet / Zoom meeting links & attendance logger | (Optional) Zoom / Teams OAuth application credentials |
| **Object Storage** | Local filesystem adapter (`/data/storage`) with auth tokens | (Optional) AWS S3 / Cloudflare R2 bucket credentials |
