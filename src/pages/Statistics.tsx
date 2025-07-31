import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, BarChart3, PieChart, TrendingUp, Clock, AlertTriangle, Mail, Settings } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import KPICards from "@/components/KPICards";
import StatisticsFilters from "@/components/StatisticsFilters";
import ChartsSection from "@/components/ChartsSection";
import SurveyDetailsTable from "@/components/SurveyDetailsTable";
import RemindersSection from "@/components/RemindersSection";
import AdminSettingsDialog from "@/components/AdminSettingsDialog";

interface Survey {
  id: string;
  system_name: string;
  survey_date: string;
  received_date: string;
  status: string;
  client_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  clients: {
    name: string;
  };
  contacts: Array<{
    id: string;
    first_name: string;
    last_name: string;
  }>;
}

interface SystemSettings {
  stuck_survey_threshold_days: number;
  status_colors: Record<string, string>;
  email_templates: Record<string, string>;
}

const Statistics = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    stuck_survey_threshold_days: 5,
    status_colors: {},
    email_templates: {}
  });
  const [showAdminSettings, setShowAdminSettings] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    dateFrom: null as Date | null,
    dateTo: null as Date | null,
    client: "",
    status: "",
    searchTerm: ""
  });

  const statusLabels: Record<string, string> = {
    received: "התקבל",
    email_sent_to_admin: "נשלח מייל תיאום למנהל מערכת",
    meeting_scheduled: "פגישה נקבעה",
    in_writing: "בכתיבה",
    completion_questions_with_admin: "שאלות השלמה מול מנהל מערכת",
    chen_review: "בבקרה של חן",
    completed: "הסתיים"
  };

  const fetchSystemSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("setting_key, setting_value");

      if (error) throw error;

      const settings: any = {};
      data?.forEach(setting => {
        if (setting.setting_key === 'stuck_survey_threshold_days') {
          settings.stuck_survey_threshold_days = parseInt(setting.setting_value as string);
        } else {
          settings[setting.setting_key] = setting.setting_value;
        }
      });

      setSystemSettings({
        stuck_survey_threshold_days: settings.stuck_survey_threshold_days || 5,
        status_colors: settings.status_colors || {},
        email_templates: settings.email_templates || {}
      });
    } catch (error) {
      console.error("Error fetching system settings:", error);
    }
  };

  const fetchSurveys = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from("surveys")
        .select(`
          *,
          clients (name),
          contacts (id, first_name, last_name)
        `)
        .eq("is_archived", false);

      // If user is not admin or manager, only show their own surveys
      if (profile && !['admin', 'manager'].includes(profile.role)) {
        query = query.eq("user_id", user?.id);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      setSurveys(data || []);
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: "לא ניתן לטעון את נתוני הסקרים",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile) {
      fetchSystemSettings();
      fetchSurveys();
    }
  }, [profile]);

  // Get unique clients for filter
  const uniqueClients = [...new Set(surveys.map(s => s.clients?.name).filter(Boolean))];

  // Filter surveys based on current filters
  const filteredSurveys = surveys.filter(survey => {
    if (filters.searchTerm && !survey.system_name.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
      return false;
    }
    if (filters.client && survey.clients?.name !== filters.client) {
      return false;
    }
    if (filters.status && survey.status !== filters.status) {
      return false;
    }
    if (filters.dateFrom && new Date(survey.created_at) < filters.dateFrom) {
      return false;
    }
    if (filters.dateTo && new Date(survey.created_at) > filters.dateTo) {
      return false;
    }
    return true;
  });

  const isAdmin = profile?.role === 'admin';

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">סטטיסטיקה אישית</h1>
            <p className="text-muted-foreground">נתונים ויזואליים על פעילות הסקרים שלך</p>
          </div>
          {isAdmin && (
            <Button onClick={() => setShowAdminSettings(true)} variant="outline">
              <Settings className="h-4 w-4 ml-2" />
              הגדרות מערכת
            </Button>
          )}
        </div>

        {/* KPI Cards */}
        <KPICards 
          surveys={filteredSurveys} 
          systemSettings={systemSettings}
          statusLabels={statusLabels}
        />

        {/* Filters */}
        <StatisticsFilters
          filters={filters}
          setFilters={setFilters}
          uniqueClients={uniqueClients}
          statusLabels={statusLabels}
        />

        {/* Charts Section */}
        <ChartsSection 
          surveys={filteredSurveys}
          systemSettings={systemSettings}
          statusLabels={statusLabels}
        />

        {/* Reminders Section */}
        <RemindersSection 
          surveys={filteredSurveys}
          systemSettings={systemSettings}
          statusLabels={statusLabels}
        />

        {/* Survey Details Table */}
        <SurveyDetailsTable 
          surveys={filteredSurveys}
          systemSettings={systemSettings}
          statusLabels={statusLabels}
        />

        {/* Admin Settings Dialog */}
        {isAdmin && (
          <AdminSettingsDialog
            open={showAdminSettings}
            onOpenChange={setShowAdminSettings}
            systemSettings={systemSettings}
            onSettingsUpdate={fetchSystemSettings}
          />
        )}
      </div>
    </Layout>
  );
};

export default Statistics;