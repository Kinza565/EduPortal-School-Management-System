# EduPortal Manual QA Checklist

## Test Environment Setup

### Test Accounts Required

**IMPORTANT:** Create these auth users via Supabase Dashboard (Authentication → Users → Add User)

| Role | Email | Password | Auth User ID (copy after creation) |
|------|-------|----------|-----------------------------------|
| Admin | admin@testacademy.edu | Test@1234 | _________________________ |
| Teacher 1 | teacher1@testacademy.edu | Test@1234 | _________________________ |
| Teacher 2 | teacher2@testacademy.edu | Test@1234 | _________________________ |
| Parent 1 | parent1@testacademy.edu | Test@1234 | _________________________ |
| Parent 2 | parent2@testacademy.edu | Test@1234 | _________________________ |

### Database Setup Steps

1. **Run the seed script** in Supabase SQL Editor:
   ```sql
   -- Run the contents of supabase/seed/test_data.sql
   ```

2. **Update the placeholder IDs** in the seed script with actual auth user IDs:
   - Replace `YOUR_ADMIN_AUTH_USER_ID` with admin's auth user ID
   - Replace `YOUR_TEACHER1_AUTH_USER_ID` with teacher 1's auth user ID
   - Replace `YOUR_TEACHER2_AUTH_USER_ID` with teacher 2's auth user ID
   - Replace `YOUR_PARENT1_AUTH_USER_ID` with parent 1's auth user ID
   - Replace `YOUR_PARENT2_AUTH_USER_ID` with parent 2's auth user ID

3. **Re-run the seed script** to insert profiles and relationships

---

## ADMIN PORTAL QA CHECKLIST

### Login
- [ ] Navigate to /login
- [ ] Select "Admin" role
- [ ] Enter admin@testacademy.edu / Test@1234
- [ ] Verify successful login and redirect to /admin/dashboard

### Dashboard
- [ ] Verify dashboard loads with statistics
- [ ] Verify announcement widget displays
- [ ] Verify notification bell shows unread count

### Students
- [ ] Navigate to /admin/students
- [ ] Verify student list loads (12 students)
- [ ] Test search by name
- [ ] Test filter by class
- [ ] Test filter by section
- [ ] Test filter by status
- [ ] Test pagination (next, previous, page numbers)
- [ ] Click "Add Student" and verify form opens
- [ ] Fill form and create new student
- [ ] Verify student appears in list
- [ ] Click edit on existing student
- [ ] Verify form pre-populates with data
- [ ] Update student and verify changes
- [ ] Test delete/deactivate

### Teachers
- [ ] Navigate to /admin/teachers
- [ ] Verify teacher list loads (2 teachers)
- [ ] Test search by name
- [ ] Test filter by status
- [ ] Test pagination
- [ ] Click "Add Teacher" and verify form opens
- [ ] Fill form and create new teacher
- [ ] Click edit on existing teacher
- [ ] Verify form pre-populates with data

### Classes
- [ ] Navigate to /admin/classes
- [ ] Verify class list loads (3 classes)
- [ ] Test create new class
- [ ] Test edit existing class
- [ ] Test deactivate class

### Sections
- [ ] Navigate to /admin/sections
- [ ] Verify section list loads (6 sections)
- [ ] Test create new section
- [ ] Test edit existing section
- [ ] Test filter by class

### Subjects
- [ ] Navigate to /admin/subjects
- [ ] Verify subject list loads (5 subjects)
- [ ] Test create new subject
- [ ] Test edit existing subject

### Teacher Assignments
- [ ] Navigate to /admin/assignments
- [ ] Verify assignment list loads
- [ ] Test filter by teacher
- [ ] Test filter by class
- [ ] Test filter by subject
- [ ] Test create new assignment
- [ ] Test edit existing assignment

### Attendance
- [ ] Navigate to /admin/attendance
- [ ] Select class and section
- [ ] Verify student list loads
- [ ] Mark attendance for students (present/absent/late/excused)
- [ ] Save attendance
- [ ] Verify success message
- [ ] Navigate to /admin/attendance/history
- [ ] Verify history loads with pagination
- [ ] Test filter by date range
- [ ] Test filter by status

### Parents
- [ ] Navigate to /admin/parents
- [ ] Verify parent list loads (2 parents)
- [ ] Test search by name
- [ ] Test filter by relationship
- [ ] Test pagination
- [ ] Click "Add Parent" and verify form opens
- [ ] Fill form and create new parent

### Exams
- [ ] Navigate to /admin/exams
- [ ] Verify exam list loads (3 exams)
- [ ] Test filter by status
- [ ] Test filter by class
- [ ] Test pagination
- [ ] Click "Add Exam" and verify form opens
- [ ] Fill form and create new exam
- [ ] Add subjects to exam
- [ ] Verify exam subjects display

### Results
- [ ] Navigate to /admin/results
- [ ] Select exam
- [ ] Select subject
- [ ] Select class and section
- [ ] Verify student list loads
- [ ] Enter marks for students
- [ ] Verify automatic percentage/grade calculation
- [ ] Save results
- [ ] Verify success message

### Fees
- [ ] Navigate to /admin/fees
- [ ] Verify fee list loads
- [ ] Test filter by status
- [ ] Test pagination
- [ ] Click "Add Fee" and verify form opens
- [ ] Create new fee for student
- [ ] Navigate to payments tab
- [ ] Record payment for fee
- [ ] Verify balance calculation
- [ ] Click "Download Receipt"

### Report Cards
- [ ] Navigate to /admin/report-cards
- [ ] Select student
- [ ] Verify report card displays with:
  - [ ] Student information
  - [ ] Subject marks
  - [ ] Overall result
  - [ ] Attendance summary
- [ ] Click "Download PDF"
- [ ] Verify PDF generates correctly

### Announcements
- [ ] Navigate to /admin/announcements
- [ ] Verify announcement list loads
- [ ] Test pagination
- [ ] Click "Add Announcement" and verify form opens
- [ ] Create announcement with target type "all"
- [ ] Create announcement with target type "teachers"
- [ ] Create announcement with target type "parents"
- [ ] Create announcement with target type "class"
- [ ] Create announcement with target type "section"
- [ ] Test publish/unpublish

### Reports
- [ ] Navigate to /admin/reports
- [ ] Verify statistics display
- [ ] Test date filters
- [ ] Test class filters

### Notifications
- [ ] Click notification bell in header
- [ ] Verify dropdown shows recent announcements
- [ ] Click "Mark as read" on single notification
- [ ] Click "Mark all as read"
- [ ] Verify unread count updates

---

## TEACHER PORTAL QA CHECKLIST

### Login
- [ ] Navigate to /login
- [ ] Select "Teacher" role
- [ ] Enter teacher1@testacademy.edu / Test@1234
- [ ] Verify successful login and redirect to /teacher/dashboard

### Dashboard
- [ ] Verify dashboard loads with assigned classes
- [ ] Verify announcement widget displays
- [ ] Verify notification bell shows unread count

### My Classes
- [ ] Navigate to /teacher/my-classes
- [ ] Verify assigned classes display (Class 1 Section A for Teacher 1)
- [ ] Click on class to view details

### My Students
- [ ] Navigate to /teacher/my-students
- [ ] Verify student list loads for assigned classes
- [ ] Click on student to view profile
- [ ] Verify student profile displays:
  - [ ] Basic information
  - [ ] Attendance percentage
  - [ ] Recent results

### Attendance
- [ ] Navigate to /teacher/attendance
- [ ] Select assigned class and section
- [ ] Verify student list loads
- [ ] Mark attendance for students
- [ ] Save attendance
- [ ] Navigate to /teacher/attendance/history
- [ ] Verify history loads with pagination

### Assignments
- [ ] Navigate to /teacher/assignments
- [ ] Verify assignment list loads
- [ ] Click "Add Assignment" and verify form opens
- [ ] Create new assignment
- [ ] Verify assignment appears in list

### Results
- [ ] Navigate to /teacher/results
- [ ] Select exam
- [ ] Select subject
- [ ] Select class and section
- [ ] Verify student list loads
- [ ] Enter marks for students
- [ ] Save results

### Exams
- [ ] Navigate to /teacher/exams
- [ ] Verify exam list loads for assigned classes
- [ ] Click on exam to view details
- [ ] Verify exam subjects display

### Announcements
- [ ] Navigate to /teacher/announcements
- [ ] Verify announcements relevant to teacher display
- [ ] Verify "all" and "teachers" target type announcements visible
- [ ] Verify class-specific announcements visible

### Profile
- [ ] Navigate to /teacher/profile
- [ ] Verify profile information displays
- [ ] Test update profile

### Security Verification
- [ ] Attempt to access /admin/students - Should be denied
- [ ] Attempt to access /admin/teachers - Should be denied
- [ ] Verify only assigned classes visible

---

## PARENT PORTAL QA CHECKLIST

### Login
- [ ] Navigate to /login
- [ ] Select "Parent" role
- [ ] Enter parent1@testacademy.edu / Test@1234
- [ ] Verify successful login and redirect to /parent/dashboard

### Dashboard
- [ ] Verify dashboard loads with children summary
- [ ] Verify announcement widget displays
- [ ] Verify notification bell shows unread count

### Children
- [ ] Navigate to /parent/children
- [ ] Verify children list loads (2 children for Parent 1)
- [ ] Click on child to view profile
- [ ] Verify child profile displays:
  - [ ] Basic information
  - [ ] Class/section
  - [ ] Attendance percentage
  - [ ] Recent results
  - [ ] Outstanding fees

### Attendance
- [ ] Navigate to /parent/attendance
- [ ] Select child from dropdown
- [ ] Verify attendance records load
- [ ] Test filter by date range
- [ ] Test filter by status

### Assignments
- [ ] Navigate to /parent/assignments
- [ ] Select child from dropdown
- [ ] Verify assignments load for child's class

### Exams
- [ ] Navigate to /parent/exams
- [ ] Select child from dropdown
- [ ] Verify exams load for child's class
- [ ] Click on exam to view details

### Results
- [ ] Navigate to /parent/results
- [ ] Select child from dropdown
- [ ] Verify results load
- [ ] Test filter by status (pass/fail)

### Fees
- [ ] Navigate to /parent/fees
- [ ] Select child from dropdown
- [ ] Verify fee list loads
- [ ] Test filter by status
- [ ] Test pagination
- [ ] Navigate to payments tab
- [ ] Verify payment history loads
- [ ] Click "Download Receipt" on paid fee
- [ ] Verify PDF generates

### Report Cards
- [ ] Navigate to /parent/report-cards
- [ ] Select child from dropdown
- [ ] Verify report card displays with:
  - [ ] Student information
  - [ ] Subject marks
  - [ ] Overall result
  - [ ] Attendance summary
- [ ] Click "Download PDF"
- [ ] Verify PDF generates correctly

### Announcements
- [ ] Navigate to /parent/announcements
- [ ] Verify announcements relevant to parent display
- [ ] Verify "all" and "parents" target type announcements visible
- [ ] Verify children's class announcements visible

### Notifications
- [ ] Click notification bell in header
- [ ] Verify dropdown shows recent announcements
- [ ] Click "Mark as read" on single notification
- [ ] Click "Mark all as read"
- [ ] Verify unread count updates

### Profile
- [ ] Navigate to /parent/profile
- [ ] Verify profile information displays
- [ ] Test update profile

### Security Verification
- [ ] Attempt to access /admin/students - Should be denied
- [ ] Attempt to access /teacher/dashboard - Should be denied
- [ ] Verify only linked children visible
- [ ] Attempt to view another student's attendance - Should be denied
- [ ] Attempt to view another student's results - Should be denied
- [ ] Attempt to download another student's PDF - Should be denied

---

## PAGINATION QA CHECKLIST

### Test on all paginated pages:
- [ ] /admin/students
- [ ] /admin/teachers
- [ ] /admin/parents
- [ ] /admin/attendance/history
- [ ] /admin/fees
- [ ] /admin/announcements
- [ ] /admin/assignments
- [ ] /admin/exams
- [ ] /teacher/attendance/history
- [ ] /teacher/announcements
- [ ] /parent/fees
- [ ] /parent/announcements

### For each paginated page:
- [ ] Verify first page loads
- [ ] Click "Next" - verify next page loads
- [ ] Click "Previous" - verify previous page loads
- [ ] Click page number - verify correct page loads
- [ ] Verify total count displays correctly
- [ ] Apply search filter - verify pagination resets to page 1
- [ ] Apply filter - verify pagination resets to page 1
- [ ] Search with no results - verify empty state displays
- [ ] Verify no duplicate records across pages
- [ ] Verify no missing records across pages

---

## SECURITY QA CHECKLIST

### Admin Security
- [ ] Admin can view all data within their school
- [ ] Admin cannot access another school's data (verify RLS)

### Teacher Security
- [ ] Teacher cannot access /admin/* routes
- [ ] Teacher can only view assigned classes
- [ ] Teacher can only view students in assigned classes
- [ ] Teacher can only modify results for assigned subjects
- [ ] Teacher cannot view another teacher's assignments

### Parent Security
- [ ] Parent cannot access /admin/* routes
- [ ] Parent cannot access /teacher/* routes
- [ ] Parent can only view linked children
- [ ] Parent cannot view another parent's children
- [ ] Parent cannot view another student's attendance
- [ ] Parent cannot view another student's results
- [ ] Parent cannot view another student's fees
- [ ] Parent cannot download another student's PDF

### PDF Security
- [ ] /api/pdf/report-card requires authentication
- [ ] /api/pdf/fee-receipt requires authentication
- [ ] Parent can only download their children's PDFs
- [ ] Invalid studentId returns proper error
- [ ] Cross-school access is rejected

---

## RESPONSIVE QA CHECKLIST

### Test on Desktop (1920x1080)
- [ ] All pages display correctly
- [ ] Tables are readable
- [ ] Modals fit screen
- [ ] Navigation works

### Test on Tablet (768x1024)
- [ ] All pages display correctly
- [ ] Tables have horizontal scroll if needed
- [ ] Modals fit screen
- [ ] Navigation works (hamburger menu)

### Test on Mobile (375x667)
- [ ] All pages display correctly
- [ ] No horizontal overflow
- [ ] Tables are usable
- [ ] Modals fit screen
- [ ] Navigation works (hamburger menu)
- [ ] Pagination works

---

## DATA INTEGRITY CHECKLIST

### Verify Relationships
- [ ] Students ↔ Classes ↔ Sections (correct assignment)
- [ ] Parents ↔ Students (correct linking)
- [ ] Teachers ↔ Teacher Assignments (correct assignment)
- [ ] Attendance ↔ Students (correct records)
- [ ] Exams ↔ Subjects (correct exam subjects)
- [ ] Results ↔ Exams ↔ Students (correct marks)
- [ ] Fees ↔ Students (correct fee assignment)
- [ ] Payments ↔ Fees (correct payment records)
- [ ] Announcements ↔ Users (correct targeting)
- [ ] Notifications ↔ Announcements (correct read status)

### Verify Calculations
- [ ] Attendance percentage calculation correct
- [ ] Result percentage calculation correct
- [ ] Grade assignment correct (A+, A, B, C, D, F)
- [ ] Pass/fail status correct
- [ ] Fee balance calculation correct
- [ ] Outstanding fees calculation correct

---

## TEST DATA SUMMARY

| Entity | Count | Notes |
|--------|-------|-------|
| Schools | 1 | Test Academy (DEV) |
| Admins | 1 | admin@testacademy.edu |
| Teachers | 2 | teacher1@testacademy.edu, teacher2@testacademy.edu |
| Parents | 2 | parent1@testacademy.edu (2 children), parent2@testacademy.edu (1 child) |
| Classes | 3 | Class 1, Class 2, Class 3 |
| Sections | 6 | 2 sections per class |
| Subjects | 5 | Math, English, Science, Social Studies, CS |
| Students | 12 | Distributed across classes/sections |
| Exams | 3 | Mid Term, Final, Unit Test |
| Exam Subjects | 7 | Various subjects per exam |
| Results | Multiple | Various marks/grades |
| Fee Categories | Multiple | Tuition, Transport, Library, etc. |
| Student Fees | Multiple | Various statuses |
| Fee Payments | Multiple | Various payment methods |
| Announcements | Multiple | Various target types |
| Assignments | Multiple | Various classes/subjects |

---

## KNOWN LIMITATIONS

1. **No real-time updates** - Requires page refresh to see new data
2. **Image optimization** - Dynamic images use `<img>` instead of Next.js Image
3. **No error boundaries** - React Error Boundaries not implemented
4. **Reports page** - Fetches full tables for statistics (acceptable for aggregated data)

---

## SIGN-OFF

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Tester | _________________ | ________ | ___________ |
| Reviewer | _________________ | ________ | ___________ |
| Approver | _________________ | ________ | ___________ |
