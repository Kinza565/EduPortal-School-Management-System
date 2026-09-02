-- =============================================
-- EduPortal TEST DATA SEED SCRIPT
-- =============================================
-- WARNING: This script is for DEVELOPMENT/TESTING ONLY
-- DO NOT run this in production
-- All data is fake/sample data for testing purposes
-- =============================================

-- =============================================
-- STEP 1: CREATE TEST SCHOOL
-- =============================================
INSERT INTO schools (id, name, email, phone, address, city)
VALUES (
  'ef5f3bc9-bfd1-409e-904e-bb74f990d674',
  'Test Academy (DEV)',
  'dev@testacademy.edu',
  '+1-555-0100',
  '123 Development Street',
  'Test City'
)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- STEP 2: CREATE TEST PROFILES
-- =============================================
-- NOTE: These profiles reference auth.users IDs
-- You must create the auth.users first via Supabase Dashboard
-- or use the Supabase Admin API

-- Admin profile (replace with actual auth user ID after creating auth user)
-- INSERT INTO profiles (id, school_id, full_name, email, phone, role, is_active)
-- VALUES (
--   'YOUR_ADMIN_AUTH_USER_ID',
--   'ef5f3bc9-bfd1-409e-904e-bb74f990d674',
--   'Test Admin',
--   'admin@testacademy.edu',
--   '+1-555-0101',
--   'admin',
--   true
-- );

-- Teacher profiles (replace with actual auth user IDs)
-- INSERT INTO profiles (id, school_id, full_name, email, phone, role, is_active)
-- VALUES
--   ('YOUR_TEACHER1_AUTH_USER_ID', 'ef5f3bc9-bfd1-409e-904e-bb74f990d674', 'Test Teacher One', 'teacher1@testacademy.edu', '+1-555-0102', 'teacher', true),
--   ('YOUR_TEACHER2_AUTH_USER_ID', 'ef5f3bc9-bfd1-409e-904e-bb74f990d674', 'Test Teacher Two', 'teacher2@testacademy.edu', '+1-555-0103', 'teacher', true);

-- Parent profiles (replace with actual auth user IDs)
-- INSERT INTO profiles (id, school_id, full_name, email, phone, role, is_active)
-- VALUES
--   ('YOUR_PARENT1_AUTH_USER_ID', 'ef5f3bc9-bfd1-409e-904e-bb74f990d674', 'Test Parent One', 'parent1@testacademy.edu', '+1-555-0104', 'parent', true),
--   ('YOUR_PARENT2_AUTH_USER_ID', 'ef5f3bc9-bfd1-409e-904e-bb74f990d674', 'Test Parent Two', 'parent2@testacademy.edu', '+1-555-0105', 'parent', true);

-- =============================================
-- STEP 3: CREATE CLASSES
-- =============================================
INSERT INTO classes (id, school_id, name, description, is_active)
VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'ef5f3bc9-bfd1-409e-904e-bb74f990d674', 'Class 1', 'First Grade', true),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'ef5f3bc9-bfd1-409e-904e-bb74f990d674', 'Class 2', 'Second Grade', true),
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'ef5f3bc9-bfd1-409e-904e-bb74f990d674', 'Class 3', 'Third Grade', true)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- STEP 4: CREATE SECTIONS
-- =============================================
INSERT INTO sections (id, school_id, class_id, name, capacity, is_active)
VALUES
  ('d4e5f6a7-b8c9-0123-defa-234567890123', 'ef5f3bc9-bfd1-409e-904e-bb74f990d674', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Section A', 40, true),
  ('e5f6a7b8-c9d0-1234-efab-345678901234', 'ef5f3bc9-bfd1-409e-904e-bb74f990d674', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Section B', 40, true),
  ('f6a7b8c9-d0e1-2345-fabc-456789012345', 'ef5f3bc9-bfd1-409e-904e-bb74f990d674', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Section A', 40, true),
  ('a7b8c9d0-e1f2-3456-abcd-567890123456', 'ef5f3bc9-bfd1-409e-904e-bb74f990d674', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Section B', 40, true),
  ('b8c9d0e1-f2a3-4567-bcde-678901234567', 'ef5f3bc9-bfd1-409e-904e-bb74f990d674', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 'Section A', 40, true),
  ('c9d0e1f2-a3b4-5678-cdef-789012345678', 'ef5f3bc9-bfd1-409e-904e-bb74f990d674', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 'Section B', 40, true)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- STEP 5: CREATE SUBJECTS
-- =============================================
INSERT INTO subjects (id, school_id, name, code, description, is_active)
VALUES
  ('d0e1f2a3-b4c5-6789-defa-890123456789', 'ef5f3bc9-bfd1-409e-904e-bb74f990d674', 'Mathematics', 'MATH101', 'Basic Mathematics', true),
  ('e1f2a3b4-c5d6-7890-efab-901234567890', 'ef5f3bc9-bfd1-409e-904e-bb74f990d674', 'English', 'ENG101', 'English Language', true),
  ('f2a3b4c5-d6e7-8901-fabc-012345678901', 'ef5f3bc9-bfd1-409e-904e-bb74f990d674', 'Science', 'SCI101', 'General Science', true),
  ('a3b4c5d6-e7f8-9012-abcd-123456789012', 'ef5f3bc9-bfd1-409e-904e-bb74f990d674', 'Social Studies', 'SOC101', 'Social Studies', true),
  ('b4c5d6e7-f8a9-0123-bcde-234567890123', 'ef5f3bc9-bfd1-409e-904e-bb74f990d674', 'Computer Science', 'CS101', 'Computer Basics', true)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- STEP 6: CREATE STUDENTS
-- =============================================
INSERT INTO students (id, school_id, student_id, roll_number, full_name, father_name, guardian_name, date_of_birth, gender, phone, address, admission_date, class_id, section_id, status)
VALUES
  ('c5d6e7f8-a9b0-1234-cdef-345678901234', 'ef5f3bc9-bfd1-409e-904e-bb74f990d674', 'STU001', '001', 'Test Student One', 'Father One', 'Guardian One', '2015-03-15', 'male', '+1-555-1001', '123 Test St', '2024-01-15', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'd4e5f6a7-b8c9-0123-defa-234567890123', 'active'),
  ('d6e7f8a9-b0c1-2345-defa-456789012345', 'ef5f3bc9-bfd1-409e-904e-bb74f990d674', 'STU002', '002', 'Test Student Two', 'Father Two', 'Guardian Two', '2015-05-20', 'female', '+1-555-1002', '456 Test Ave', '2024-01-15', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'd4e5f6a7-b8c9-0123-defa-234567890123', 'active'),
  ('e7f8a9b0-c1d2-3456-efab-567890123456', 'ef5f3bc9-bfd1-409e-904e-bb74f990d674', 'STU003', '003', 'Test Student Three', 'Father Three', 'Guardian Three', '2015-07-10', 'male', '+1-555-1003', '789 Test Blvd', '2024-01-15', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'e5f6a7b8-c9d0-1234-efab-345678901234', 'active'),
  ('f8a9b0c1-d2e3-4567-fabc-678901234567', 'ef5f3bc9-bfd1-409e-904e-bb74f990d674', 'STU004', '004', 'Test Student Four', 'Father Four', 'Guardian Four', '2015-09-25', 'female', '+1-555-1004', '321 Test Lane', '2024-01-15', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'e5f6a7b8-c9d0-1234-efab-345678901234', 'active'),
  ('a9b0c1d2-e3f4-5678-abcd-789012345678', 'ef5f3bc9-bfd1-409e-904e-bb74f990d674', 'STU005', '005', 'Test Student Five', 'Father Five', 'Guardian Five', '2014-02-14', 'male', '+1-555-1005', '654 Test Court', '2024-01-15', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'f6a7b8c9-d0e1-2345-fabc-456789012345', 'active'),
  ('b0c1d2e3-f4a5-6789-bcde-890123456789', 'ef5f3bc9-bfd1-409e-904e-bb74f990d674', 'STU006', '006', 'Test Student Six', 'Father Six', 'Guardian Six', '2014-04-30', 'female', '+1-555-1006', '987 Test Way', '2024-01-15', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'f6a7b8c9-d0e1-2345-fabc-456789012345', 'active'),
  ('c1d2e3f4-a5b6-7890-cdef-901234567890', 'ef5f3bc9-bfd1-409e-904e-bb74f990d674', 'STU007', '007', 'Test Student Seven', 'Father Seven', 'Guardian Seven', '2014-06-18', 'male', '+1-555-1007', '135 Test Plaza', '2024-01-15', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'a7b8c9d0-e1f2-3456-abcd-567890123456', 'active'),
  ('d2e3f4a5-b6c7-8901-defa-012345678901', 'ef5f3bc9-bfd1-409e-904e-bb74f990d674', 'STU008', '008', 'Test Student Eight', 'Father Eight', 'Guardian Eight', '2014-08-22', 'female', '+1-555-1008', '246 Test Circle', '2024-01-15', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'a7b8c9d0-e1f2-3456-abcd-567890123456', 'active'),
  ('e3f4a5b6-c7d8-9012-efab-123456789012', 'ef5f3bc9-bfd1-409e-904e-bb74f990d674', 'STU009', '009', 'Test Student Nine', 'Father Nine', 'Guardian Nine', '2013-01-10', 'male', '+1-555-1009', '357 Test Terrace', '2024-01-15', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 'b8c9d0e1-f2a3-4567-bcde-678901234567', 'active'),
  ('f4a5b6c7-d8e9-0123-fabc-234567890123', 'ef5f3bc9-bfd1-409e-904e-bb74f990d674', 'STU010', '010', 'Test Student Ten', 'Father Ten', 'Guardian Ten', '2013-03-28', 'female', '+1-555-1010', '468 Test Heights', '2024-01-15', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 'b8c9d0e1-f2a3-4567-bcde-678901234567', 'active'),
  ('a5b6c7d8-e9f0-1234-abcd-345678901234', 'ef5f3bc9-bfd1-409e-904e-bb74f990d674', 'STU011', '011', 'Test Student Eleven', 'Father Eleven', 'Guardian Eleven', '2013-05-12', 'male', '+1-555-1011', '579 Test Valley', '2024-01-15', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 'c9d0e1f2-a3b4-5678-cdef-789012345678', 'active'),
  ('b6c7d8e9-f0a1-2345-bcde-456789012345', 'ef5f3bc9-bfd1-409e-904e-bb74f990d674', 'STU012', '012', 'Test Student Twelve', 'Father Twelve', 'Guardian Twelve', '2013-07-08', 'female', '+1-555-1012', '680 Test Ridge', '2024-01-15', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 'c9d0e1f2-a3b4-5678-cdef-789012345678', 'active')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- STEP 7: CREATE PARENTS
-- =============================================
INSERT INTO parents (id, school_id, full_name, relationship, phone, email, address, occupation, is_active, profile_id)
VALUES
  ('c7d8e9f0-a1b2-3456-cdef-567890123456', 'ef5f3bc9-bfd1-409e-904e-bb74f990d674', 'Test Parent One', 'father', '+1-555-2001', 'parent1@testacademy.edu', '123 Parent St', 'Engineer', true, 'YOUR_PARENT1_AUTH_USER_ID'),
  ('d8e9f0a1-b2c3-4567-defa-678901234567', 'ef5f3bc9-bfd1-409e-904e-bb74f990d674', 'Test Parent Two', 'mother', '+1-555-2002', 'parent2@testacademy.edu', '456 Parent Ave', 'Doctor', true, 'YOUR_PARENT2_AUTH_USER_ID')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- STEP 8: CREATE PARENT-STUDENT RELATIONSHIPS
-- =============================================
-- Parent 1 has 2 children (Student 1 and Student 2)
-- Parent 2 has 1 child (Student 5)
INSERT INTO parent_student (id, school_id, parent_id, student_id, is_primary_contact)
VALUES
  ('e9f0a1b2-c3d4-5678-efab-789012345678', 'ef5f3bc9-bfd1-409e-904e-bb74f990d674', 'c7d8e9f0-a1b2-3456-cdef-567890123456', 'c5d6e7f8-a9b0-1234-cdef-345678901234', true),
  ('f0a1b2c3-d4e5-6789-fabc-890123456789', 'ef5f3bc9-bfd1-409e-904e-bb74f990d674', 'c7d8e9f0-a1b2-3456-cdef-567890123456', 'd6e7f8a9-b0c1-2345-defa-456789012345', false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567891', 'ef5f3bc9-bfd1-409e-904e-bb74f990d674', 'd8e9f0a1-b2c3-4567-defa-678901234567', 'a9b0c1d2-e3f4-5678-abcd-789012345678', true)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- STEP 9: CREATE TEACHER ASSIGNMENTS
-- =============================================
-- Teacher 1: Class 1 Section A (Math, Science), Class 1 Section B (English)
-- Teacher 2: Class 2 Section A (Math, English), Class 3 Section A (Science)
INSERT INTO teacher_assignments (id, school_id, teacher_id, class_id, section_id, subject_id, is_class_teacher)
VALUES
  ('b2c3d4e5-f6a7-8901-bcde-f12345678902', 'ef5f3bc9-bfd1-409e-904e-bb74f990d674', 'YOUR_TEACHER1_AUTH_USER_ID', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'd4e5f6a7-b8c9-0123-defa-234567890123', 'd0e1f2a3-b4c5-6789-defa-890123456789', true),
  ('c3d4e5f6-a7b8-9012-cdef-123456789013', 'ef5f3bc9-bfd1-409e-904e-bb74f990d674', 'YOUR_TEACHER1_AUTH_USER_ID', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'd4e5f6a7-b8c9-0123-defa-234567890123', 'f2a3b4c5-d6e7-8901-fabc-012345678901', false),
  ('d4e5f6a7-b8c9-0123-defa-234567890124', 'ef5f3bc9-bfd1-409e-904e-bb74f990d674', 'YOUR_TEACHER1_AUTH_USER_ID', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'e5f6a7b8-c9d0-1234-efab-345678901234', 'e1f2a3b4-c5d6-7890-efab-901234567890', false),
  ('e5f6a7b8-c9d0-1234-efab-345678901235', 'ef5f3bc9-bfd1-409e-904e-bb74f990d674', 'YOUR_TEACHER2_AUTH_USER_ID', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'f6a7b8c9-d0e1-2345-fabc-456789012345', 'd0e1f2a3-b4c5-6789-defa-890123456789', true),
  ('f6a7b8c9-d0e1-2345-fabc-456789012346', 'ef5f3bc9-bfd1-409e-904e-bb74f990d674', 'YOUR_TEACHER2_AUTH_USER_ID', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'f6a7b8c9-d0e1-2345-fabc-456789012345', 'e1f2a3b4-c5d6-7890-efab-901234567890', false),
  ('a7b8c9d0-e1f2-3456-abcd-567890123457', 'ef5f3bc9-bfd1-409e-904e-bb74f990d674', 'YOUR_TEACHER2_AUTH_USER_ID', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 'b8c9d0e1-f2a3-4567-bcde-678901234567', 'f2a3b4c5-d6e7-8901-fabc-012345678901', true)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- STEP 10: CREATE EXAMS
-- =============================================
INSERT INTO exams (id, school_id, name, exam_type, class_id, section_id, start_date, end_date, description, status)
VALUES
  ('b8c9d0e1-f2a3-4567-bcde-678901234568', 'ef5f3bc9-bfd1-409e-904e-bb74f990d674', 'Mid Term Exam 2024', 'mid_term', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', NULL, '2024-09-15', '2024-09-20', 'Mid term examination for all sections', 'completed'),
  ('c9d0e1f2-a3b4-5678-cdef-789012345679', 'ef5f3bc9-bfd1-409e-904e-bb74f990d674', 'Final Exam 2024', 'final', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', NULL, '2024-12-10', '2024-12-15', 'Final examination for all sections', 'upcoming'),
  ('d0e1f2a3-b4c5-6789-defa-890123456780', 'ef5f3bc9-bfd1-409e-904e-bb74f990d674', 'Unit Test 1', 'unit_test', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'f6a7b8c9-d0e1-2345-fabc-456789012345', '2024-08-01', '2024-08-02', 'First unit test for Class 2A', 'completed')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- STEP 11: CREATE EXAM SUBJECTS
-- =============================================
INSERT INTO exam_subjects (id, school_id, exam_id, subject_id, exam_date, start_time, end_time, total_marks, passing_marks, room_number)
VALUES
  ('e1f2a3b4-c5d6-7890-efab-901234567891', 'ef5f3bc9-bfd1-409e-904e-bb74f990d674', 'b8c9d0e1-f2a3-4567-bcde-678901234568', 'd0e1f2a3-b4c5-6789-defa-890123456789', '2024-09-15', '09:00', '11:00', 100, 35, 'Room 101'),
  ('f2a3b4c5-d6e7-8901-fabc-012345678902', 'ef5f3bc9-bfd1-409e-904e-bb74f990d674', 'b8c9d0e1-f2a3-4567-bcde-678901234568', 'e1f2a3b4-c5d6-7890-efab-901234567890', '2024-09-16', '09:00', '11:00', 100, 35, 'Room 102'),
  ('a3b4c5d6-e7f8-9012-abcd-123456789013', 'ef5f3bc9-bfd1-409e-904e-bb74f990d674', 'b8c9d0e1-f2a3-4567-bcde-678901234568', 'f2a3b4c5-d6e7-8901-fabc-012345678901', '2024-09-17', '09:00', '11:00', 100, 35, 'Room 103'),
  ('b4c5d6e7-f8a9-0123-bcde-234567890124', 'ef5f3bc9-bfd1-409e-904e-bb74f990d674', 'c9d0e1f2-a3b4-5678-cdef-789012345679', 'd0e1f2a3-b4c5-6789-defa-890123456789', '2024-12-10', '09:00', '11:00', 100, 35, 'Room 101'),
  ('c5d6e7f8-a9b0-1234-cdef-345678901235', 'ef5f3bc9-bfd1-409e-904e-bb74f990d674', 'c9d0e1f2-a3b4-5678-cdef-789012345679', 'e1f2a3b4-c5d6-7890-efab-901234567890', '2024-12-11', '09:00', '11:00', 100, 35, 'Room 102'),
  ('d6e7f8a9-b0c1-2345-defa-456789012346', 'ef5f3bc9-bfd1-409e-904e-bb74f990d674', 'd0e1f2a3-b4c5-6789-defa-890123456780', 'd0e1f2a3-b4c5-6789-defa-890123456789', '2024-08-01', '09:00', '11:00', 50, 20, 'Room 201'),
  ('e7f8a9b0-c1d2-3456-efab-567890123457', 'ef5f3bc9-bfd1-409e-904e-bb74f990d674', 'd0e1f2a3-b4c5-6789-defa-890123456780', 'e1f2a3b4-c5d6-7890-efab-901234567890', '2024-08-02', '09:00', '11:00', 50, 20, 'Room 202')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- STEP 12: CREATE RESULTS
-- =============================================
INSERT INTO results (id, school_id, exam_id, exam_subject_id, student_id, class_id, section_id, obtained_marks, total_marks, passing_marks, percentage, grade, status, remarks)
VALUES
  -- Mid Term Exam Results for Class 1 Section A
  ('f8a9b0c1-d2e3-4567-fabc-678901234568', 'ef5f3bc9-bfd1-409e-904e-bb74f990d674', 'b8c9d0e1-f2a3-4567-bcde-678901234568', 'e1f2a3b4-c5d6-7890-efab-901234567891', 'c5d6e7f8-a9b0-1234-cdef-345678901234', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'd4e5f6a7-b8c9-0123-defa-234567890123', 85, 100, 35, 85.00, 'A', 'pass', 'Excellent'),
  ('a9b0c1d2-e3f4-5678-abcd-789012345679', 'ef5f3bc9-bfd1-409e-904e-bb74f990d674', 'b8c9d0e1-f2a3-4567-bcde-678901234568', 'f2a3b4c5-d6e7-8901-fabc-012345678902', 'c5d6e7f8-a9b0-1234-cdef-345678901234', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'd4e5f6a7-b8c9-0123-defa-234567890123', 78, 100, 35, 78.00, 'B', 'pass', 'Good'),
  ('b0c1d2e3-f4a5-6789-bcde-890123456780', 'ef5f3bc9-bfd1-409e-904e-bb74f990d674', 'b8c9d0e1-f2a3-4567-bcde-678901234568', 'a3b4c5d6-e7f8-9012-abcd-123456789013', 'c5d6e7f8-a9b0-1234-cdef-345678901234', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'd4e5f6a7-b8c9-0123-defa-234567890123', 92, 100, 35, 92.00, 'A+', 'pass', 'Outstanding'),
  ('c1d2e3f4-a5b6-7890-cdef-901234567891', 'ef5f3bc9-bfd1-409e-904e-bb74f990d674', 'b8c9d0e1-f2a3-4567-bcde-678901234568', 'e1f2a3b4-c5d6-7890-efab-901234567891', 'd6e7f8a9-b0c1-2345-defa-456789012345', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'd4e5f6a7-b8c9-0123-defa-234567890123', 45, 100, 35, 45.00, 'D', 'pass', 'Needs improvement'),
  ('d2e3f4a5-b6c7-8901-defa-012345678902', 'ef5f3bc9-bfd1-409e-904e-bb74f990d674', 'b8c9d0e1-f2a3-4567-bcde-678901234568', 'f2a3b4c5-d6e7-8