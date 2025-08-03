import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, User, Upload, Image, Edit, Key, Eye, EyeOff, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import EditUserDialog from "@/components/EditUserDialog";

interface Client {
  id: string;
  name: string;
  logo_url: string | null;
  created_at: string;
}

interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  gender: string;
  created_at: string;
}

const Management = () => {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [newClientName, setNewClientName] = useState("");
  const [addingClient, setAddingClient] = useState(false);
  const [stats, setStats] = useState({
    totalSurveys: 0,
    activeSurveys: 0,
    archivedSurveys: 0,
    surveyorStats: [] as Array<{ name: string; count: number }>
  });

  // User Management State
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userLoading, setUserLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    gender: "male" as "male" | "female",
    role: "surveyor" as "admin" | "manager" | "surveyor"
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

  // User Management Functions
  const generateRandomPassword = () => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setGeneratedPassword(password);
    setFormData(prev => ({ ...prev, password }));
  };

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: "לא ניתן לטעון את רשימת המשתמשים",
        variant: "destructive",
      });
    }
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserLoading(true);

    try {
      // Create user in auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            gender: formData.gender
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Update the role in profiles table
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ role: formData.role })
          .eq("id", authData.user.id);

        if (updateError) throw updateError;
      }

      toast({
        title: "משתמש נוסף בהצלחה",
        description: `המשתמש ${formData.firstName} ${formData.lastName} נוסף למערכת`,
      });

      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        gender: "male",
        role: "surveyor"
      });

      generateRandomPassword();
      fetchProfiles();
      
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: error.message || "לא ניתן ליצור את המשתמש",
        variant: "destructive",
      });
    } finally {
      setUserLoading(false);
    }
  };

  const resetUserPassword = async (userId: string, userEmail: string, userName: string) => {
    if (!confirm(`האם אתה בטוח שברצונך לאפס את הסיסמה של המשתמש ${userName}?`)) {
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('reset-user-password', {
        body: { userId, email: userEmail }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "סיסמה אופסה בהצלחה",
          description: `הסיסמה הזמנית היא: ${data.tempPassword}`,
          duration: 10000
        });
      }
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: error.message || "לא ניתן לאפס את הסיסמה",
        variant: "destructive",
      });
    }
  };

  const deleteUser = async (userId: string, userName: string) => {
    if (!confirm(`האם אתה בטוח שברצונך למחוק את המשתמש ${userName}? פעולה זו אינה הפיכה.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (error) throw error;

      setProfiles(prev => prev.filter(profile => profile.id !== userId));

      toast({
        title: "משתמש נמחק",
        description: `המשתמש ${userName} נמחק מהמערכת`,
      });
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: "לא ניתן למחוק את המשתמש",
        variant: "destructive",
      });
    }
  };

  const openEditUser = (user: Profile) => {
    setEditingUser(user);
    setShowEditDialog(true);
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

  const uploadClientLogo = async (clientId: string, file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${clientId}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('client-logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('client-logos')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('clients')
        .update({ logo_url: publicUrl })
        .eq('id', clientId);

      if (updateError) throw updateError;

      setClients(prev => prev.map(client => 
        client.id === clientId ? { ...client, logo_url: publicUrl } : client
      ));

      toast({
        title: "לוגו הועלה בהצלחה",
        description: "הלוגו נשמר ויוצג בדף הבית",
      });
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: "לא ניתן להעלות את הלוגו",
        variant: "destructive",
      });
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
    fetchProfiles();
    generateRandomPassword();
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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

        {/* Management Tabs */}
        <Tabs defaultValue="clients" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="clients">ניהול לקוחות</TabsTrigger>
            <TabsTrigger value="users">ניהול משתמשים</TabsTrigger>
          </TabsList>

          <TabsContent value="clients" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>ניהול לקוחות</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add New Client */}
                 <form onSubmit={addClient} className="flex gap-2 items-end flex-row-reverse">
                   <div className="flex-1">
                     <Input
                       value={newClientName}
                       onChange={(e) => setNewClientName(e.target.value)}
                       placeholder="שם לקוח חדש"
                       dir="rtl"
                       required
                     />
                   </div>
                   <Button type="submit" disabled={addingClient || !newClientName.trim()} size="sm">
                     {addingClient ? "מוסיף..." : "הוסף"}
                   </Button>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && newClientName.trim()) {
                          const tempClientId = crypto.randomUUID();
                          supabase.from("clients").insert({ id: tempClientId, name: newClientName.trim() })
                            .select().single().then(({ data }) => {
                              if (data) {
                                uploadClientLogo(data.id, file);
                                setClients(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
                                setNewClientName("");
                              }
                            });
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      id="new-client-logo"
                    />
                    <Button type="button" variant="outline" size="sm" asChild>
                      <label htmlFor="new-client-logo" className="cursor-pointer">
                        <Upload className="h-3 w-3" />
                      </label>
                    </Button>
                  </div>
                </form>

                {/* Clients List */}
                <div className="max-h-96 overflow-y-auto space-y-1">
                  {clients.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">אין לקוחות במערכת</p>
                  ) : (
                    clients.map((client) => (
                      <div
                        key={client.id}
                        className="flex items-center justify-between p-3 border rounded hover:bg-muted/50 transition-colors"
                      >
                         <div className="flex items-center gap-3 flex-row-reverse">
                           <span className="font-medium">{client.name}</span>
                           {client.logo_url ? (
                             <img src={client.logo_url} alt={client.name} className="w-8 h-8 object-contain rounded" />
                           ) : (
                             <Image className="w-8 h-8 text-muted-foreground" />
                           )}
                         </div>
                         <div className="flex items-center gap-2 flex-row-reverse">
                          <div className="relative">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) uploadClientLogo(client.id, file);
                              }}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              id={`logo-${client.id}`}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                            >
                              <label htmlFor={`logo-${client.id}`} className="cursor-pointer">
                                <Upload className="h-4 w-4" />
                              </label>
                            </Button>
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
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            {/* Add User Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  הוסף משתמש חדש
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUserSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">שם פרטי *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        required
                        dir="rtl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">שם משפחה *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                        required
                        dir="rtl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">כתובת מייל *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        required
                        dir="rtl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">סיסמא ראשונית *</Label>
                      <div className="flex gap-2">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                          required
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={generateRandomPassword}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gender">מין</Label>
                      <Select value={formData.gender} onValueChange={(value: "male" | "female") => setFormData(prev => ({ ...prev, gender: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">זכר</SelectItem>
                          <SelectItem value="female">נקבה</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role">תפקיד</Label>
                      <Select value={formData.role} onValueChange={(value: "admin" | "manager" | "surveyor") => setFormData(prev => ({ ...prev, role: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">מנהל מערכת</SelectItem>
                          <SelectItem value="manager">מנהל</SelectItem>
                          <SelectItem value="surveyor">בודק</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                   <div className="flex justify-end gap-2">
                     <Button type="submit" disabled={userLoading}>
                       {userLoading ? "יוצר..." : "צור משתמש"}
                     </Button>
                   </div>
                </form>
              </CardContent>
            </Card>

            {/* Users List */}
            <Card>
              <CardHeader>
                <CardTitle>רשימת משתמשים ({profiles.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {profiles.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">אין משתמשים במערכת</p>
                ) : (
                  <div className="space-y-2">
                    {profiles.map((profile) => (
                      <div
                        key={profile.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                         <div className="flex items-center gap-4 flex-row-reverse">
                           <div className="text-right">
                             <div className="font-medium">
                               {profile.first_name} {profile.last_name}
                             </div>
                             <div className="text-sm text-muted-foreground">
                               {profile.email}
                             </div>
                             <div className="text-xs text-muted-foreground">
                               נוסף ב: {new Date(profile.created_at).toLocaleDateString("he-IL")}
                             </div>
                           </div>
                         </div>
                         
                         <div className="flex items-center gap-2 flex-row-reverse">
                          <Badge variant={profile.role === 'admin' ? 'default' : profile.role === 'manager' ? 'secondary' : 'outline'}>
                            {profile.role === 'admin' ? 'מנהל מערכת' : profile.role === 'manager' ? 'מנהל' : 'בודק'}
                          </Badge>
                          <Badge variant="outline">
                            {profile.gender === 'male' ? 'זכר' : 'נקבה'}
                          </Badge>
                          
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditUser(profile)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => resetUserPassword(profile.id, profile.email, `${profile.first_name} ${profile.last_name}`)}
                            >
                              <Key className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteUser(profile.id, `${profile.first_name} ${profile.last_name}`)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit User Dialog */}
        <EditUserDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          user={editingUser}
          onUserUpdated={fetchProfiles}
        />
      </div>
    </Layout>
  );
};

export default Management;