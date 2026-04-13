import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, BarChart3, Users, Activity, AlertTriangle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import StatisticsFilters from "@/components/StatisticsFilters";
import SurveyDetailsTable from "@/components/SurveyDetailsTable";
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

const statusLabels: Record<string, string> = {
  received: "התקבל",
  email_sent_to_admin: "נשלח מייל תיאום למנהל מערכת",
  meeting_scheduled: "פגישה נקבעה",
  in_writing: "בכתיבה",
  completion_questions_with_admin: "שאלות השלמה מול מנהל מערכת",
  completion_questions_with_vendor: "שאלות השלמה מול ספק המערכת",
  chen_review: "בבקרה של חן",
  returned_from_review: "חזר מבדיקה",
  frozen: "מוקפא",
  postponed_to_new_date: "ידחה למועד חדש",
  completed: "הסתיים"
};

const statusColors: Record<string, string> = {
  received: "#4FC3F7",
  email_sent_to_admin: "#7E57C2",
  meeting_scheduled: "#81C784",
  in_writing: "#FFB74D",
  completion_questions_with_admin: "#FB8C00",
  completion_questions_with_vendor: "#E65100",
  chen_review: "#8E24AA",
  returned_from_review: "#D2691E",
  frozen: "#546E7A",
  postponed_to_new_date: "#F06292",
  completed: "#388E3C"
};

const Statistics = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfiles, setUserProfiles] = useState<any[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    stuck_survey_threshold_days: 5,
    status_colors: statusColors,
    email_templates: {}
  });
  const [showAdminSettings, setShowAdminSettings] = useState(false);
  
  const [filters, setFilters] = useState({
    dateFrom: null as Date | null,
    dateTo: null as Date | null,
    client: "all",
    status: "all",
    searchTerm: "",
    surveyor: "all"
  });

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
        status_colors: settings.status_colors || statusColors,
        email_templates: settings.email_templates || {}
      });
    } catch (error) {
      console.error("Error fetching system settings:", error);
    }
  };

  const fetchUserProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, role")
        .eq("role", "surveyor")
        .order("first_name");
      if (error) throw error;
      setUserProfiles(data || []);
    } catch (error: any) {
      console.error("Error fetching user profiles:", error);
    }
  };

  const fetchSurveys = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("surveys")
        .select(`*, clients (name), contacts (id, first_name, last_name)`)
        .eq("is_archived", false);
      if (profile && !['admin', 'manager'].includes(profile.role)) {
        query = query.eq("user_id", user?.id);
      }
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      setSurveys(data || []);
    } catch (error: any) {
      toast({ title: "שגיאה", description: "לא ניתן לטעון את נתוני הסקרים", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile) {
      fetchSystemSettings();
      fetchSurveys();
      if (['admin', 'manager'].includes(profile.role)) {
        fetchUserProfiles();
      }
    }
  }, [profile]);

  const uniqueClients = [...new Set(surveys.map(s => s.clients?.name).filter(name => name && name.trim() !== ''))];

  const filteredSurveys = surveys.filter(survey => {
    if (filters.searchTerm && !survey.system_name.toLowerCase().includes(filters.searchTerm.toLowerCase())) return false;
    if (filters.client !== "all" && survey.clients?.name !== filters.client) return false;
    if (filters.status !== "all" && survey.status !== filters.status) return false;
    if (filters.surveyor !== "all" && survey.user_id !== filters.surveyor) return false;
    if (filters.dateFrom && survey.survey_date && new Date(survey.survey_date) < filters.dateFrom) return false;
    if (filters.dateTo && survey.survey_date && new Date(survey.survey_date) > filters.dateTo) return false;
    return true;
  });

  const isAdmin = profile?.role === 'admin';

  // KPI calculations
  const totalOpen = filteredSurveys.filter(s => s.status !== 'completed').length;
  const totalClients = new Set(filteredSurveys.map(s => s.clients?.name).filter(Boolean)).size;
  
  // Status counts (only show statuses with > 0 count)
  const statusCounts = filteredSurveys.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Stuck surveys
  const stuckSurveys = filteredSurveys.filter(survey => {
    const daysSinceUpdate = Math.floor((Date.now() - new Date(survey.updated_at).getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceUpdate > systemSettings.stuck_survey_threshold_days && survey.status !== 'completed';
  });

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8" dir="rtl">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">סטטיסטיקה</h1>
            <p className="text-muted-foreground mt-1">מבט על על פעילות הסקרים</p>
          </div>
          {isAdmin && (
            <Button onClick={() => setShowAdminSettings(true)} variant="outline" size="sm">
              <Settings className="h-4 w-4 ml-2" />
              הגדרות
            </Button>
          )}
        </div>

        {/* KPI Cards - Modern */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">סקרים פתוחים</p>
                  <p className="text-4xl font-bold mt-1 text-blue-700 dark:text-blue-400">{totalOpen}</p>
                </div>
                <div className="bg-blue-500/10 p-3 rounded-xl">
                  <Activity className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20 border-emerald-200/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">לקוחות</p>
                  <p className="text-4xl font-bold mt-1 text-emerald-700 dark:text-emerald-400">{totalClients}</p>
                </div>
                <div className="bg-emerald-500/10 p-3 rounded-xl">
                  <Users className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 border-amber-200/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">סקרים חריגים</p>
                  <p className="text-4xl font-bold mt-1 text-amber-700 dark:text-amber-400">{stuckSurveys.length}</p>
                </div>
                <div className="bg-amber-500/10 p-3 rounded-xl">
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                </div>
              </div>
              {stuckSurveys.length > 0 && (
                <p className="text-xs text-amber-600 mt-2">
                  מעל {systemSettings.stuck_survey_threshold_days} ימים ללא עדכון
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Status Distribution - Horizontal Bars */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              פיזור לפי סטטוס
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(statusCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([status, count]) => {
                  const maxCount = Math.max(...Object.values(statusCounts));
                  const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                  const color = statusColors[status] || "#8884d8";
                  return (
                    <div key={status} className="flex items-center gap-3">
                      <div className="w-36 text-sm text-right truncate flex-shrink-0">
                        {statusLabels[status] || status}
                      </div>
                      <div className="flex-1 bg-muted rounded-full h-7 relative overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500 ease-out flex items-center justify-end px-3"
                          style={{ width: `${Math.max(percentage, 8)}%`, backgroundColor: color }}
                        >
                          <span className="text-white text-xs font-bold">{count}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <StatisticsFilters
          filters={filters}
          setFilters={setFilters}
          uniqueClients={uniqueClients}
          statusLabels={statusLabels}
          userProfiles={userProfiles}
          isManager={['admin', 'manager'].includes(profile?.role || '')}
        />

        {/* Survey Details Table */}
        <SurveyDetailsTable 
          surveys={filteredSurveys}
          systemSettings={systemSettings}
          statusLabels={statusLabels}
          isAdmin={['admin', 'manager'].includes(profile?.role || '')}
          userProfiles={userProfiles}
        />

        {/* Stuck Surveys / סקרים חריגים */}
        {stuckSurveys.length > 0 && (
          <Card className="border-amber-200 dark:border-amber-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                סקרים חריגים
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                  {stuckSurveys.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {stuckSurveys.map(survey => {
                  const days = Math.floor((Date.now() - new Date(survey.updated_at).getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={survey.id} className="rounded-xl border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{survey.system_name}</span>
                        <Badge 
                          className="text-white text-[10px]" 
                          style={{ backgroundColor: statusColors[survey.status] }}
                        >
                          {statusLabels[survey.status]}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{survey.clients?.name}</p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-amber-700 font-semibold">{days} ימים ללא עדכון</span>
                        <span className="text-muted-foreground">
                          {new Date(survey.updated_at).toLocaleDateString('he-IL')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

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
