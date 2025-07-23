import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, User, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createAdminUser } from "@/utils/createAdminUser";

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
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground">ניהול מערכת</h1>
        </div>

        {/* Add New Client */}
        <Card>
          <CardHeader>
            <CardTitle>הוסף לקוח חדש</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={addClient} className="flex gap-4 items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="clientName">שם הלקוח</Label>
                <Input
                  id="clientName"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="הזן שם לקוח חדש"
                  dir="rtl"
                  required
                />
              </div>
              <Button type="submit" disabled={addingClient || !newClientName.trim()}>
                {addingClient ? "מוסיף..." : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    הוסף
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Clients List */}
        <Card>
          <CardHeader>
            <CardTitle>רשימת לקוחות ({clients.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {clients.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">אין לקוחות במערכת</p>
            ) : (
              <div className="space-y-2">
                {clients.map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-4 rtl:space-x-reverse">
                      <div className="font-medium">{client.name}</div>
                      <div className="text-sm text-muted-foreground">
                        נוסף ב: {new Date(client.created_at).toLocaleDateString("he-IL")}
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteClient(client.id, client.name)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Setup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              הגדרות מערכת
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button
                variant="outline"
                onClick={async () => {
                  const result = await createAdminUser();
                  toast({
                    title: result.success ? "הצלחה" : "שגיאה",
                    description: result.message,
                    variant: result.success ? "default" : "destructive",
                  });
                }}
                className="w-full justify-start"
              >
                <User className="h-4 w-4 mr-2" />
                צור משתמש אדמין בסיסי
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Card */}
        <Card>
          <CardHeader>
            <CardTitle>סטטיסטיקות מערכת</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-primary">{clients.length}</div>
                <div className="text-sm text-muted-foreground">לקוחות במערכת</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">0</div>
                <div className="text-sm text-muted-foreground">סקרים פעילים</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-orange-600">0</div>
                <div className="text-sm text-muted-foreground">סקרים בארכיון</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Management;