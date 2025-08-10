import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    gender: "male" as "male" | "female"
  });
  
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [connection, setConnection] = useState<'unknown' | 'online' | 'offline'>('unknown');
  const [checkingConnection, setCheckingConnection] = useState(false);

  const checkConnection = async () => {
    setCheckingConnection(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true });

      if (error && (error.name === 'TypeError' || String(error.message).includes('Failed to fetch'))) {
        setConnection('offline');
      } else {
        setConnection('online');
      }
    } catch (err: any) {
      setConnection('offline');
    } finally {
      setCheckingConnection(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        toast({
          title: "התחברת בהצלחה!",
          description: "ברוך הבא למערכת ניהול הסקרים",
        });

        const from = location.state?.from?.pathname || "/";
        navigate(from, { replace: true });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              first_name: formData.firstName,
              last_name: formData.lastName,
              gender: formData.gender
            }
          }
        });

        if (error) throw error;

        toast({
          title: "נרשמת בהצלחה!",
          description: "אנא בדוק את המייל שלך לאישור החשבון",
        });
      }
    } catch (error: any) {
      const msg =
        ((error?.message && String(error.message).includes("Failed to fetch")) || error?.name === "TypeError")
          ? "שגיאת רשת: לא ניתן להתחבר לשרת. נסו לרענן את הדף או לבדוק את החיבור לאינטרנט."
          : error?.status === 406
          ? "שגיאה 406: אין נתונים זמינים או הרשאות. נסו להתחבר מחדש."
          : error?.status === 400
          ? "מייל או סיסמה שגויים. אנא נסו שוב."
          : error?.message || "אירעה שגיאה לא צפויה.";

      toast({
        title: "שגיאה",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = [
    { value: "received", label: "התקבל" },
    { value: "email_sent_to_admin", label: "נשלח מייל תיאום למנהל המערכת" },
    { value: "meeting_scheduled", label: "פגישה נקבעה" },
    { value: "in_writing", label: "בכתיבה" },
    { value: "completion_questions_with_admin", label: "שאלות השלמה מול מנהל מערכת" },
    { value: "chen_review", label: "בבקרה של חן" },
    { value: "completed", label: "הסתיים" }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">
            מערכת לניהול סקרים
          </CardTitle>
          <CardDescription>
            {isLogin ? "התחבר לחשבון שלך" : "צור חשבון חדש"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">שם פרטי</Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                      dir="rtl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">שם משפחה</Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                      dir="rtl"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">מין</Label>
                  <Select value={formData.gender} onValueChange={(value: "male" | "female") => setFormData({ ...formData, gender: value })}>
                    <SelectTrigger dir="rtl">
                      <SelectValue placeholder="בחר מין" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">זכר</SelectItem>
                      <SelectItem value="female">נקבה</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">כתובת מייל</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                dir="rtl"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">סיסמה</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "מעבד..." : isLogin ? "התחבר" : "הירשם"}
            </Button>

            <div className="mt-2 text-xs text-muted-foreground flex items-center justify-between">
              <span>
                סטטוס חיבור: {connection === 'unknown' ? 'לא נבדק' : connection === 'online' ? 'מחובר' : 'לא זמין'}
              </span>
              <Button type="button" variant="outline" size="sm" onClick={checkConnection} disabled={checkingConnection}>
                {checkingConnection ? 'בודק...' : 'בדיקת חיבור'}
              </Button>
            </div>
          </form>

        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;