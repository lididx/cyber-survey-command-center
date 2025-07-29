import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Trash2, ChevronDown, ChevronRight, Mail, MessageSquare, Archive as ArchiveIcon } from "lucide-react";
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
      let query = supabase
        .from("surveys")
        .select(`
          *,
          clients (name, logo_url),
          contacts (*),
          profiles (first_name, last_name)
        `)
        .eq("is_archived", true);

      // If user is not admin or manager, only show their own surveys
      if (profile && !['admin', 'manager'].includes(profile.role)) {
        query = query.eq("user_id", user?.id);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      setSurveys((data as any) || []);
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
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">ארכיון סקרים</h1>
          <Badge variant="secondary" className="text-lg px-6 py-3 bg-amber-100 text-amber-800 font-semibold border border-amber-200">
            {surveys.length} סקר{surveys.length !== 1 ? "ים" : ""} בארכיון
          </Badge>
        </div>

        {Object.keys(groupedSurveys).length === 0 ? (
          <Card className="citadel-card bg-amber-50 border-amber-200">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="bg-amber-100 rounded-full p-4 mb-6">
                <ArchiveIcon className="h-8 w-8 text-amber-600" />
              </div>
              <p className="text-amber-700 text-lg font-medium">הארכיון ריק כרגע</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedSurveys).map(([clientName, clientSurveys]) => (
              <Card key={clientName} className="citadel-card bg-amber-50/50 border-amber-200 hover:shadow-medium transition-shadow duration-200">
                <CardHeader 
                  className="cursor-pointer hover:bg-amber-100/50 transition-colors duration-150 border-b border-amber-100"
                  onClick={() => toggleClientExpansion(clientName)}
                >
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {expandedClients.has(clientName) ? (
                        <ChevronDown className="h-5 w-5 text-amber-600" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-amber-600" />
                      )}
                      
                      {/* תצוגת לוגו או שם לקוח */}
                       {clientSurveys[0]?.clients?.logo_url ? (
                         <div className="flex items-center gap-4">
                           <div className="bg-white p-2 rounded-lg border border-amber-200 opacity-75">
                             <img 
                               src={clientSurveys[0].clients.logo_url} 
                               alt={clientName} 
                               className="w-16 h-16 object-contain"
                             />
                           </div>
                           <div className="flex flex-col">
                             <span className="text-xl font-bold text-amber-800">{clientName}</span>
                             <span className="text-sm text-amber-600">לקוח בארכיון</span>
                           </div>
                         </div>
                       ) : (
                         <div className="flex items-center gap-4">
                           <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-4 rounded-lg text-white font-bold text-xl opacity-75">
                             {clientName.charAt(0)}
                           </div>
                           <div className="flex flex-col">
                             <span className="text-xl font-bold text-amber-800">{clientName}</span>
                             <span className="text-sm text-amber-600">לקוח בארכיון</span>
                           </div>
                         </div>
                       )}
                      
                      <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 font-semibold">
                        {clientSurveys.length} סקר{clientSurveys.length > 1 ? "ים" : ""}
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                
                {expandedClients.has(clientName) && (
                  <CardContent className="p-0">
                    {/* כותרות עמודות */}
                    <div className={`gap-4 p-4 bg-gradient-to-r from-amber-100 to-amber-50 border-b border-amber-200 font-semibold text-sm text-amber-800 text-center ${profile && ['admin', 'manager'].includes(profile.role) ? 'grid grid-cols-7' : 'grid grid-cols-6'}`}>
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
                      <div key={survey.id} className={`gap-4 p-4 border-b border-amber-100 hover:bg-amber-50/70 transition-colors items-center min-h-[80px] ${profile && ['admin', 'manager'].includes(profile.role) ? 'grid grid-cols-7' : 'grid grid-cols-6'}`}>
                        {/* שם המערכת */}
                        <div className="text-center">
                          <div className="font-semibold text-sm text-amber-800">{survey.system_name}</div>
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
                          <div className="text-sm text-amber-700">
                            {survey.received_date ? new Date(survey.received_date).toLocaleDateString('he-IL') : "לא הוזן"}
                          </div>
                        </div>

                        {/* אנשי קשר */}
                        <div className="text-center">
                          <div className="text-sm text-amber-700">
                            {survey.contacts?.length || 0} אנשי קשר
                          </div>
                        </div>

                        {/* תאריך ביצוע הסקר */}
                        <div className="text-center">
                          <div className="text-sm text-amber-700">
                            {new Date(survey.survey_date).toLocaleDateString('he-IL')}
                          </div>
                        </div>

                        {/* אחראי על הסקר - רק למנהלים ואדמינים */}
                        {profile && ['admin', 'manager'].includes(profile.role) && (
                          <div className="text-center">
                            <div className="text-sm text-amber-700">
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
                            className="h-8 px-3 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200 hover:border-green-300"
                            title="שחזר לדף הבית"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteSurvey(survey.id)}
                            className="h-8 px-3 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
                            title="מחק לצמיתות"
                          >
                            <Trash2 className="h-4 w-4" />
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