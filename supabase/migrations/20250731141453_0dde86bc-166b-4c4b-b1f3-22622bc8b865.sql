-- Create CVE Categories table
CREATE TABLE public.cve_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create CVE Systems table
CREATE TABLE public.cve_systems (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.cve_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  created_by UUID NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cve_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cve_systems ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cve_categories - all authenticated users can view, only admins can modify
CREATE POLICY "All authenticated users can view CVE categories" 
ON public.cve_categories 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Only admins can modify CVE categories" 
ON public.cve_categories 
FOR ALL 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() 
  AND role = 'admin'
));

-- RLS Policies for cve_systems - all authenticated users can view and create
CREATE POLICY "All authenticated users can view CVE systems" 
ON public.cve_systems 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create CVE systems" 
ON public.cve_systems 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Users can update their own CVE systems" 
ON public.cve_systems 
FOR UPDATE 
TO authenticated
USING (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Admins can modify all CVE systems" 
ON public.cve_systems 
FOR ALL 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() 
  AND role = 'admin'
));

-- Add triggers for updated_at
CREATE TRIGGER update_cve_categories_updated_at
  BEFORE UPDATE ON public.cve_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cve_systems_updated_at
  BEFORE UPDATE ON public.cve_systems
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial categories
INSERT INTO public.cve_categories (name, display_name, description) VALUES
('os_cve', 'OS CVE', 'מערכות הפעלה ומוקדי האבטחה שלהן'),
('database_cve', 'Database CVE', 'מסדי נתונים ומוקדי האבטחה שלהן'),
('programming_languages', 'שפות פיתוח', 'שפות פיתוח ופריימוורקים'),
('web_application_server_cve', 'Web Application Server CVE', 'שרתי אפליקציות ווב ומוקדי האבטחה שלהן');

-- Insert initial CVE systems for OS CVE
INSERT INTO public.cve_systems (category_id, name, url) 
SELECT id, 'Microsoft Windows Server', 'https://www.cvedetails.com/version-list/0/10784/1/' 
FROM public.cve_categories WHERE name = 'os_cve';

INSERT INTO public.cve_systems (category_id, name, url) 
SELECT id, 'Ubuntu Linux', 'https://www.cvedetails.com/version-list/4781/20550/1/Canonical-Ubuntu-Linux.html' 
FROM public.cve_categories WHERE name = 'os_cve';

INSERT INTO public.cve_systems (category_id, name, url) 
SELECT id, 'CentOS Server', 'https://www.cvedetails.com/version-list/0/18131/1/' 
FROM public.cve_categories WHERE name = 'os_cve';

INSERT INTO public.cve_systems (category_id, name, url) 
SELECT id, 'Debian Linux', 'https://www.cvedetails.com/version-list/23/36/1/Debian-Debian-Linux.html' 
FROM public.cve_categories WHERE name = 'os_cve';

INSERT INTO public.cve_systems (category_id, name, url) 
SELECT id, 'SUSE Linux Enterprise Server', 'https://www.cvedetails.com/version-list/0/32658/1/' 
FROM public.cve_categories WHERE name = 'os_cve';

INSERT INTO public.cve_systems (category_id, name, url) 
SELECT id, 'Oracle Linux Server', 'https://www.cvedetails.com/version-list/93/21375/1/Oracle-Linux.html' 
FROM public.cve_categories WHERE name = 'os_cve';

INSERT INTO public.cve_systems (category_id, name, url) 
SELECT id, 'Vmware Esxi OS', 'https://www.cvedetails.com/version-list/252/22134/1/Vmware-Esxi.html' 
FROM public.cve_categories WHERE name = 'os_cve';

INSERT INTO public.cve_systems (category_id, name, url) 
SELECT id, 'IBM AIX', 'https://www.cvedetails.com/version-list/14/17/1/IBM-AIX.html' 
FROM public.cve_categories WHERE name = 'os_cve';

-- Insert Database CVE systems
INSERT INTO public.cve_systems (category_id, name, url) 
SELECT id, 'Oracle Database Server', 'https://www.cvedetails.com/version-list/93/467/1/Oracle-Database-Server.html' 
FROM public.cve_categories WHERE name = 'database_cve';

INSERT INTO public.cve_systems (category_id, name, url) 
SELECT id, 'Microsoft SQL Server', 'https://www.cvedetails.com/version-list/0/251/1/' 
FROM public.cve_categories WHERE name = 'database_cve';

INSERT INTO public.cve_systems (category_id, name, url) 
SELECT id, 'PostgreSQL', 'https://www.cvedetails.com/version-list/336/575/1/Postgresql-Postgresql.html' 
FROM public.cve_categories WHERE name = 'database_cve';

INSERT INTO public.cve_systems (category_id, name, url) 
SELECT id, 'IBM DB2', 'https://www.cvedetails.com/version-list/0/3424/1/' 
FROM public.cve_categories WHERE name = 'database_cve';

INSERT INTO public.cve_systems (category_id, name, url) 
SELECT id, 'MongoDB', 'https://www.cvedetails.com/version-list/12752/25450/1/Mongodb-Mongodb.html' 
FROM public.cve_categories WHERE name = 'database_cve';

INSERT INTO public.cve_systems (category_id, name, url) 
SELECT id, 'Cassandra', 'https://www.cvedetails.com/version-list/0/31429/1/' 
FROM public.cve_categories WHERE name = 'database_cve';

INSERT INTO public.cve_systems (category_id, name, url) 
SELECT id, 'Neo4j', 'https://www.cvedetails.com/version-list/13275/27539/1/Neo4j-Neo4j.html' 
FROM public.cve_categories WHERE name = 'database_cve';

INSERT INTO public.cve_systems (category_id, name, url) 
SELECT id, 'SQLite', 'https://www.cvedetails.com/version-list/9237/16355/1/Sqlite-Sqlite.html' 
FROM public.cve_categories WHERE name = 'database_cve';

-- Insert Programming Languages systems
INSERT INTO public.cve_systems (category_id, name, url) 
SELECT id, 'Java SE (Standard Edition)', 'https://www.cvedetails.com/version-list/0/34277/1/' 
FROM public.cve_categories WHERE name = 'programming_languages';

INSERT INTO public.cve_systems (category_id, name, url) 
SELECT id, 'Python', 'https://www.cvedetails.com/version-list/10210/18230/1/Python-Python.html' 
FROM public.cve_categories WHERE name = 'programming_languages';

INSERT INTO public.cve_systems (category_id, name, url) 
SELECT id, 'Microsoft .NET', 'https://www.cvedetails.com/version-list/0/2002/1/' 
FROM public.cve_categories WHERE name = 'programming_languages';

INSERT INTO public.cve_systems (category_id, name, url) 
SELECT id, '.NET Framework End Of Life', 'https://dotnet.microsoft.com/en-us/download/dotnet-framework' 
FROM public.cve_categories WHERE name = 'programming_languages';

INSERT INTO public.cve_systems (category_id, name, url) 
SELECT id, 'PHP', 'https://www.cvedetails.com/version-list/74/128/1/PHP-PHP.html' 
FROM public.cve_categories WHERE name = 'programming_languages';

INSERT INTO public.cve_systems (category_id, name, url) 
SELECT id, 'Angular Framework (JavaScript)', 'https://www.cvedetails.com/version-list/27257/115892/1/Angular-Angular.html' 
FROM public.cve_categories WHERE name = 'programming_languages';

INSERT INTO public.cve_systems (category_id, name, url) 
SELECT id, 'Node.js', 'https://www.cvedetails.com/version-list/12113/30764/1/Nodejs-Node.js.html' 
FROM public.cve_categories WHERE name = 'programming_languages';

INSERT INTO public.cve_systems (category_id, name, url) 
SELECT id, 'Facebook React', 'https://www.cvedetails.com/version-list/7758/61450/1/Facebook-React.html' 
FROM public.cve_categories WHERE name = 'programming_languages';

-- Insert Web Application Server CVE systems
INSERT INTO public.cve_systems (category_id, name, url) 
SELECT id, 'IIS', 'https://www.cvedetails.com/version-list/0/3436/1/' 
FROM public.cve_categories WHERE name = 'web_application_server_cve';

INSERT INTO public.cve_systems (category_id, name, url) 
SELECT id, 'Apache Http Server', 'https://www.cvedetails.com/version-list/0/17262/1/' 
FROM public.cve_categories WHERE name = 'web_application_server_cve';

INSERT INTO public.cve_systems (category_id, name, url) 
SELECT id, 'Apache Tomcat', 'https://www.cvedetails.com/version-list/0/887/1/' 
FROM public.cve_categories WHERE name = 'web_application_server_cve';

INSERT INTO public.cve_systems (category_id, name, url) 
SELECT id, 'Node.js (Web Server)', 'https://www.cvedetails.com/version-list/12113/30764/1/Nodejs-Node.js.html' 
FROM public.cve_categories WHERE name = 'web_application_server_cve';

INSERT INTO public.cve_systems (category_id, name, url) 
SELECT id, 'Redhat Wildfly (Jboss)', 'https://www.cvedetails.com/version-list/0/54064/1/' 
FROM public.cve_categories WHERE name = 'web_application_server_cve';

INSERT INTO public.cve_systems (category_id, name, url) 
SELECT id, 'Oracle Glassfish', 'https://www.cvedetails.com/version-list/0/20700/1/' 
FROM public.cve_categories WHERE name = 'web_application_server_cve';

INSERT INTO public.cve_systems (category_id, name, url) 
SELECT id, 'Jetty Http Server', 'https://www.cvedetails.com/version-list/1294/2254/1/Jetty-Jetty-Http-Server.html' 
FROM public.cve_categories WHERE name = 'web_application_server_cve';

INSERT INTO public.cve_systems (category_id, name, url) 
SELECT id, 'Nginx', 'https://www.cvedetails.com/version-list/10048/17956/1/Nginx-Nginx.html' 
FROM public.cve_categories WHERE name = 'web_application_server_cve';

INSERT INTO public.cve_systems (category_id, name, url) 
SELECT id, 'Oracle Weblogic Server', 'https://www.cvedetails.com/version-list/0/14534/1/' 
FROM public.cve_categories WHERE name = 'web_application_server_cve';

INSERT INTO public.cve_systems (category_id, name, url) 
SELECT id, 'IBM Websphere Application Server', 'https://www.cvedetails.com/version-list/0/576/1/' 
FROM public.cve_categories WHERE name = 'web_application_server_cve';

INSERT INTO public.cve_systems (category_id, name, url) 
SELECT id, 'Django', 'https://www.cvedetails.com/version-list/10199/18211/1/Djangoproject-Django.html' 
FROM public.cve_categories WHERE name = 'web_application_server_cve';

INSERT INTO public.cve_systems (category_id, name, url) 
SELECT id, 'Vmware Spring Boot', 'https://www.cvedetails.com/version-list/0/112132/1/' 
FROM public.cve_categories WHERE name = 'web_application_server_cve';

INSERT INTO public.cve_systems (category_id, name, url) 
SELECT id, 'Gunicorn', 'https://www.cvedetails.com/version-list/17891/45578/1/Gunicorn-Gunicorn.html' 
FROM public.cve_categories WHERE name = 'web_application_server_cve';