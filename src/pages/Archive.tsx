import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Trash2, ChevronDown, ChevronRight, Mail, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Survey {
  id: string;
  system_name: string;
  system_description: string;
  survey_date: string;
  status: string;
  client_id: string;
  clients: {
    name: string;
  };
  contacts: Array<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    role: string;
  }>;
}

const Archive = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());

  const statusLabels: Record<string, string> = {
    received: "התקבל",
    email_sent_to_admin: "נשלח מייל תיאום למנהל מערכת",
    meeting_scheduled: "פגישה נקבעה",
    in_writing: "בכתיבה",
    completion_questions_with_admin: "שאלות השלמה מול מנהל מערכת",
    chen_review: "בבקרה של חן",
    completed: "הסתיים"
  };

  const statusColors: Record<string, string> = {
    received: "#4FC3F7",
    email_sent_to_admin: "#7E57C2",
    meeting_scheduled: "#81C784",
    in_writing: "#FFB74D",
    completion_questions_with_admin: "#FB8C00",
    chen_review: "#8E24AA",
    completed: "#388E3C"
  };

  const fetchArchivedSurveys = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("surveys")
        .select(`
          *,
          clients (name, logo_url),
          contacts (*)
        `)
        .eq("is_archived", true);

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
        description: "לא ניתן לטעון את הסקרים הארכיוניים",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const restoreSurvey = async (surveyId: string) => {
    try {
      const { error } = await supabase
        .from("surveys")
        .update({ is_archived: false })
        .eq("id", surveyId);

      if (error) throw error;

      setSurveys(prev => prev.filter(survey => survey.id !== surveyId));

      toast({
        title: "הסקר שוחזר בהצלחה",
        description: "הסקר הוחזר לדף הבית",
      });
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: "לא ניתן לשחזר את הסקר",
        variant: "destructive",
      });
    }
  };

  const deleteSurvey = async (surveyId: string) => {
    if (!confirm("האם אתה בטוח שברצונך למחוק את הסקר לצמיתות? פעולה זו לא ניתנת לביטול.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("surveys")
        .delete()
        .eq("id", surveyId);

      if (error) throw error;

      setSurveys(prev => prev.filter(survey => survey.id !== surveyId));

      toast({
        title: "הסקר נמחק לצמיתות",
        description: "הסקר נמחק בהצלחה מהמערכת",
      });
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: "לא ניתן למחוק את הסקר",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchArchivedSurveys();
  }, []);

  const groupedSurveys = surveys.reduce((acc, survey) => {
    const clientName = survey.clients.name;
    if (!acc[clientName]) {
      acc[clientName] = [];
    }
    acc[clientName].push(survey);
    return acc;
  }, {} as Record<string, Survey[]>);

  const toggleClientExpansion = (clientName: string) => {
    const newExpanded = new Set(expandedClients);
    if (newExpanded.has(clientName)) {
      newExpanded.delete(clientName);
    } else {
      newExpanded.add(clientName);
    }
    setExpandedClients(newExpanded);
  };

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
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground">ארכיון סקרים</h1>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {surveys.length} סקר{surveys.length !== 1 ? "ים" : ""} בארכיון
          </Badge>
        </div>

        {Object.keys(groupedSurveys).length === 0 ? (
          <Card className="bg-muted/20">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground text-lg">הארכיון ריק כרגע</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedSurveys).map(([clientName, clientSurveys]) => (
              <Card key={clientName} className="bg-muted/20 border-muted">
                <CardHeader 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleClientExpansion(clientName)}
                >
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {expandedClients.has(clientName) ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                      <span>{clientName}</span>
                      <Badge variant="outline" className="bg-muted">
                        {clientSurveys.length} סקר{clientSurveys.length > 1 ? "ים" : ""}
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                
                {expandedClients.has(clientName) && (
                  <CardContent className="space-y-0">
                    {/* כותרות עמודות */}
                    <div className="grid grid-cols-6 gap-4 p-4 border-b bg-muted/30 font-medium text-sm text-center">
                      <div>שם המערכת</div>
                      <div>סטטוס</div>
                      <div>תאריך קבלת הסקר</div>
                      <div>אנשי קשר</div>
                      <div>תאריך ביצוע הסקר</div>
                      <div>פעולות</div>
                    </div>

                    {clientSurveys.map((survey: any) => (
                      <div key={survey.id} className="grid grid-cols-6 gap-4 p-4 border-b hover:bg-muted/50 transition-colors items-center min-h-[80px]">
                        {/* שם המערכת */}
                        <div className="text-center">
                          <div className="font-medium text-sm">{survey.system_name}</div>
                        </div>

                        {/* סטטוס */}
                        <div className="text-center">
                          <div 
                            className="inline-block px-3 py-1 rounded-full text-white text-xs font-medium"
                            style={{ backgroundColor: statusColors[survey.status] }}
                          >
                            {statusLabels[survey.status]}
                          </div>
                        </div>

                        {/* תאריך קבלת הסקר */}
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">
                            {survey.received_date ? new Date(survey.received_date).toLocaleDateString('he-IL') : "לא הוזן"}
                          </div>
                        </div>

                        {/* אנשי קשר */}
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">
                            {survey.contacts?.length || 0} אנשי קשר
                          </div>
                        </div>

                        {/* תאריך ביצוע הסקר */}
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">
                            {new Date(survey.survey_date).toLocaleDateString('he-IL')}
                          </div>
                        </div>

                        {/* פעולות */}
                        <div className="flex justify-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => restoreSurvey(survey.id)}
                            className="h-6 px-2"
                          >
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteSurvey(survey.id)}
                            className="text-destructive hover:text-destructive h-6 px-2"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Archive;