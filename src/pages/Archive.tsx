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
  received_date: string;
  status: string;
  client_id: string;
  user_id: string;
  clients: {
    name: string;
    logo_url: string | null;
  };
  contacts: Array<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    role: string;
  }>;
  profiles?: {
    first_name: string;
    last_name: string;
  };
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
      console.log("Starting to fetch archived surveys...");
      
      // Simplified query to avoid complex joins that might fail
      let query = supabase
        .from("surveys")
        .select(`
          id,
          system_name,
          system_description,
          survey_date,
          received_date,
          status,
          client_id,
          user_id,
          created_at
        `)
        .eq("is_archived", true);

      // If user is not admin or manager, only show their own surveys
      if (profile && !['admin', 'manager'].includes(profile.role)) {
        query = query.eq("user_id", user?.id);
      }

      const { data: surveysData, error } = await query.order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching surveys:", error);
        throw error;
      }

      console.log("Surveys fetched:", surveysData?.length);

      if (!surveysData || surveysData.length === 0) {
        setSurveys([]);
        return;
      }

      // Fetch clients separately
      const clientIds = [...new Set(surveysData.map(s => s.client_id))];
      const { data: clientsData, error: clientsError } = await supabase
        .from("clients")
        .select("id, name, logo_url")
        .in("id", clientIds);

      if (clientsError) {
        console.error("Error fetching clients:", clientsError);
      }

      // Fetch contacts separately
      const surveyIds = surveysData.map(s => s.id);
      const { data: contactsData, error: contactsError } = await supabase
        .from("contacts")
        .select("*")
        .in("survey_id", surveyIds);

      if (contactsError) {
        console.error("Error fetching contacts:", contactsError);
      }

      // Fetch profiles for admin/manager view
      let profilesData = null;
      if (profile && ['admin', 'manager'].includes(profile.role)) {
        const userIds = [...new Set(surveysData.map(s => s.user_id))];
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, first_name, last_name")
          .in("id", userIds);

        if (profilesError) {
          console.error("Error fetching profiles:", profilesError);
        } else {
          profilesData = profiles;
        }
      }

      // Combine data
      const enrichedSurveys = surveysData.map(survey => ({
        ...survey,
        clients: clientsData?.find(c => c.id === survey.client_id) || { name: "לקוח לא ידוע", logo_url: null },
        contacts: contactsData?.filter(c => c.survey_id === survey.id) || [],
        profiles: profilesData?.find(p => p.id === survey.user_id) || null
      }));

      setSurveys(enrichedSurveys);
    } catch (error: any) {
      console.error("Archive fetch error:", error);
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
      // First verify the survey exists and is archived
      const { data: surveyCheck } = await supabase
        .from("surveys")
        .select("id, is_archived")
        .eq("id", surveyId)
        .eq("is_archived", true)
        .single();

      if (!surveyCheck) {
        toast({
          title: "שגיאה",
          description: "הסקר לא נמצא או שכבר שוחזר",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("surveys")
        .update({ is_archived: false })
        .eq("id", surveyId)
        .eq("is_archived", true); // Double check to prevent multiple updates

      if (error) throw error;

      // Remove from local state only after successful database update
      setSurveys(prev => prev.filter(survey => survey.id !== surveyId));

      toast({
        title: "הסקר שוחזר בהצלחה",
        description: "הסקר הוחזר לדף הבית",
      });
    } catch (error: any) {
      console.error("Restore error:", error);
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
    if (profile) {
      fetchArchivedSurveys();
    }
  }, [profile]);

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
      <div className="space-y-6" dir="rtl">
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
                    <div className="flex items-center gap-3">
                      {expandedClients.has(clientName) ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                      
                      {/* תצוגת לוגו או שם לקוח */}
                       {clientSurveys[0]?.clients?.logo_url ? (
                         <div className="flex items-center gap-3">
                           <img 
                             src={clientSurveys[0].clients.logo_url} 
                             alt={clientName} 
                             className="w-12 h-12 object-contain rounded"
                           />
                           <span className="text-sm text-muted-foreground">{clientName}</span>
                         </div>
                       ) : (
                         <span>{clientName}</span>
                       )}
                      
                      <Badge variant="outline" className="bg-muted">
                        {clientSurveys.length} סקר{clientSurveys.length > 1 ? "ים" : ""}
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                
                {expandedClients.has(clientName) && (
                  <CardContent className="space-y-0">
                    {/* כותרות עמודות */}
                    <div className={`gap-4 p-4 border-b bg-muted/30 font-medium text-sm text-center ${profile && ['admin', 'manager'].includes(profile.role) ? 'grid grid-cols-7' : 'grid grid-cols-6'}`}>
                      <div>שם המערכת</div>
                      <div>סטטוס</div>
                      <div>תאריך קבלת הסקר</div>
                      <div>אנשי קשר</div>
                      <div>תאריך ביצוע הסקר</div>
                      {profile && ['admin', 'manager'].includes(profile.role) && (
                        <div>אחראי על הסקר</div>
                      )}
                      <div>פעולות</div>
                    </div>

                    {clientSurveys.map((survey: any) => (
                      <div key={survey.id} className={`gap-4 p-4 border-b hover:bg-muted/50 transition-colors items-center min-h-[80px] ${profile && ['admin', 'manager'].includes(profile.role) ? 'grid grid-cols-7' : 'grid grid-cols-6'}`}>
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

                        {/* אחראי על הסקר - רק למנהלים ואדמינים */}
                        {profile && ['admin', 'manager'].includes(profile.role) && (
                          <div className="text-center">
                            <div className="text-sm text-muted-foreground">
                              {survey.profiles ? `${survey.profiles.first_name} ${survey.profiles.last_name}` : "לא זמין"}
                            </div>
                          </div>
                        )}

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