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
}
const Dashboard = () => {
  const {
    user,
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
      
      // Debug logging
      console.log("Dashboard fetchSurveys - User:", user?.id);
      console.log("Dashboard fetchSurveys - Profile:", profile);
      console.log("Dashboard fetchSurveys - Profile role:", profile?.role);
      
      let query = supabase.from("surveys").select(`
          *,
          clients (name, logo_url),
          contacts (*)
        `).eq("is_archived", false);

      // If user is not admin or manager, only show their own surveys
      if (profile && !['admin', 'manager'].includes(profile.role)) {
        console.log("Dashboard fetchSurveys - Filtering to user's surveys only");
        query = query.eq("user_id", user?.id);
      } else {
        console.log("Dashboard fetchSurveys - Admin/Manager: showing all surveys");
      }

      const { data, error } = await query.order("created_at", {
        ascending: false
      });
      
      if (error) throw error;
      setSurveys((data as any) || []);
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
    if (profile) {
      fetchSurveys();
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
    return <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </Layout>;
  }
  return <Layout>
      <div className="space-y-6" dir="rtl">
        <div className="flex justify-between items-center">
          <Button onClick={() => setShowAddDialog(true)} className="citadel-button-primary flex items-center gap-2 font-semibold">
            <Plus className="h-4 w-4" />
            הוסף סקר חדש
          </Button>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">דשבורד סקרים</h1>
        </div>

        {Object.keys(groupedSurveys).length === 0 ? (
          <Card className="citadel-card">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="bg-slate-100 rounded-full p-4 mb-6">
                <Plus className="h-8 w-8 text-slate-500" />
              </div>
              <p className="text-slate-600 text-lg mb-6 font-medium">אין סקרים פתוחים כרגע</p>
              <Button onClick={() => setShowAddDialog(true)} className="citadel-button-primary flex items-center gap-2 font-semibold">
                <Plus className="h-4 w-4" />
                הוסף סקר ראשון
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedSurveys).map(([clientName, clientSurveys]) => (
              <Card key={clientName} className="citadel-card border-slate-200 hover:shadow-medium transition-shadow duration-200">
                <CardHeader className="cursor-pointer hover:bg-slate-50/70 transition-colors duration-150 border-b border-slate-100" onClick={() => toggleClientExpansion(clientName)}>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {expandedClients.has(clientName) ? <ChevronDown className="h-5 w-5 text-slate-600" /> : <ChevronRight className="h-5 w-5 text-slate-600" />}
                      
                      {/* תצוגת לוגו או שם לקוח */}
                       {clientSurveys[0]?.clients?.logo_url ? (
                         <div className="flex items-center gap-4">
                           <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                             <img 
                               src={clientSurveys[0].clients.logo_url} 
                               alt={clientName} 
                               className="w-16 h-16 object-contain"
                             />
                           </div>
                           <div className="flex flex-col">
                             <span className="text-xl font-bold text-slate-800">{clientName}</span>
                             <span className="text-sm text-slate-500">לקוח פעיל</span>
                           </div>
                         </div>
                       ) : (
                         <div className="flex items-center gap-4">
                           <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-lg text-white font-bold text-xl">
                             {clientName.charAt(0)}
                           </div>
                           <div className="flex flex-col">
                             <span className="text-xl font-bold text-slate-800">{clientName}</span>
                             <span className="text-sm text-slate-500">לקוח פעיל</span>
                           </div>
                         </div>
                       )}
                      
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 font-semibold">
                        {clientSurveys.length} סקר{clientSurveys.length > 1 ? "ים" : ""}
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                
                 {expandedClients.has(clientName) && (
                    <CardContent className="p-0">
                    {/* כותרות טבלה */}
                    <div className={`citadel-table-header grid grid-cols-1 gap-4 p-4 text-sm ${profile && ['admin', 'manager'].includes(profile.role) ? 'md:grid-cols-7' : 'md:grid-cols-6'}`}>
                      <div className="text-center">שם המערכת</div>
                      <div className="text-center">סטטוס</div>
                      <div className="text-center">תאריך קבלת הסקר</div>
                      <div className="text-center">אנשי קשר</div>
                      <div className="text-center">תאריך ביצוע הסקר</div>
                      {profile && ['admin', 'manager'].includes(profile.role) && (
                        <div className="text-center">אחראי על הסקר</div>
                      )}
                      <div className="text-center">פעולות</div>
                    </div>
                    
                    {clientSurveys.map(survey => {
                      const primaryContact = survey.contacts[0];
                      const contactNames = survey.contacts.map(c => `${c.first_name} ${c.last_name}`);
                      return (
                        <div key={survey.id} className="citadel-table-row">
                          <div className={`grid grid-cols-1 gap-4 items-center min-h-[80px] p-4 ${profile && ['admin', 'manager'].includes(profile.role) ? 'md:grid-cols-7' : 'md:grid-cols-6'}`}>
                            {/* שם המערכת בלבד */}
                            <div className="font-semibold text-center text-slate-800">{survey.system_name}</div>
                            
                            <div>
                              <Select value={survey.status} onValueChange={value => updateSurveyStatus(survey.id, value)}>
                                <SelectTrigger 
                                  style={{ 
                                    backgroundColor: statusColors[survey.status], 
                                    color: 'white',
                                    borderColor: statusColors[survey.status]
                                  }}
                                  className="text-white border-0"
                                >
                                  <SelectValue>
                                    {statusLabels[survey.status]}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  {statusOptions.map(option => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="text-sm text-center text-slate-600">
                              {survey.received_date ? new Date(survey.received_date).toLocaleDateString("he-IL") : "לא צוין"}
                            </div>
                            
                            <div className="text-sm text-center space-y-2">
                              <div className="font-medium text-slate-700">
                                {primaryContact ? `${primaryContact.first_name} ${primaryContact.last_name}` : "אין איש קשר"}
                              </div>
                              <div className="flex gap-1 justify-center">
                                {primaryContact?.phone && (
                                  <Button variant="outline" size="sm" onClick={() => window.open(`https://wa.me/972${primaryContact.phone.replace(/\D/g, '').slice(1)}`, '_blank')} title="פתח ב-WhatsApp" className="citadel-action-button">
                                    <MessageSquare className="h-3 w-3" />
                                  </Button>
                                )}
                                
                                {primaryContact?.email && (
                                  <Button variant="outline" size="sm" onClick={() => window.open(`mailto:${primaryContact.email}`, '_blank')} title="שלח מייל" className="citadel-action-button">
                                    <Mail className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                            
                            <div className="text-sm text-center text-slate-600">
                              {new Date(survey.survey_date).toLocaleDateString("he-IL")}
                            </div>
                            
                            {profile && ['admin', 'manager'].includes(profile.role) && (
                              <div className="text-sm text-center text-slate-600">
                                לא זמין
                              </div>
                            )}
                            
                            <div className="flex gap-1 flex-wrap justify-center">
                              <Button variant="outline" size="sm" title="עריכה" onClick={() => {
                                setSelectedSurvey(survey);
                                setShowEditDialog(true);
                              }} className="citadel-action-button">
                                <Edit className="h-4 w-4" />
                              </Button>
                              
                              <Button variant="outline" size="sm" title="תבנית מייל" onClick={() => {
                                setSelectedSurvey(survey);
                                setShowEmailDialog(true);
                              }} className="citadel-action-button">
                                <Mail className="h-4 w-4" />
                              </Button>
                              
                              <Button variant="outline" size="sm" title="היסטוריית שינויים" onClick={() => {
                                setSelectedSurvey(survey);
                                setShowHistoryDialog(true);
                              }} className="citadel-action-button">
                                <History className="h-4 w-4" />
                              </Button>
                              
                              <Button variant="outline" size="sm" onClick={() => archiveSurvey(survey.id)} title="העבר לארכיון" className="citadel-action-button">
                                <Archive className="h-4 w-4" />
                              </Button>
                              
                              <Button variant="outline" size="sm" onClick={() => deleteSurvey(survey.id)} title="מחק" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300">
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