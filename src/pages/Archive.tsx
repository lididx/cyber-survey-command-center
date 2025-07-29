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
  const { profile } = useAuth();
  const { toast } = useToast();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());

  const statusLabels: Record<string, string> = {
    received: "התקבל",
    email_sent_to_admin: "נשלח מייל תיאום למנהל המערכת",
    meeting_scheduled: "פגישה נקבעה",
    in_writing: "בכתיבה",
    completion_questions_with_admin: "שאלות השלמה מול מנהל מערכת",
    chen_review: "בבקרה של חן",
    completed: "הסתיים"
  };

  const fetchArchivedSurveys = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("surveys")
        .select(`
          *,
          clients (name),
          contacts (*)
        `)
        .eq("is_archived", true);

      // If user is not admin or manager, only show their own surveys
      if (profile && !['admin', 'manager'].includes(profile.role)) {
        query = query.eq("user_id", profile.id);
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
                  <CardContent className="space-y-4">
                    {clientSurveys.map((survey) => {
                      const primaryContact = survey.contacts[0];
                      
                      return (
                        <div key={survey.id} className="border rounded-lg p-4 space-y-3 bg-background/50">
                          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                            <div className="font-medium">{survey.system_name}</div>
                            
                            <div>
                              <Badge variant="outline">
                                {statusLabels[survey.status] || survey.status}
                              </Badge>
                            </div>
                            
                            <div className="text-sm text-muted-foreground">
                              {new Date(survey.survey_date).toLocaleDateString("he-IL")}
                            </div>
                            
                            <div className="text-sm">
                              {primaryContact ? (
                                `${primaryContact.first_name} ${primaryContact.last_name}`
                              ) : (
                                "אין איש קשר"
                              )}
                            </div>
                            
                            <div className="flex gap-2">
                              {primaryContact?.phone && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(`https://wa.me/972${primaryContact.phone.replace(/\D/g, '').slice(1)}`, '_blank')}
                                  title="פתח ב-WhatsApp"
                                >
                                  <MessageSquare className="h-4 w-4" />
                                </Button>
                              )}
                              
                              {primaryContact?.email && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(`mailto:${primaryContact.email}`, '_blank')}
                                  title="שלח מייל"
                                >
                                  <Mail className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => restoreSurvey(survey.id)}
                                title="שחזר לדף הבית"
                                className="text-green-600 hover:text-green-700"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                              
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => deleteSurvey(survey.id)}
                                title="מחק לצמיתות"
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
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