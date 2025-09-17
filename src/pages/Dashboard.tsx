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
  last_email_bounce_date: string | null;
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
  profiles: {
    first_name: string;
    last_name: string;
  } | null;
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
    returned_from_review: "חזר מבקרה - השלמה",
    completed: "הסתיים"
  };

  const statusColors: Record<string, string> = {
    received: "#4FC3F7",
    email_sent_to_admin: "#7E57C2",
    meeting_scheduled: "#81C784",
    in_writing: "#FFB74D",
    completion_questions_with_admin: "#FB8C00",
    chen_review: "#8E24AA",
    returned_from_review: "#D2691E",
    completed: "#388E3C"
  };
  const statusOptions = Object.entries(statusLabels).map(([value, label]) => ({
    value,
    label
  }));
  const fetchSurveys = async () => {
    try {
      setLoading(true);
      
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
      
      // Get unique user IDs
      const userIds = [...new Set((data || []).map((survey: any) => survey.user_id))];
      
      // Fetch all profiles at once
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", userIds);
      
      // Create a map for quick lookup
      const profilesMap = new Map(
        (profilesData || []).map(profile => [profile.id, profile])
      );
      
      // Map surveys with their profiles
      const surveysWithProfiles = (data || []).map((survey: any) => ({
        ...survey,
        profiles: profilesMap.get(survey.user_id) || null
      }));
      
      setSurveys(surveysWithProfiles);
    } catch (error: any) {
      console.error("Error fetching surveys:", error);
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
      const { error } = await supabase
        .from("surveys")
        .update({
          status: newStatus as any
        })
        .eq("id", surveyId);
      
      if (error) throw error;
      
      // Update local state immediately
      setSurveys(prev => prev.map(survey => 
        survey.id === surveyId 
          ? { ...survey, status: newStatus }
          : survey
      ));
      
      toast({
        title: "הסטטוס עודכן בהצלחה",
        description: `הסטטוס עודכן ל: ${statusLabels[newStatus as keyof typeof statusLabels]}`
      });
    } catch (error: any) {
      console.error("Status update error:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לעדכן את הסטטוס",
        variant: "destructive"
      });
    }
  };

  const updateEmailBounceDate = async (surveyId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const currentSurvey = surveys.find(s => s.id === surveyId);
      const oldValue = currentSurvey?.last_email_bounce_date || null;
      
      const { error } = await supabase
        .from("surveys")
        .update({ last_email_bounce_date: today })
        .eq("id", surveyId);
      
      if (error) throw error;
      
      // Add to history
      await supabase.from("survey_history").insert({
        survey_id: surveyId,
        user_id: user?.id,
        field_name: "last_email_bounce_date",
        old_value: oldValue || "null",
        new_value: today
      });
      
      // Update local state immediately
      setSurveys(prev => prev.map(survey => 
        survey.id === surveyId 
          ? { ...survey, last_email_bounce_date: today }
          : survey
      ));
      
      toast({
        title: "תאריך הקפצה עודכן",
        description: "תאריך הקפצת המייל האחרון עודכן להיום"
      });
    } catch (error: any) {
      console.error("Email bounce date update error:", error);
      toast({
        title: "שגיאה", 
        description: "לא ניתן לעדכן תאריך הקפצה",
        variant: "destructive"
      });
    }
  };
  const archiveSurvey = async (surveyId: string) => {
    try {
      const { error } = await supabase
        .from("surveys")
        .update({
          is_archived: true
        })
        .eq("id", surveyId);
      
      if (error) throw error;
      
      // Update local state immediately
      setSurveys(prev => prev.filter(survey => survey.id !== surveyId));
      
      toast({
        title: "הסקר הועבר לארכיון",
        description: "הסקר הועבר בהצלחה לארכיון"
      });
    } catch (error: any) {
      console.error("Archive error:", error);
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
      // First delete related contacts
      const { error: contactsError } = await supabase
        .from("contacts")
        .delete()
        .eq("survey_id", surveyId);

      if (contactsError) {
        console.error("Error deleting contacts:", contactsError);
        // Continue anyway as contacts might not exist
      }

      // Then delete the survey
      const { error: surveyError } = await supabase
        .from("surveys")
        .delete()
        .eq("id", surveyId);

      if (surveyError) throw surveyError;
      
      // Update local state immediately
      setSurveys(prev => prev.filter(survey => survey.id !== surveyId));
      
      toast({
        title: "הסקר נמחק",
        description: "הסקר נמחק בהצלחה מהמערכת"
      });
    } catch (error: any) {
      console.error("Delete error:", error);
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

  // Only refetch surveys on specific events, not on every focus/visibility change
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'surveyUpdated' && profile) {
        fetchSurveys();
        localStorage.removeItem('surveyUpdated');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
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
         <div className="flex justify-between items-center flex-row-reverse">
           <h1 className="text-3xl font-bold text-foreground">דשבורד סקרים</h1>
           <Button onClick={() => setShowAddDialog(true)} className="flex items-center gap-2">
             <Plus className="h-4 w-4" />
             הוסף סקר חדש
           </Button>
         </div>

        {Object.keys(groupedSurveys).length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground text-lg mb-4">אין סקרים פתוחים כרגע</p>
              <Button onClick={() => setShowAddDialog(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                הוסף סקר ראשון
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedSurveys).map(([clientName, clientSurveys]) => (
              <Card key={clientName}>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => toggleClientExpansion(clientName)}>
                   <CardTitle className="flex items-center justify-between flex-row-reverse">
                     <Badge variant="secondary">
                       {clientSurveys.length} סקר{clientSurveys.length > 1 ? "ים" : ""}
                     </Badge>
                     <div className="flex items-center gap-3 flex-row-reverse">
                       
                       {/* תצוגת לוגו או שם לקוח */}
                        {clientSurveys[0]?.clients?.logo_url ? (
                          <div className="flex items-center gap-3 flex-row-reverse">
                            <span className="text-sm text-muted-foreground">{clientName}</span>
                            <img 
                              src={clientSurveys[0].clients.logo_url} 
                              alt={clientName} 
                              className="w-12 h-12 object-contain rounded"
                            />
                          </div>
                        ) : (
                          <span>{clientName}</span>
                        )}
                       
                       {expandedClients.has(clientName) ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                     </div>
                   </CardTitle>
                </CardHeader>
                
                {expandedClients.has(clientName) && (
                <CardContent className="space-y-4">
                    {/* בדיקה אם יש סקרים עם סטטוס שאלות השלמה */}
                    {(() => {
                      const hasCompletionQuestions = clientSurveys.some(survey => survey.status === 'completion_questions_with_admin');
                      const gridCols = hasCompletionQuestions 
                        ? (profile && ['admin', 'manager'].includes(profile.role) ? 'md:grid-cols-7' : 'md:grid-cols-6')
                        : (profile && ['admin', 'manager'].includes(profile.role) ? 'md:grid-cols-6' : 'md:grid-cols-5');
                      
                      return (
                        <>
                          {/* כותרות טבלה */}
                          <div className={`grid grid-cols-1 gap-4 p-3 bg-muted/50 rounded-lg font-semibold text-sm ${gridCols}`}>
                            <div className="text-center">שם המערכת</div>
                            <div className="text-center">סטטוס</div>
                            {hasCompletionQuestions && (
                              <div className="text-center">תאריך הקפצת מייל אחרון</div>
                            )}
                            <div className="text-center">אנשי קשר</div>
                            <div className="text-center">תאריך ביצוע הסקר</div>
                             {profile && ['admin', 'manager'].includes(profile.role) && (
                               <div className="text-center">משתמש יוצר</div>
                             )}
                            <div className="text-center">פעולות</div>
                          </div>
                        </>
                      );
                    })()}
                    
                    {clientSurveys.map(survey => {
                      const primaryContact = survey.contacts[0];
                      const contactNames = survey.contacts.map(c => `${c.first_name} ${c.last_name}`);
                      const hasCompletionQuestions = clientSurveys.some(s => s.status === 'completion_questions_with_admin');
                      const gridCols = hasCompletionQuestions 
                        ? (profile && ['admin', 'manager'].includes(profile.role) ? 'md:grid-cols-7' : 'md:grid-cols-6')
                        : (profile && ['admin', 'manager'].includes(profile.role) ? 'md:grid-cols-6' : 'md:grid-cols-5');
                      
                      return (
                        <div key={survey.id} className="border rounded-lg p-4 my-2">
                          <div className={`grid grid-cols-1 gap-4 items-center min-h-[60px] ${gridCols}`}>
                            {/* שם המערכת */}
                            <div className="font-medium text-center">{survey.system_name}</div>
                            
                            {/* סטטוס */}
                            <div>
                              <Select value={survey.status} onValueChange={value => updateSurveyStatus(survey.id, value)}>
                                <SelectTrigger 
                                  style={{ 
                                    backgroundColor: statusColors[survey.status], 
                                    color: 'white',
                                    borderColor: statusColors[survey.status]
                                  }}
                                  className="text-white border-0"
                                  dir="rtl"
                                >
                                  <SelectValue>
                                    {statusLabels[survey.status]}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent dir="rtl">
                                  {statusOptions.map(option => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            {/* תאריך הקפצת מייל אחרון - רק אם יש סקרים עם סטטוס שאלות השלמה */}
                            {hasCompletionQuestions && (
                              <div className="text-sm text-center">
                                {survey.status === 'completion_questions_with_admin' ? (
                                  <div className="space-y-1">
                                    <div>
                                      {survey.last_email_bounce_date 
                                        ? new Date(survey.last_email_bounce_date).toLocaleDateString("he-IL")
                                        : "לא בוצעה הקפצה"
                                      }
                                    </div>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      onClick={() => updateEmailBounceDate(survey.id)}
                                      title="עדכן להיום"
                                      className="text-xs px-2 py-1"
                                    >
                                      עדכן
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="text-muted-foreground">-</div>
                                )}
                              </div>
                            )}
                            
                            {/* אנשי קשר */}
                            <div className="text-sm text-center space-y-2">
                              <div>
                                {primaryContact ? `${primaryContact.first_name} ${primaryContact.last_name}` : "אין איש קשר"}
                              </div>
                              <div className="flex gap-1 justify-center">
                                {primaryContact?.phone && (
                                  <Button variant="outline" size="sm" onClick={() => window.open(`https://wa.me/972${primaryContact.phone.replace(/\D/g, '').slice(1)}`, '_blank')} title="פתח ב-WhatsApp">
                                    <MessageSquare className="h-3 w-3" />
                                  </Button>
                                )}
                                
                                {primaryContact?.email && (
                                  <Button variant="outline" size="sm" onClick={() => window.open(`mailto:${primaryContact.email}`, '_blank')} title="שלח מייל">
                                    <Mail className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                            
                            {/* תאריך ביצוע הסקר */}
                            <div className="text-sm text-center">
                              {new Date(survey.survey_date).toLocaleDateString("he-IL")}
                            </div>
                            
                             {/* משתמש יוצר - רק למנהלים ומנהלות */}
                             {profile && ['admin', 'manager'].includes(profile.role) && (
                               <div className="text-sm text-center">
                                 {survey.profiles 
                                   ? `${survey.profiles.first_name || ''} ${survey.profiles.last_name || ''}`.trim() || 'לא זמין'
                                   : 'לא זמין'
                                 }
                               </div>
                             )}
                            
                            {/* פעולות */}
                            <div className="flex gap-1 flex-wrap justify-center">
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