
-- Create predictions table
CREATE TABLE public.predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  batch_id TEXT,
  student_id TEXT,
  student_name TEXT,
  course TEXT,
  semester INT,
  -- Input features
  age_at_enrollment INT,
  gender INT,
  displaced INT,
  debtor INT,
  tuition_fees_up_to_date INT,
  scholarship_holder INT,
  cu_1st_sem_enrolled INT,
  cu_1st_sem_approved INT,
  cu_1st_sem_grade NUMERIC,
  cu_2nd_sem_enrolled INT,
  cu_2nd_sem_approved INT,
  cu_2nd_sem_grade NUMERIC,
  -- Output
  outcome TEXT,
  risk_score NUMERIC,
  risk_level TEXT,
  dropout_prob NUMERIC,
  graduate_prob NUMERIC,
  recommendation TEXT,
  intervention TEXT
);

-- Enable RLS
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can read predictions"
  ON public.predictions FOR SELECT
  USING (true);

-- Public insert access
CREATE POLICY "Anyone can insert predictions"
  ON public.predictions FOR INSERT
  WITH CHECK (true);

-- Public update access
CREATE POLICY "Anyone can update predictions"
  ON public.predictions FOR UPDATE
  USING (true);

-- Public delete access  
CREATE POLICY "Anyone can delete predictions"
  ON public.predictions FOR DELETE
  USING (true);
