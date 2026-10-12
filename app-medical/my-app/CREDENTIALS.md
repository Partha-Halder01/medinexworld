# 🔐 Medinex World - Access & Panel Login Credentials

This document provides all verified dummy test credentials and portal URLs for the **Medinex World Healthcare Platform**.

> **Note:** All seeded accounts can be re-seeded or refreshed at any time by running:
> ```bash
> cd app-medical/my-app
> npm run seed
> ```

---

## 📋 Quick Credentials Summary

| Panel / Portal | Role | Access URL | Email | Password |
|---|---|---|---|---|
| **Patient Portal** | `patient` | [http://localhost:3000/login](http://localhost:3000/login) | `demo@nbms.in` | `password123` |
| **Doctor Portal** | `doctor` | [http://localhost:3000/doctor-login](http://localhost:3000/doctor-login) | `doctor1@nbms.in` *(to doctor10)* | `password123` |
| **Hospital Partner Portal** | `hospital_owner` | [http://localhost:3000/hospital-admin/login](http://localhost:3000/hospital-admin/login) *(or /hospital-login)* | `hospital@medinex.in` | `password123` |
| **Super Admin Panel** | `admin` | [http://localhost:3000/admin](http://localhost:3000/admin) *(or /admin/login)* | `admin@nbms.in` | `password123` *(or password12)* |

---

## 1. 🏠 Patient Portal
- **Login URL**: [`/login`](http://localhost:3000/login)
- **Registration URL**: [`/register`](http://localhost:3000/register)
- **Profile / Dashboard**: [`/profile`](http://localhost:3000/profile)
- **Appointments Page**: [`/appointments`](http://localhost:3000/appointments)
- **Credentials**:
  - **Email**: `demo@nbms.in`
  - **Password**: `password123`
  - **Account Name**: Rahul Sharma
  - **Phone**: `+91 98765 43210`
- **Features**:
  - AI Symptom Checker (`/ai`) with Google Gemini 2.5 Flash
  - Search and filter doctors by specialty and proximity
  - Book clinic appointments and instant/scheduled video calls
  - View prescriptions and appointment history

---

## 2. 👨‍⚕️ Doctor Portal
- **Login URL**: [`/doctor-login`](http://localhost:3000/doctor-login)
- **Doctor Dashboard**: [`/doctor-panel`](http://localhost:3000/doctor-panel)
- **Schedule Management**: [`/doctor-panel/schedule`](http://localhost:3000/doctor-panel/schedule)
- **Doctor Appointments**: [`/doctor-panel/appointments`](http://localhost:3000/doctor-panel/appointments)
- **Doctor Profile**: [`/doctor-panel/profile`](http://localhost:3000/doctor-panel/profile)
- **Common Password**: `password123`
- **Available Seeded Doctors**:

| Doctor Name | Email | Specialty | Experience | Fee (In-Person / Video) |
|---|---|---|---|---|
| **Dr. Sarah Jenkins** | `doctor1@nbms.in` | General Physician | 12 years | ₹500 / ₹300 |
| **Dr. Rajesh Kumar** | `doctor2@nbms.in` | Cardiologist | 15 years | ₹1,200 / ₹800 |
| **Dr. Emily Chen** | `doctor3@nbms.in` | Dermatologist | 8 years | ₹800 / ₹500 |
| **Dr. Michael Brown** | `doctor4@nbms.in` | ENT Specialist | 10 years | ₹700 / ₹450 |
| **Dr. Anita Desai** | `doctor5@nbms.in` | Pediatrician | 14 years | ₹600 / ₹400 |
| **Dr. James Wilson** | `doctor6@nbms.in` | Orthopedic | 18 years | ₹1,000 / ₹600 |
| **Dr. Priya Sharma** | `doctor7@nbms.in` | Gynecologist | 11 years | ₹900 / ₹600 |
| **Dr. Alok Verma** | `doctor8@nbms.in` | Neurologist | 20 years | ₹1,500 / ₹1,000 |
| **Dr. Neha Gupta** | `doctor9@nbms.in` | Dentist | 7 years | ₹400 / ₹250 |
| **Dr. Rohan Das** | `doctor10@nbms.in` | Psychiatrist | 9 years | ₹1,000 / ₹800 |

## 3. 🏥 Hospital Partner Panel
- **Login URL**: [`/hospital-admin/login`](http://localhost:3000/hospital-admin/login) *(or quick alias [`/hospital-login`](http://localhost:3000/hospital-login))*
- **Dashboard URL**: [`/hospital-admin/dashboard`](http://localhost:3000/hospital-admin/dashboard)
- **Primary Credentials**:
  - **Email**: `hospital@medinex.in`
  - **Password**: `password123`
  - **Hospital Facility**: City General Hospital (ID 1)
- **Legacy Account**:
  - **Email**: `owner@cityhospital.com`
  - **Password**: `password123`
- **Features**:
  - Hospital Profile & Real-time GPS Location updater
  - Facility Doctors Directory (Add, Edit, Remove doctors)
  - Hospital Appointments & Patient check-in management
  - Hospital Earnings & Commission Split Wallet breakdown

---

## 4. 🛡️ Super Admin Panel
- **Login URL**: [`/admin`](http://localhost:3000/admin) *(also auto-redirects from `/admin/login`)*
- **Admin Dashboard**: [`/admin/dashboard`](http://localhost:3000/admin/dashboard)
- **Doctors Management**: [`/admin/doctors`](http://localhost:3000/admin/doctors)
- **Doctor Verification**: [`/admin/verification`](http://localhost:3000/admin/verification)
- **Hospitals Management**: [`/admin/hospitals`](http://localhost:3000/admin/hospitals)
- **Users Management**: [`/admin/users`](http://localhost:3000/admin/users)
- **Appointments Oversight**: [`/admin/appointments`](http://localhost:3000/admin/appointments)
- **Reviews Moderation**: [`/admin/reviews`](http://localhost:3000/admin/reviews)
- **Blogs Management**: [`/admin/blogs`](http://localhost:3000/admin/blogs)
- **Credentials**:
  - **Email**: `admin@nbms.in`
  - **Password**: `password123` *(or `password12`)*
  - **Role**: `admin`

---

## 🚀 How to Run the Project

1. **Navigate to the Next.js application folder**:
   ```bash
   cd app-medical/my-app
   ```

2. **Ensure MySQL Service is Running**:
   - Make sure your local MySQL instance (e.g. `MySQL80` service on port `3306`) is active.
   - Database connection string in `.env`:
     ```env
     DATABASE_URL="mysql://root:partha1879.%40@localhost:3306/upcharpath"
     ```

3. **Seed / Reset Database**:
   ```bash
   npm run seed
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```

5. **Open in Browser**:
   Navigate to [http://localhost:3000](http://localhost:3000).
