-- Phase 7: Fees Management
-- EduPortal - School Management System

-- =============================================
-- FEE CATEGORIES
-- =============================================
CREATE TABLE IF NOT EXISTS public.fee_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_fee_categories_id_school_id UNIQUE (id, school_id),
  CONSTRAINT uq_fee_category_name_per_school UNIQUE (school_id, name)
);

CREATE INDEX IF NOT EXISTS idx_fee_categories_school_id ON public.fee_categories(school_id);
CREATE INDEX IF NOT EXISTS idx_fee_categories_is_active ON public.fee_categories(is_active);

-- =============================================
-- FEE STRUCTURES
-- =============================================
CREATE TABLE IF NOT EXISTS public.fee_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.fee_categories(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  section_id UUID REFERENCES public.sections(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('monthly', 'quarterly', 'half_yearly', 'yearly', 'one_time')),
  due_day INTEGER CHECK (due_day >= 1 AND due_day <= 31),
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_until DATE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_fee_structures_id_school_id UNIQUE (id, school_id),
  CONSTRAINT fk_fee_structure_section_class FOREIGN KEY (section_id, class_id)
    REFERENCES public.sections(id, class_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_fee_structures_school_id ON public.fee_structures(school_id);
CREATE INDEX IF NOT EXISTS idx_fee_structures_category_id ON public.fee_structures(category_id);
CREATE INDEX IF NOT EXISTS idx_fee_structures_class_id ON public.fee_structures(class_id);
CREATE INDEX IF NOT EXISTS idx_fee_structures_section_id ON public.fee_structures(section_id);
CREATE INDEX IF NOT EXISTS idx_fee_structures_is_active ON public.fee_structures(is_active);

-- =============================================
-- STUDENT FEES (INVOICES)
-- =============================================
CREATE TABLE IF NOT EXISTS public.student_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.fee_categories(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  section_id UUID REFERENCES public.sections(id) ON DELETE SET NULL,
  fee_structure_id UUID REFERENCES public.fee_structures(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  due_date DATE NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('paid', 'partial', 'pending', 'overdue', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_student_fees_id_school_id UNIQUE (id, school_id),
  CONSTRAINT fk_student_fee_section_class FOREIGN KEY (section_id, class_id)
    REFERENCES public.sections(id, class_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_student_fees_school_id ON public.student_fees(school_id);
CREATE INDEX IF NOT EXISTS idx_student_fees_student_id ON public.student_fees(student_id);
CREATE INDEX IF NOT EXISTS idx_student_fees_category_id ON public.student_fees(category_id);
CREATE INDEX IF NOT EXISTS idx_student_fees_class_id ON public.student_fees(class_id);
CREATE INDEX IF NOT EXISTS idx_student_fees_section_id ON public.student_fees(section_id);
CREATE INDEX IF NOT EXISTS idx_student_fees_status ON public.student_fees(status);
CREATE INDEX IF NOT EXISTS idx_student_fees_due_date ON public.student_fees(due_date);

-- =============================================
-- FEE PAYMENTS
-- =============================================
CREATE TABLE IF NOT EXISTS public.fee_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_fee_id UUID NOT NULL REFERENCES public.student_fees(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bank_transfer', 'online', 'cheque', 'other')),
  reference_number TEXT,
  remarks TEXT,
  received_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_fee_payments_id_school_id UNIQUE (id, school_id)
);

CREATE INDEX IF NOT EXISTS idx_fee_payments_school_id ON public.fee_payments(school_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_student_fee_id ON public.fee_payments(student_fee_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_student_id ON public.fee_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_payment_date ON public.fee_payments(payment_date);

-- =============================================
-- UPDATED_AT TRIGGERS
-- =============================================
CREATE TRIGGER set_fee_categories_updated_at
  BEFORE UPDATE ON public.fee_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_fee_structures_updated_at
  BEFORE UPDATE ON public.fee_structures
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_student_fees_updated_at
  BEFORE UPDATE ON public.student_fees
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_fee_payments_updated_at
  BEFORE UPDATE ON public.fee_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.fee_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_payments ENABLE ROW LEVEL SECURITY;

-- =============================================
-- FEE CATEGORIES POLICIES
-- =============================================

-- Admin policies
CREATE POLICY "Admins can view fee categories in their school" ON public.fee_categories
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert fee categories in their school" ON public.fee_categories
  FOR INSERT WITH CHECK (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update fee categories in their school" ON public.fee_categories
  FOR UPDATE USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete fee categories in their school" ON public.fee_categories
  FOR DELETE USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Teacher policies (view only)
CREATE POLICY "Teachers can view fee categories in their school" ON public.fee_categories
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

-- =============================================
-- FEE STRUCTURES POLICIES
-- =============================================

-- Admin policies
CREATE POLICY "Admins can view fee structures in their school" ON public.fee_structures
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert fee structures in their school" ON public.fee_structures
  FOR INSERT WITH CHECK (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update fee structures in their school" ON public.fee_structures
  FOR UPDATE USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete fee structures in their school" ON public.fee_structures
  FOR DELETE USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Teacher policies (view only)
CREATE POLICY "Teachers can view fee structures in their school" ON public.fee_structures
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

-- =============================================
-- STUDENT FEES POLICIES
-- =============================================

-- Admin policies
CREATE POLICY "Admins can view student fees in their school" ON public.student_fees
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert student fees in their school" ON public.student_fees
  FOR INSERT WITH CHECK (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update student fees in their school" ON public.student_fees
  FOR UPDATE USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete student fees in their school" ON public.student_fees
  FOR DELETE USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Teacher policies (view only)
CREATE POLICY "Teachers can view student fees in their school" ON public.student_fees
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

-- =============================================
-- FEE PAYMENTS POLICIES
-- =============================================

-- Admin policies
CREATE POLICY "Admins can view fee payments in their school" ON public.fee_payments
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert fee payments in their school" ON public.fee_payments
  FOR INSERT WITH CHECK (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update fee payments in their school" ON public.fee_payments
  FOR UPDATE USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete fee payments in their school" ON public.fee_payments
  FOR DELETE USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Teacher policies (view and insert)
CREATE POLICY "Teachers can view fee payments in their school" ON public.fee_payments
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

CREATE POLICY "Teachers can insert fee payments in their school" ON public.fee_payments
  FOR INSERT WITH CHECK (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );
