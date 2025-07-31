import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Survey {
  id: string;
  system_name: string;
  system_description: string;
  survey_date: string;
  received_date: string;
  last_email_bounce_date: string | null;
  status: string;
  client_id: string;
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

interface Contact {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
}

interface Client {
  id: string;
  name: string;
}

interface EditSurveyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  survey: Survey | null;
  onSuccess: () => void;
}

const statusOptions = [
  { value: "received", label: "התקבל" },
  { value: "email_sent_to_admin", label: "נשלח מייל תיאום למנהל המערכת" },
  { value: "meeting_scheduled", label: "פגישה נקבעה" },
  { value: "in_writing", label: "בכתיבה" },
  { value: "completion_questions_with_admin", label: "שאלות השלמה מול מנהל מערכת" },
  { value: "chen_review", label: "בבקרה של חן" },
  { value: "completed", label: "הסתיים" }
];

const EditSurveyDialog = ({ open, onOpenChange, survey, onSuccess }: EditSurveyDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  const [formData, setFormData] = useState({
    systemName: "",
    clientId: "",
    systemDescription: "",
    surveyDate: "",
    receivedDate: "",
    lastEmailBounceDate: "",
    status: "received" as string
  });
  
  const [contacts, setContacts] = useState<Contact[]>([
    { firstName: "", lastName: "", email: "", phone: "", role: "" }
  ]);
  
  const [comments, setComments] = useState("");

  // טעינת לקוחות
  const fetchClients = async () => {
    try {
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
    }
  };

  // טעינת נתוני הסקר לטופס
  useEffect(() => {
    console.log("EditSurveyDialog - Survey changed:", survey);
    
    if (survey && open) {
      console.log("EditSurveyDialog - Loading survey data into form");
      
      // עדכון נתוני הטופס
      setFormData({
        systemName: survey.system_name || "",
        systemDescription: survey.system_description || "",
        surveyDate: survey.survey_date || "",
        receivedDate: survey.received_date || "",
        lastEmailBounceDate: survey.last_email_bounce_date || "",
        status: survey.status || "received",
        clientId: survey.client_id || ""
      });
      
      // עדכון אנשי קשר
      const existingContacts = survey.contacts?.map(contact => ({
        firstName: contact.first_name || "",
        lastName: contact.last_name || "",
        email: contact.email || "",
        phone: contact.phone || "",
        role: contact.role || ""
      })) || [];
      
      // אם אין אנשי קשר, הוסף איש קשר ריק אחד
      setContacts(existingContacts.length > 0 ? existingContacts : [
        { firstName: "", lastName: "", email: "", phone: "", role: "" }
      ]);
      
      console.log("EditSurveyDialog - Data loaded successfully");
      setDataLoaded(true);
    } else if (!open) {
      // איפוס הטופס כשהדיאלוג נסגר
      setDataLoaded(false);
      setFormData({
        systemName: "",
        clientId: "",
        systemDescription: "",
        surveyDate: "",
        receivedDate: "",
        lastEmailBounceDate: "",
        status: "received"
      });
      setContacts([{ firstName: "", lastName: "", email: "", phone: "", role: "" }]);
      setComments("");
    }
  }, [survey, open]);

  // טעינת לקוחות כשהדיאלוג נפתח
  useEffect(() => {
    if (open) {
      fetchClients();
    }
  }, [open]);

  const addContact = () => {
    setContacts([...contacts, { firstName: "", lastName: "", email: "", phone: "", role: "" }]);
  };

  const removeContact = (index: number) => {
    if (contacts.length > 1) {
      setContacts(contacts.filter((_, i) => i !== index));
    }
  };

  const updateContact = (index: number, field: keyof Contact, value: string) => {
    const updatedContacts = [...contacts];
    updatedContacts[index][field] = value;
    setContacts(updatedContacts);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !survey) return;
    
    setLoading(true);

    try {
      // עדכון פרטי הסקר
      const { error: surveyError } = await supabase
        .from("surveys")
        .update({
          system_name: formData.systemName,
          system_description: formData.systemDescription,
          survey_date: formData.surveyDate || null,
          received_date: formData.receivedDate || null,
          last_email_bounce_date: formData.lastEmailBounceDate || null,
          status: formData.status as any,
          client_id: formData.clientId
        })
        .eq("id", survey.id);

      if (surveyError) throw surveyError;

      // מחיקת אנשי קשר קיימים
      const { error: deleteError } = await supabase
        .from("contacts")
        .delete()
        .eq("survey_id", survey.id);

      if (deleteError) throw deleteError;

      // הוספת אנשי קשר חדשים (רק אם יש תוכן)
      const validContacts = contacts.filter(contact => 
        contact.firstName.trim() || contact.lastName.trim() || contact.email.trim() || contact.phone.trim()
      );

      if (validContacts.length > 0) {
        const contactsData = validContacts.map(contact => ({
          survey_id: survey.id,
          first_name: contact.firstName,
          last_name: contact.lastName,
          email: contact.email,
          phone: contact.phone,
          role: contact.role
        }));

        const { error: contactsError } = await supabase
          .from("contacts")
          .insert(contactsData);

        if (contactsError) throw contactsError;
      }

      // הוספת הערות ל-audit log אם קיימות
      if (comments.trim()) {
        const { error: auditError } = await supabase
          .from("audit_logs")
          .insert({
            user_id: user.id,
            table_name: "surveys",
            record_id: survey.id,
            action: "comment",
            new_values: { comments: comments.trim() }
          });

        if (auditError) throw auditError;
      }

      toast({
        title: "הסקר עודכן בהצלחה",
        description: "פרטי הסקר נשמרו בהצלחה במערכת",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: error.message || "לא ניתן לעדכן את הסקר",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!survey) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">עריכת סקר</DialogTitle>
          <DialogDescription className="text-right">
            ערוך את פרטי הסקר ואנשי הקשר
          </DialogDescription>
        </DialogHeader>

        {!dataLoaded ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="mr-2">טוען נתונים...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="systemName">שם המערכת *</Label>
                <Input
                  id="systemName"
                  value={formData.systemName}
                  onChange={(e) => setFormData({ ...formData, systemName: e.target.value })}
                  required
                  dir="rtl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientId">לקוח *</Label>
                <Select 
                  value={formData.clientId} 
                  onValueChange={(value) => setFormData({ ...formData, clientId: value })}
                  required
                >
                  <SelectTrigger dir="rtl">
                    <SelectValue placeholder="בחר לקוח" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="surveyDate">תאריך קביעת הסקר</Label>
                <Input
                  id="surveyDate"
                  type="date"
                  value={formData.surveyDate}
                  onChange={(e) => setFormData({ ...formData, surveyDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="receivedDate">תאריך קבלת הסקר</Label>
                <Input
                  id="receivedDate"
                  type="date"
                  value={formData.receivedDate}
                  onChange={(e) => setFormData({ ...formData, receivedDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">סטטוס</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: string) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger dir="rtl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.status === 'completion_questions_with_admin' && (
                <div className="space-y-2">
                  <Label htmlFor="lastEmailBounceDate">תאריך הקפצת מייל אחרון</Label>
                  <Input
                    id="lastEmailBounceDate"
                    type="date"
                    value={formData.lastEmailBounceDate}
                    onChange={(e) => setFormData({ ...formData, lastEmailBounceDate: e.target.value })}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="systemDescription">תיאור המערכת</Label>
              <Textarea
                id="systemDescription"
                value={formData.systemDescription}
                onChange={(e) => setFormData({ ...formData, systemDescription: e.target.value })}
                rows={3}
                dir="rtl"
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  אנשי קשר
                  <Button type="button" variant="outline" size="sm" onClick={addContact}>
                    <Plus className="h-4 w-4 mr-2" />
                    הוסף איש קשר
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {contacts.map((contact, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">איש קשר {index + 1}</h4>
                      {contacts.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeContact(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>שם פרטי</Label>
                        <Input
                          value={contact.firstName}
                          onChange={(e) => updateContact(index, "firstName", e.target.value)}
                          dir="rtl"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>שם משפחה</Label>
                        <Input
                          value={contact.lastName}
                          onChange={(e) => updateContact(index, "lastName", e.target.value)}
                          dir="rtl"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>כתובת מייל</Label>
                        <Input
                          type="email"
                          value={contact.email}
                          onChange={(e) => updateContact(index, "email", e.target.value)}
                          dir="rtl"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>מספר טלפון</Label>
                        <Input
                          value={contact.phone}
                          onChange={(e) => updateContact(index, "phone", e.target.value)}
                          dir="rtl"
                        />
                      </div>
                      
                      <div className="space-y-2 md:col-span-2">
                        <Label>תפקיד</Label>
                        <Input
                          value={contact.role}
                          onChange={(e) => updateContact(index, "role", e.target.value)}
                          dir="rtl"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Label htmlFor="comments">הערות (יישמרו ב-Audit Log)</Label>
              <Textarea
                id="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
                dir="rtl"
                placeholder="הוסף הערות קריטיות או תיעוד למצב הנוכחי של הסקר..."
              />
            </div>

            <div className="flex justify-start gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    שומר...
                  </>
                ) : (
                  "שמור שינויים"
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                ביטול
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditSurveyDialog;