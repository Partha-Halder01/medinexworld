# 🩺 Medinex World - Modern Healthcare Platform

**Medinex World** connects patients with verified doctors and hospitals through an intuitive interface featuring AI-powered symptom analysis, online and in-clinic appointment booking, video consultations, and dedicated portals for doctors and platform administrators. *Connecting you to trusted care.*

Built with **Next.js 16 (Turbopack)**, **React 19**, **Prisma ORM**, **MySQL**, and **Tailwind CSS**.

---

## 🔑 Quick Login Credentials (Demo Accounts)

All accounts below are pre-seeded in MySQL and ready for immediate testing:

### 1. 🛡️ Super Admin Panel
* **Login URL**: [http://localhost:3000/admin](http://localhost:3000/admin) *(also accessible via `/admin/login`)*
* **Dashboard URL**: [http://localhost:3000/admin/dashboard](http://localhost:3000/admin/dashboard)
* **Email**: `admin@upcharpath.com` *(or `admin@nbms.in` / `admin@medinexworld.com`)*
* **Password**: `password123` *(or `password12`)*
* **Role**: `admin`
* **Features**: Doctor verification & license audits, live ambulance & lab enquiry follow-up desk, appointment oversight, user administration.

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

## 🚀 Quick Start

### 1. Prerequisites
* **Node.js** 18+ or 20+
* **MySQL** running locally on port `3306` (database: `upcharpath`)

### 2. Setup & Running
```bash
# 1. Install dependencies
npm install

# 2. Seed database (creates demo patient, 10 doctors, hospitals & admin accounts)
npm run seed

# 3. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗺️ Portal & Route Map

| Route | Description | Portal |
|---|---|---|
| `/` | Landing page & doctor search | Public / Patient |
| `/ai` | AI Symptom Checker (Gemini 2.5 Flash) | Patient |
| `/search` | Doctor filter by specialty, distance & rating | Patient |
| `/doctor/[id]` | Doctor profile & appointment booking | Patient |
| `/hospital` | Accredited Hospitals, Nursing Homes & Clinics directory | Public / Patient |
| `/hospital/[id]` | Hospital & Nursing Home details, lab tests & surgery booking | Patient |
| `/profile/enquiries` | Real-time enquiry tracking for registered & guest patients | Patient |
| `/appointments` | Patient appointments list | Patient |
| `/profile` | Patient profile & records | Patient |
| `/login` | Patient login | Patient |
| `/register` | Patient registration with OTP | Patient |
| `/doctor-login` | Doctor login | Doctor |
| `/doctor-panel` | Doctor dashboard & patient queue | Doctor |
| `/doctor-panel/schedule` | Weekly schedule & slot configuration | Doctor |
| `/doctor-panel/appointments` | Doctor appointments oversight | Doctor |
| `/doctor-panel/profile` | Doctor profile and fees edit | Doctor |
| `/hospital-login` *(or `/hospital-admin/login`)* | Hospital & Nursing Home partner portal login | Hospital / Nursing Home |
| `/hospital-admin/dashboard` | Hospital & Nursing Home management dashboard | Hospital / Nursing Home |
| `/admin` *(or `/admin/login`)* | Super Admin login | Admin |
| `/admin/dashboard` | Admin analytics & system status | Admin |
| `/admin/enquiries` | Live ambulance & diagnostic enquiries dispatch desk | Admin |
| `/admin/verification` | Doctor credentials & license verification | Admin |
| `/admin/doctors` | Doctor management & directory | Admin |
| `/admin/hospitals` | Hospital / Nursing Home management | Admin |
| `/admin/appointments` | System-wide appointment oversight | Admin |

---

## 📜 Available Scripts

| Command | Action |
|---|---|
| `npm run dev` | Start development server on `http://localhost:3000` |
| `npm run seed` | Seed database with sample data & panel accounts |
| `npx prisma studio` | Open interactive database GUI |
| `npm run build` | Compile Next.js production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint checks |

---

## 📝 License

Private and proprietary. All rights reserved.
