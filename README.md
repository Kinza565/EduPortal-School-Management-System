# EduPortal — School Management System

EduPortal is a modern, full-featured **School Management System / School ERP** designed to help schools manage students, teachers, academics, attendance, examinations, parents, fees, assignments, reports, and day-to-day school operations from a centralized platform.

Built with **Next.js, TypeScript, Tailwind CSS, and Supabase**, EduPortal provides separate dashboards and role-based access for **Administrators, Teachers, and Parents**.

---

## ✨ Key Features

### 👨‍💼 Admin / Principal

* 📊 Admin Dashboard
* 🏫 School Management
* 👥 User Management
* 👨‍🏫 Faculty / Teacher Management
* 🎓 Student Management
* 📚 Classes & Sections
* 📖 Subjects Management
* 🔗 Teacher Assignments
* 👨‍👩‍👧 Parent / Guardian Management
* 📝 Academic Assignments / Homework
* 📅 Attendance Management
* 📈 Attendance History
* 📊 Monthly & Yearly Attendance Reports
* 📝 Exams Management
* 📋 Exam Subjects
* 📊 Results Management
* 🎓 Student Report Cards
* 💰 Fees Management
* 🧾 Fee Details & Receipts
* 📢 Announcements
* 📑 Academic Reports
* ⚙️ Settings
* 🔐 Role-based access control

### 👨‍🏫 Teacher

* Teacher Dashboard
* Assigned Classes
* Assigned Subjects
* My Students
* Student Details
* Daily Attendance
* Attendance History
* Assignments / Homework
* Exams
* Results
* Announcements
* Teacher Profile
* School Information
* Settings

### 👨‍👩‍👧 Parent

* Parent Dashboard
* Children Management
* Child Profiles
* Attendance Tracking
* Assignments / Homework
* Exams
* Results
* Report Cards
* Fees
* School Information
* Announcements
* Parent Profile
* Settings

---

## 🛠️ Tech Stack

* **Next.js 16** — App Router
* **React 19**
* **TypeScript** — Strict mode
* **Tailwind CSS v4**
* **Supabase**

  * Authentication
  * PostgreSQL Database
  * Row Level Security
* **ESLint**
* **Webpack** production build

---

## 🏗️ Architecture

```text
EduPortal
│
├── Authentication
│   └── Supabase Auth
│
├── Role-Based Access
│   ├── Admin
│   ├── Teacher
│   └── Parent
│
├── Admin Modules
│   ├── Dashboard
│   ├── School
│   ├── Users
│   ├── Teachers
│   ├── Students
│   ├── Classes
│   ├── Sections
│   ├── Subjects
│   ├── Teacher Assignments
│   ├── Parents
│   ├── Assignments
│   ├── Attendance
│   ├── Exams
│   ├── Results
│   ├── Report Cards
│   ├── Fees
│   ├── Reports
│   └── Announcements
│
├── Teacher Modules
│   ├── Dashboard
│   ├── My Classes
│   ├── My Students
│   ├── My Subjects
│   ├── Attendance
│   ├── Assignments
│   ├── Exams
│   └── Results
│
└── Parent Modules
    ├── Dashboard
    ├── Children
    ├── Attendance
    ├── Assignments
    ├── Exams
    ├── Results
    ├── Report Cards
    └── Fees
```

---

## 📁 Project Structure

```text
src/
├── app/
│   ├── (auth)/
│   ├── (dashboard)/
│   │   ├── admin/
│   │   ├── teacher/
│   │   └── parent/
│   ├── api/
│   │   ├── admin/
│   │   └── pdf/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
│   ├── auth/
│   ├── layout/
│   ├── teachers/
│   └── ui/
│
├── lib/
│   └── supabase/
│
├── types/
│   └── database.ts
│
└── middleware.ts

supabase/
└── migrations/
```

---

## 🔐 Security

EduPortal is designed with multi-school data isolation and database-level security in mind.

### Security Features

* Supabase Authentication
* Role-based authorization
* Row Level Security (RLS)
* School-level data isolation
* Cross-school access protection
* Server-side authorization checks
* Protected dashboard routes
* Secure server-side Supabase operations
* API authorization checks
* User-specific data access

Each school is logically isolated so users cannot access data belonging to another school.

---

## 🗄️ Database

EduPortal uses **Supabase PostgreSQL** as its backend database.

Major database entities include:

```text
schools
profiles
classes
sections
students
teacher_details
subjects
teacher_assignments
parents
parent_student
attendance_records
academic_assignments
exams
exam_subjects
results
fees
announcements
```

Database migrations are maintained in:

```text
supabase/migrations/
```

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Kinza565/EduPortal-School-Management-System.git
cd EduPortal-School-Management-System
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Supabase

Create or use an existing Supabase project.

Get your Supabase credentials from:

**Supabase Dashboard → Project Settings → API**

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

> Never commit `.env.local` or private Supabase credentials to GitHub.

### 4. Apply Database Migrations

The database migration files are available in:

```text
supabase/migrations/
```

Apply the migrations using the Supabase CLI or Supabase SQL Editor.

If using Supabase CLI:

```bash
npx supabase db push
```

Make sure the migrations are applied in the correct order.

### 5. Start Development Server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## 📦 Available Scripts

```bash
npm run dev
```

Start the development server.

```bash
npm run build
```

Create a production build.

```bash
npm run start
```

Start the production server.

```bash
npm run lint
```

Run ESLint.

---

## 🌐 Application Routes

### Authentication

```text
/login
/signup
```

### Admin

```text
/admin/dashboard
/admin/school
/admin/users
/admin/teachers
/admin/students
/admin/classes
/admin/sections
/admin/subjects
/admin/parents
/admin/assignments
/admin/academic-assignments
/admin/attendance
/admin/exams
/admin/results
/admin/report-cards
/admin/fees
/admin/reports
/admin/announcements
/admin/settings
```

### Teacher

```text
/teacher/dashboard
/teacher/my-classes
/teacher/my-students
/teacher/my-subjects
/teacher/attendance
/teacher/attendance/history
/teacher/assignments
/teacher/exams
/teacher/results
/teacher/announcements
/teacher/profile
/teacher/school
/teacher/settings
```

### Parent

```text
/parent/dashboard
/parent/children
/parent/attendance
/parent/assignments
/parent/exams
/parent/results
/parent/report-cards
/parent/fees
/parent/announcements
/parent/profile
/parent/school
/parent/settings
```

---

## 📊 Core Modules

| Module                 | Status      |
| ---------------------- | ----------- |
| Authentication         | ✅ Completed |
| Role-Based Access      | ✅ Completed |
| School Management      | ✅ Completed |
| User Management        | ✅ Completed |
| Teacher Management     | ✅ Completed |
| Student Management     | ✅ Completed |
| Classes                | ✅ Completed |
| Sections               | ✅ Completed |
| Subjects               | ✅ Completed |
| Teacher Assignments    | ✅ Completed |
| Parents / Guardians    | ✅ Completed |
| Assignments / Homework | ✅ Completed |
| Attendance             | ✅ Completed |
| Attendance Reports     | ✅ Completed |
| Exams                  | ✅ Completed |
| Results                | ✅ Completed |
| Report Cards           | ✅ Completed |
| Fees                   | ✅ Completed |
| Announcements          | ✅ Completed |
| Admin Reports          | ✅ Completed |
| Responsive UI          | ✅ Completed |
| RLS / School Isolation | ✅ Completed |

---

## 📱 Responsive Design

EduPortal is designed to work across:

* 💻 Desktop
* 🖥️ Laptop
* 📱 Tablet
* 📱 Mobile

The dashboard interface adapts to different screen sizes while maintaining usability across the application.

---

## 🚀 Deployment

EduPortal can be deployed using platforms such as **Vercel** with Supabase as the backend.

For Vercel deployment, configure the required environment variables in:

```text
Vercel Dashboard
→ Project
→ Settings
→ Environment Variables
```

Required variables:

```env
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

---

## 🔒 Environment Variables

Never commit sensitive environment files.

The following files should remain ignored by Git:

```text
.env
.env.local
.env*.local
```

Also avoid committing:

```text
node_modules/
.next/
```

---

## 🧪 Build Verification

The project has been successfully production-built using:

```bash
npm run build
```

The application includes dynamic server-rendered routes and static pages generated through Next.js App Router.

---

## 🎯 Project Purpose

EduPortal was developed as a scalable foundation for schools looking to digitize their academic and administrative workflows.

The system can be further customized according to individual school requirements, including additional modules, workflows, branding, permissions, and integrations.

---

## 🔮 Future Enhancements

Potential future improvements include:

* Online fee payment integration
* SMS / WhatsApp notifications
* Email notifications
* Advanced analytics
* Timetable management
* Library management
* Transport management
* Payroll management
* Online admission system
* Student promotion workflow
* Certificate generation
* More advanced reporting
* Mobile application

---

## 👩‍💻 Developer

**Kinza Khan**

Frontend / Full-Stack Web Developer

### Technologies

Next.js · React · TypeScript · Tailwind CSS · Supabase · PostgreSQL

---

## 📄 License

This project is intended for demonstration, portfolio, and customization purposes.

For commercial use or school-specific customization, please contact the developer.
