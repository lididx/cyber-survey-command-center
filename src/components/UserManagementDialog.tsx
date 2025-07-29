import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Eye, EyeOff, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  gender: string;
  created_at: string;
}

interface UserManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UserManagementDialog = ({ open, onOpenChange }: UserManagementDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");

  const generateRandomPassword = () => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setGeneratedPassword(password);
    setFormData(prev => ({ ...prev, password }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "הועתק ללוח",
      description: "הסיסמא הועתקה ללוח בהצלחה",
    });
  };
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    gender: "male" as "male" | "female",
    role: "surveyor" as "admin" | "manager" | "surveyor"
  });


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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

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

      // Generate new password for next user
      generateRandomPassword();
      
      fetchProfiles();
      
      // Don't close dialog, stay in management page
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: error.message || "לא ניתן ליצור את המשתמש",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchProfiles();
      generateRandomPassword(); // Generate initial password
    }
  }, [open]);

  const roleLabels = {
    admin: "מנהל מערכת",
    manager: "מנהל",
    surveyor: "בודק"
  };

  const genderLabels = {
    male: "זכר",
    female: "נקבה"
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">ניהול משתמשים</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add User Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                הוסף משתמש חדש
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
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

                <div className="flex justify-start gap-2">
                  <Button type="submit" disabled={loading}>
                    {loading ? "יוצר..." : "צור משתמש"}
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
                      <div className="flex items-center gap-4">
                        <div>
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
                      
                      <div className="flex items-center gap-2">
                        <Badge variant={profile.role === 'admin' ? 'default' : profile.role === 'manager' ? 'secondary' : 'outline'}>
                          {roleLabels[profile.role as keyof typeof roleLabels]}
                        </Badge>
                        <Badge variant="outline">
                          {genderLabels[profile.gender as keyof typeof genderLabels]}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserManagementDialog;