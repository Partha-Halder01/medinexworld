# 🩺 Medinex World - Modern Healthcare Platform

**Medinex World** is a comprehensive, full-stack healthcare platform built with Next.js (App Router), React 19, TypeScript, Tailwind CSS, Prisma ORM, and MySQL. *Connecting you to trusted care.*

---

## 🔑 Quick Login Credentials (Demo Accounts)

All accounts below are pre-seeded in the database and ready for immediate testing:

### 1. 🛡️ Super Admin Panel
* **Login URL**: [http://localhost:3000/admin](http://localhost:3000/admin) *(also accessible via `/admin/login`)*
* **Dashboard URL**: [http://localhost:3000/admin/dashboard](http://localhost:3000/admin/dashboard)
* **Email**: `admin@upcharpath.com` *(or `admin@nbms.in` / `admin@medinexworld.com`)*
* **Password**: `password123` *(or `password12`)*
* **Role**: `admin`
* **Features**: Doctor verification & license audits, live ambulance & lab enquiry follow-up desk, appointment management, analytics, user administration.

---

### 2. 🏠 Patient / User Portal
* **Login URL**: [http://localhost:3000/login](http://localhost:3000/login)
* **Email**: `demo@nbms.in`
* **Password**: `password123`
* **Phone**: `+91 98765 43210`
* **Role**: `patient`
* **Name**: Rahul Sharma
* **Features**: Search and book doctors, video consultations, AI symptom checker (Gemini AI), prescription tracking, real-time enquiry status tracking (`/profile/enquiries`).

---

### 3. 👨‍⚕️ Doctor Portal (10 Seeded Specialists)
* **Login URL**: [http://localhost:3000/doctor-login](http://localhost:3000/doctor-login)
* **Dashboard URL**: [http://localhost:3000/doctor-panel](http://localhost:3000/doctor-panel)
* **Password for ALL Doctors**: `password123`
* **Role**: `doctor`

| # | Doctor Name | Email | Specialty | Fee | Profile Status |
|---|---|---|---|---|---|
| 1 | **Dr. Sarah Jenkins** | `doctor1@nbms.in` | General Physician | ₹500 | Verified ✓ |
| 2 | **Dr. Rajesh Kumar** | `doctor2@nbms.in` | Cardiologist | ₹1,200 | Verified ✓ |
| 3 | **Dr. Emily Chen** | `doctor3@nbms.in` | Dermatologist | ₹800 | Verified ✓ |
| 4 | **Dr. Michael Brown** | `doctor4@nbms.in` | ENT Specialist | ₹700 | Verified ✓ |
| 5 | **Dr. Anita Desai** | `doctor5@nbms.in` | Pediatrician | ₹600 | Verified ✓ |
| 6 | **Dr. James Wilson** | `doctor6@nbms.in` | Orthopedic | ₹1,000 | Verified ✓ |
| 7 | **Dr. Priya Sharma** | `doctor7@nbms.in` | Gynecologist | ₹900 | Verified ✓ |
| 8 | **Dr. Alok Verma** | `doctor8@nbms.in` | Neurologist | ₹1,500 | Verified ✓ |
| 9 | **Dr. Neha Gupta** | `doctor9@nbms.in` | Dentist | ₹400 | Verified ✓ |
| 10 | **Dr. Rohan Das** | `doctor10@nbms.in` | Psychiatrist | ₹1,000 | Verified ✓ |

* **Features**: Live queue, consultation fee configuration, weekly slot scheduler, video consultations.

---

### 4. 🏥 Hospital / Nursing Home Portal
* **Login URL**: [http://localhost:3000/hospital-admin/login](http://localhost:3000/hospital-admin/login) *(also accessible via `/hospital-login`)*
* **Dashboard URL**: [http://localhost:3000/hospital-admin/dashboard](http://localhost:3000/hospital-admin/dashboard)
* **Email**: `hospital@nbms.in` *(or `hospital@medinexworld.com`)*
* **Password**: `password123`
* **Role**: `hospital_owner`
* **Features**: Bed & surgery services management, hospital doctors directory, patient bookings overview, revenue & wallet tracking.

---

## 🚀 Quick Start & How to Run

### 1. Requirements
* **Node.js**: v18+ or v20+
* **MySQL**: Running locally on port `3306` (Database name: `upcharpath`)

### 2. Run the Project
Navigate to the application directory and run:

```bash
# 1. Go to application folder
cd app-medical/my-app

# 2. Install dependencies (if not already installed)
npm install

# 3. Seed all dummy credentials and sample doctors
npm run seed

# 4. Start development server
npm run dev
```

The application will be live at **[http://localhost:3000](http://localhost:3000)**.

---

## 🗺️ Key Platform URLs

| Portal | URL | Description |
|---|---|---|
| **Patient Home** | [http://localhost:3000](http://localhost:3000) | Main patient landing page & search |
| **Find a Doctor** | [http://localhost:3000/search](http://localhost:3000/search) | Filter by specialty, location & ratings |
| **AI Symptom Checker** | [http://localhost:3000/ai](http://localhost:3000/ai) | Gemini AI clinical triage |
| **Patient Enquiries Tracker** | [http://localhost:3000/profile/enquiries](http://localhost:3000/profile/enquiries) | Real-time tracking without login |
| **Hospitals & Nursing Homes** | [http://localhost:3000/hospital](http://localhost:3000/hospital) | Verified hospitals, nursing homes & clinics directory |
| **Hospital / Nursing Home Login** | [http://localhost:3000/hospital-admin/login](http://localhost:3000/hospital-admin/login) | Hospital & Nursing Home partner portal login |
| **Hospital / Nursing Home Dashboard** | [http://localhost:3000/hospital-admin/dashboard](http://localhost:3000/hospital-admin/dashboard) | Hospital & Nursing Home partner control room |
| **Admin Enquiries & Follow-up** | [http://localhost:3000/admin/enquiries](http://localhost:3000/admin/enquiries) | Dispatch ambulance & lab follow-ups |
| **Admin Doctor Verification** | [http://localhost:3000/admin/verification](http://localhost:3000/admin/verification) | Audit doctor licenses & credentials |
| **Doctor Login** | [http://localhost:3000/doctor-login](http://localhost:3000/doctor-login) | Doctor consultation desk |
| **Admin Login** | [http://localhost:3000/admin](http://localhost:3000/admin) | Super admin control panel |

---

## 🛠️ Project Structure

```
UpcharPath/
├── app-medical/
│   └── my-app/
│       ├── app/                     # Next.js App Router (pages & API routes)
│       │   ├── admin/               # Super Admin Panel
│       │   ├── doctor-panel/        # Doctor Management Panel
│       │   ├── login/               # Patient Login
│       │   ├── doctor-login/        # Doctor Login
│       │   └── api/                 # Backend REST API Endpoints
│       ├── components/              # UI components & screens
│       ├── prisma/                  # Prisma schema & migrations
│       ├── scripts/                 # Database seed script (seed.ts)
│       └── package.json
└── README.md                        # Root guide & credentials
```

---

## ⚙️ Useful Commands

| Command | Action |
|---|---|
| `npm run dev` | Start development server on port 3000 |
| `npm run seed` | Re-seed database with default users, doctors, and hospitals |
| `npx prisma studio` | Open interactive visual database browser |
| `npm run build` | Build production Next.js application |
| `npm run lint` | Run ESLint checks |
