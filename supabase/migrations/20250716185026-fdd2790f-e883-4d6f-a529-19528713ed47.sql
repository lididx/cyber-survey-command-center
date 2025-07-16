-- Create enums for roles and statuses
CREATE TYPE public.user_role AS ENUM ('surveyor', 'manager', 'admin');
CREATE TYPE public.survey_status AS ENUM (
  'received',
  'email_sent_to_admin',
  'meeting_scheduled',
  'in_writing',
  'completion_questions_with_admin',
  'chen_review',
  'completed'
);
CREATE TYPE public.gender AS ENUM ('male', 'female');

-- Create clients table
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert predefined clients
INSERT INTO public.clients (name) VALUES
  ('הראל'),
  ('מנורה'),
  ('בנק הפועלים'),
  ('בנק לאומי'),
  ('מת"ף'),
  ('בנק ישראל'),
  ('מרכנתיל'),
  ('מכבי'),
  ('מגדל'),
  ('הפניקס'),
  ('בנק ירושלים'),
  ('הכשרה');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'surveyor',
  gender gender NOT NULL DEFAULT 'male',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create surveys table
CREATE TABLE public.surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) NOT NULL,
  system_name TEXT NOT NULL,
  system_description TEXT,
  survey_date DATE NOT NULL,
  status survey_status NOT NULL DEFAULT 'received',
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create contacts table
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID REFERENCES public.surveys(id) ON DELETE CASCADE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  role TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create survey history table for tracking changes
CREATE TABLE public.survey_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID REFERENCES public.surveys(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Clients are viewable by all authenticated users
CREATE POLICY "Clients viewable by authenticated users" ON public.clients
  FOR SELECT TO authenticated USING (true);

-- Only admins can modify clients
CREATE POLICY "Only admins can modify clients" ON public.clients
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Managers can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role IN ('manager', 'admin')
    )
  );

-- Surveys policies
CREATE POLICY "Users can view their own surveys" ON public.surveys
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Managers can view all surveys" ON public.surveys
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role IN ('manager', 'admin')
    )
  );

CREATE POLICY "Users can create their own surveys" ON public.surveys
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own surveys" ON public.surveys
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own surveys" ON public.surveys
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Contacts policies
CREATE POLICY "Users can view contacts for their surveys" ON public.contacts
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.surveys 
      WHERE surveys.id = contacts.survey_id AND surveys.user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can view all contacts" ON public.contacts
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role IN ('manager', 'admin')
    )
  );

CREATE POLICY "Users can manage contacts for their surveys" ON public.contacts
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.surveys 
      WHERE surveys.id = contacts.survey_id AND surveys.user_id = auth.uid()
    )
  );

-- Survey history policies
CREATE POLICY "Users can view history for their surveys" ON public.survey_history
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.surveys 
      WHERE surveys.id = survey_history.survey_id AND surveys.user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can view all survey history" ON public.survey_history
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role IN ('manager', 'admin')
    )
  );

CREATE POLICY "Users can create history entries" ON public.survey_history
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, role, gender)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'surveyor'),
    COALESCE((NEW.raw_user_meta_data->>'gender')::gender, 'male')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updating timestamps
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_surveys_updated_at BEFORE UPDATE ON public.surveys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to track survey changes
CREATE OR REPLACE FUNCTION public.track_survey_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Track status changes
  IF OLD.status != NEW.status THEN
    INSERT INTO public.survey_history (survey_id, user_id, field_name, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'status', OLD.status::text, NEW.status::text);
  END IF;
  
  -- Track archive changes
  IF OLD.is_archived != NEW.is_archived THEN
    INSERT INTO public.survey_history (survey_id, user_id, field_name, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'is_archived', OLD.is_archived::text, NEW.is_archived::text);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for tracking survey changes
CREATE TRIGGER track_survey_changes_trigger
  AFTER UPDATE ON public.surveys
  FOR EACH ROW EXECUTE FUNCTION public.track_survey_changes();