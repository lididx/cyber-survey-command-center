import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, User, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import UserManagementDialog from "@/components/UserManagementDialog";

interface Client {
  id: string;
  name: string;
  logo_url: string | null;
  created_at: string;
}

const Management = () => {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [newClientName, setNewClientName] = useState("");
  const [addingClient, setAddingClient] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [stats, setStats] = useState({
    totalSurveys: 0,
    activeSurveys: 0,
    archivedSurveys: 0,
    surveyorStats: [] as Array<{ name: string; count: number }>
  });

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("name");

      if (error) throw error;
      setClients(data || []);
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: "לא ניתן לטעון את רשימת הלקוחות",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Get total surveys
      const { count: totalSurveys } = await supabase
        .from("surveys")
        .select("*", { count: "exact", head: true });

      // Get active surveys
      const { count: activeSurveys } = await supabase
        .from("surveys")
        .select("*", { count: "exact", head: true })
        .eq("is_archived", false);

      // Get archived surveys
      const { count: archivedSurveys } = await supabase
        .from("surveys")
        .select("*", { count: "exact", head: true })
        .eq("is_archived", true);

      // Get surveyor stats
      const { data: surveyorData } = await supabase
        .from("surveys")
        .select(`
          user_id,
          profiles!inner(first_name, last_name, role)
        `)
        .eq("profiles.role", "surveyor");

      const surveyorStats = surveyorData?.reduce((acc: any[], survey: any) => {
        const name = `${survey.profiles.first_name} ${survey.profiles.last_name}`;
        const existing = acc.find(s => s.name === name);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ name, count: 1 });
        }
        return acc;
      }, []) || [];

      setStats({
        totalSurveys: totalSurveys || 0,
        activeSurveys: activeSurveys || 0,
        archivedSurveys: archivedSurveys || 0,
        surveyorStats: surveyorStats.sort((a, b) => b.count - a.count)
      });
    } catch (error: any) {
      console.error("Error fetching stats:", error);
    }
  };

  const addClient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newClientName.trim()) return;
    
    setAddingClient(true);

    try {
      const { data, error } = await supabase
        .from("clients")
        .insert({ name: newClientName.trim() })
        .select()
        .single();

      if (error) throw error;

      setClients(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewClientName("");

      toast({
        title: "לקוח נוסף בהצלחה",
        description: `הלקוח "${newClientName}" נוסף למערכת`,
      });
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: error.message || "לא ניתן להוסיף את הלקוח",
        variant: "destructive",
      });
    } finally {
      setAddingClient(false);
    }
  };

  const deleteClient = async (clientId: string, clientName: string) => {
    if (!confirm(`האם אתה בטוח שברצונך למחוק את הלקוח "${clientName}"? פעולה זו תמחק גם את כל הסקרים הקשורים אליו.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", clientId);

      if (error) throw error;

      setClients(prev => prev.filter(client => client.id !== clientId));

      toast({
        title: "לקוח נמחק",
        description: `הלקוח "${clientName}" נמחק מהמערכת`,
      });
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: "לא ניתן למחוק את הלקוח",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchClients();
    fetchStats();
  }, []);

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
          <h1 className="text-3xl font-bold text-foreground">ניהול מערכת</h1>
        </div>

        {/* Statistics Card - at the top */}
        <Card>
          <CardHeader>
            <CardTitle>סטטיסטיקות מערכת</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-primary">{clients.length}</div>
                <div className="text-sm text-muted-foreground">לקוחות במערכת</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.activeSurveys}</div>
                <div className="text-sm text-muted-foreground">סקרים פעילים</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{stats.archivedSurveys}</div>
                <div className="text-sm text-muted-foreground">סקרים בארכיון</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.totalSurveys}</div>
                <div className="text-sm text-muted-foreground">סה"כ סקרים</div>
              </div>
            </div>

            {/* Surveyor Stats */}
            {stats.surveyorStats.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">סקרים לפי בודק:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {stats.surveyorStats.map((surveyor, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <span className="font-medium">{surveyor.name}</span>
                      <span className="text-sm bg-primary text-primary-foreground px-2 py-1 rounded">
                        {surveyor.count} סקרים
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Client Management - Compact */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>ניהול לקוחות</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add New Client */}
              <form onSubmit={addClient} className="flex gap-2">
                <Input
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="שם לקוח חדש"
                  dir="rtl"
                  required
                  className="flex-1"
                />
                <Button type="submit" disabled={addingClient || !newClientName.trim()} size="sm">
                  {addingClient ? "מוסיף..." : "הוסף"}
                </Button>
              </form>

              {/* Clients List */}
              <div className="max-h-40 overflow-y-auto space-y-1">
                {clients.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4 text-sm">אין לקוחות במערכת</p>
                ) : (
                  clients.map((client) => (
                    <div
                      key={client.id}
                      className="flex items-center justify-between p-2 border rounded hover:bg-muted/50 transition-colors text-sm"
                    >
                      <span className="font-medium">{client.name}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteClient(client.id, client.name)}
                        className="text-destructive hover:text-destructive h-6 w-6 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* User Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                ניהול משתמשים
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => setShowUserManagement(true)}
                className="w-full"
              >
                <User className="h-4 w-4 mr-2" />
                פתח ניהול משתמשים
              </Button>
            </CardContent>
          </Card>
        </div>

        
        {showUserManagement && (
          <UserManagementDialog
            open={showUserManagement}
            onOpenChange={setShowUserManagement}
          />
        )}
      </div>
    </Layout>
  );
};

export default Management;