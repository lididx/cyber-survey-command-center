import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Mail, History, Archive, Trash2, Phone, MessageSquare, ChevronDown, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AddSurveyDialog from "@/components/AddSurveyDialog";
import SurveyHistoryDialog from "@/components/SurveyHistoryDialog";
import EmailTemplateDialog from "@/components/EmailTemplateDialog";
import EditSurveyDialog from "@/components/EditSurveyDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
interface Survey {
  id: string;
  system_name: string;
  system_description: string;
  survey_date: string;
  received_date: string;
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
const Dashboard = () => {
  const {
    profile
  } = useAuth();
  const {
    toast
  } = useToast();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const statusLabels: Record<string, string> = {
    received: "התקבל",
    email_sent_to_admin: "נשלח מייל תיאום למנהל המערכת",
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
  const statusOptions = Object.entries(statusLabels).map(([value, label]) => ({
    value,
    label
  }));
  const fetchSurveys = async () => {
    try {
      setLoading(true);
      const {
        data,
        error
      } = await supabase.from("surveys").select(`
          *,
          clients (name),
          contacts (*)
        `).eq("is_archived", false).order("created_at", {
        ascending: false
      });
      if (error) throw error;
      setSurveys(data || []);
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: "לא ניתן לטעון את הסקרים",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const updateSurveyStatus = async (surveyId: string, newStatus: string) => {
    try {
      const {
        error
      } = await supabase.from("surveys").update({
        status: newStatus as any
      }).eq("id", surveyId);
      if (error) throw error;
      setSurveys(prev => prev.map(survey => survey.id === surveyId ? {
        ...survey,
        status: newStatus
      } : survey));
      toast({
        title: "הסטטוס עודכן בהצלחה",
        description: `הסטטוס עודכן ל: ${statusLabels[newStatus as keyof typeof statusLabels]}`
      });
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: "לא ניתן לעדכן את הסטטוס",
        variant: "destructive"
      });
    }
  };
  const archiveSurvey = async (surveyId: string) => {
    try {
      const {
        error
      } = await supabase.from("surveys").update({
        is_archived: true
      }).eq("id", surveyId);
      if (error) throw error;
      setSurveys(prev => prev.filter(survey => survey.id !== surveyId));
      toast({
        title: "הסקר הועבר לארכיון",
        description: "הסקר הועבר בהצלחה לארכיון"
      });
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: "לא ניתן להעביר לארכיון",
        variant: "destructive"
      });
    }
  };
  const deleteSurvey = async (surveyId: string) => {
    if (!confirm("האם אתה בטוח שברצונך למחוק את הסקר? פעולה זו לא ניתנת לביטול.")) {
      return;
    }
    try {
      const {
        error
      } = await supabase.from("surveys").delete().eq("id", surveyId);
      if (error) throw error;
      setSurveys(prev => prev.filter(survey => survey.id !== surveyId));
      toast({
        title: "הסקר נמחק",
        description: "הסקר נמחק בהצלחה מהמערכת"
      });
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: "לא ניתן למחוק את הסקר",
        variant: "destructive"
      });
    }
  };
  useEffect(() => {
    fetchSurveys();
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
    return <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </Layout>;
  }
  return <Layout>
      <div className="space-y-6" dir="rtl">
        <div className="flex justify-between items-center">
          <Button onClick={() => setShowAddDialog(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            הוסף סקר חדש
          </Button>
          <h1 className="text-3xl font-bold text-foreground">דשבורד סקרים</h1>
        </div>

        {Object.keys(groupedSurveys).length === 0 ? <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground text-lg mb-4">אין סקרים פתוחים כרגע</p>
              <Button onClick={() => setShowAddDialog(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                הוסף סקר ראשון
              </Button>
            </CardContent>
          </Card> : <div className="space-y-4">
            {Object.entries(groupedSurveys).map(([clientName, clientSurveys]) => <Card key={clientName}>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => toggleClientExpansion(clientName)}>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {expandedClients.has(clientName) ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                      <span>{clientName}</span>
                      <Badge variant="secondary">
                        {clientSurveys.length} סקר{clientSurveys.length > 1 ? "ים" : ""}
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                
                {expandedClients.has(clientName) && <CardContent className="space-y-4">
                    {/* כותרות טבלה */}
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 p-3 bg-muted/50 rounded-lg font-semibold text-sm">
                      <div>שם המערכת</div>
                      <div>סטטוס</div>
                      <div>תאריך קבלת הסקר</div>
                      <div>אנשי קשר</div>
                      <div>תאריך ביצוע הסקר</div>
                      <div>פעולות</div>
                    </div>
                    
                    {clientSurveys.map(survey => {
              const primaryContact = survey.contacts[0];
              const contactNames = survey.contacts.map(c => `${c.first_name} ${c.last_name}`);
              return <div key={survey.id} className="border rounded-lg p-4 px-0 py-[17px] my-[7px] mx-0">
                          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                            <div className="font-medium truncate">{survey.system_name}</div>
                            
                            <div>
                              <Badge 
                                style={{ backgroundColor: statusColors[survey.status], color: 'white' }}
                                className="text-xs"
                              >
                                {statusLabels[survey.status]}
                              </Badge>
                              <Select value={survey.status} onValueChange={value => updateSurveyStatus(survey.id, value)}>
                                <SelectTrigger className="mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {statusOptions.map(option => <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="text-sm">
                              {survey.received_date ? new Date(survey.received_date).toLocaleDateString("he-IL") : "לא צוין"}
                            </div>
                            
                            <div className="text-sm space-y-1">
                              <div>
                                {primaryContact ? `${primaryContact.first_name} ${primaryContact.last_name}` : "אין איש קשר"}
                              </div>
                              <div className="flex gap-1">
                                {primaryContact?.phone && <Button variant="outline" size="sm" onClick={() => window.open(`https://wa.me/972${primaryContact.phone.replace(/\D/g, '').slice(1)}`, '_blank')} title="פתח ב-WhatsApp">
                                    <MessageSquare className="h-3 w-3" />
                                  </Button>}
                                
                                {primaryContact?.email && <Button variant="outline" size="sm" onClick={() => window.open(`mailto:${primaryContact.email}`, '_blank')} title="שלח מייל">
                                    <Mail className="h-3 w-3" />
                                  </Button>}
                              </div>
                            </div>
                            
                            <div className="text-sm">
                              {new Date(survey.survey_date).toLocaleDateString("he-IL")}
                            </div>
                            
                            <div className="flex gap-1 flex-wrap">
                              <Button variant="outline" size="sm" title="עריכה" onClick={() => {
                      setSelectedSurvey(survey);
                      setShowEditDialog(true);
                    }}>
                                <Edit className="h-3 w-3" />
                              </Button>
                              
                              <Button variant="outline" size="sm" title="תבנית מייל" onClick={() => {
                      setSelectedSurvey(survey);
                      setShowEmailDialog(true);
                    }}>
                                <Mail className="h-3 w-3" />
                              </Button>
                              
                              <Button variant="outline" size="sm" title="היסטוריית שינויים" onClick={() => {
                      setSelectedSurvey(survey);
                      setShowHistoryDialog(true);
                    }}>
                                <History className="h-3 w-3" />
                              </Button>
                              
                              <Button variant="outline" size="sm" onClick={() => archiveSurvey(survey.id)} title="העבר לארכיון">
                                <Archive className="h-3 w-3" />
                              </Button>
                              
                              <Button variant="outline" size="sm" onClick={() => deleteSurvey(survey.id)} title="מחק" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>;
            })}
                  </CardContent>}
              </Card>)}
          </div>}

        {showAddDialog && <AddSurveyDialog open={showAddDialog} onOpenChange={setShowAddDialog} onSuccess={fetchSurveys} />}

        {showHistoryDialog && selectedSurvey && <SurveyHistoryDialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog} surveyId={selectedSurvey.id} surveyName={selectedSurvey.system_name} />}

        {showEmailDialog && selectedSurvey && <EmailTemplateDialog 
          open={showEmailDialog} 
          onOpenChange={setShowEmailDialog} 
          surveyName={selectedSurvey.system_name} 
          clientName={selectedSurvey.clients.name} 
          contactEmail={selectedSurvey.contacts[0]?.email}
          contactNames={selectedSurvey.contacts.map(c => `${c.first_name} ${c.last_name}`)}
          userFirstName={profile?.first_name}
          userGender={profile?.gender}
        />}

        {showEditDialog && selectedSurvey && <EditSurveyDialog open={showEditDialog} onOpenChange={setShowEditDialog} survey={selectedSurvey} onSuccess={fetchSurveys} />}
      </div>
    </Layout>;
};
export default Dashboard;