# EduPortal — School Management System

EduPortal is a production-quality School Management System / School ERP built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Tech Stack

- **Next.js 16** with App Router
- **React 19**
- **TypeScript** (strict mode)
- **Tailwind CSS v4**
- **Supabase** (Auth + PostgreSQL)
- **ESLint**

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Auth routes (login)
│   ├── (dashboard)/         # Protected dashboard routes
│   │   ├── admin/
│   │   ├── teacher/
│   │   └── parent/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── auth/
│   │   └── AuthProvider.tsx
│   ├── layout/
│   │   └── DashboardLayout.tsx
│   └── ui/
│       └── index.tsx
├── lib/
│   └── supabase/
│       ├── client.ts
│       └── server.ts
├── types/
│   └── database.ts
middleware.ts
```

## Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd eduportal
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. In the Supabase Dashboard, go to **Project Settings** → **API**.
3. Copy your **Project URL** and **anon / publishable key**.

### 4. Configure environment variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

> **Note:** Do not commit `.env.local` to version control.

### 5. Run the database migration

In the Supabase Dashboard, go to **SQL Editor** and run the migration file:

```bash
supabase/migrations/20240101000000_phase1_foundation.sql
```

Or via Supabase CLI:

```bash
supabase migration up
```

### 6. Create the first Admin user

1. In the Supabase Dashboard, go to **Authentication** → **Users**.
2. Click **Add user** and create a new user with email and password.
3. Copy the user's UUID.
4. Go to **SQL Editor** and run:

```sql
INSERT INTO public.schools (name, email, phone, address, city)
VALUES ('My School', 'school@example.com', '+1234567890', '123 Main St', 'City')
RETURNING id;
```

5. Copy the returned school ID, then run:

```sql
INSERT INTO public.profiles (id, school_id, full_name, email, role)
VALUES ('<user-uuid>', '<school-id>', 'Admin User', 'admin@example.com', 'admin');
```

### 7. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

```bash
npm run dev       # Start development server
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint
```

## Routes

| Path | Description |
|------|-------------|
| `/` | Redirects to `/login` or `/dashboard` |
| `/login` | Login page |
| `/dashboard` | Role-based redirect |
| `/admin/dashboard` | Admin dashboard |
| `/admin/school` | School management |
| `/admin/users` | User management |
| `/teacher/dashboard` | Teacher dashboard |
| `/teacher/profile` | Teacher profile |
| `/teacher/school` | School information |
| `/parent/dashboard` | Parent dashboard |
| `/parent/profile` | Parent profile |
| `/parent/school` | School information |

## Authentication

- Login is handled via Supabase Auth.
- Sessions persist using Supabase's cookie-based session management.
- Protected routes are enforced by both middleware (redirects) and server-side checks.
- Role-based access control ensures users only access their permitted dashboards.

## Database Schema

### schools

- `id` (UUID, PK)
- `name`, `email`, `phone`, `address`, `city`
- `logo_url`
- `created_at`, `updated_at`

### profiles

- `id` (UUID, FK → auth.users)
- `school_id` (UUID, FK → schools)
- `full_name`, `email`, `phone`
- `role` (enum: `admin`, `teacher`, `parent`)
- `avatar_url`
- `is_active` (boolean)
- `created_at`, `updated_at`

## Security

- Row Level Security (RLS) is enabled on all application tables.
- Admin users can only access data within their own school.
- Teachers and parents can only access their own profiles and permitted school-level information.
- Cross-school data access is prevented at the database level.

## Phase 1 Features

- [x] Next.js + TypeScript + Tailwind setup
- [x] Supabase connection
- [x] Database schema (schools, profiles)
- [x] Supabase Auth (login/logout/session)
- [x] Protected routes
- [x] Role-based routing
- [x] Admin dashboard
- [x] Teacher dashboard
- [x] Parent dashboard
- [x] School management (admin)
- [x] User listing with role filtering (admin)
- [x] Responsive UI
- [x] Loading/error/empty states
- [x] RLS policies

## Next Phase

The next planned phase will introduce:

- Students
- Classes
- Sections
- Teachers (module)
- Subjects
