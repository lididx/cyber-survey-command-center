import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ContactDisplaySection from "./ContactDisplaySection";

interface Survey {
  id: string;
  system_name: string;
  system_description: string;
  survey_date: string;
  received_date: string;
  last_email_bounce_date: string | null;
  status: string;
  client_id: string;
  contacts?: Array<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    role: string;
  }>;
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
  const [formData, setFormData] = useState({
    system_name: "",
    system_description: "",
    survey_date: "",
    received_date: "",
    last_email_bounce_date: "",
    status: "received",
    client_id: ""
  });
  const [clients, setClients] = useState<Client[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (survey) {
      setFormData({
        system_name: survey.system_name,
        system_description: survey.system_description || "",
        survey_date: survey.survey_date,
        received_date: survey.received_date || "",
        last_email_bounce_date: survey.last_email_bounce_date || "",
        status: survey.status,
        client_id: survey.client_id
      });
      setContacts(survey.contacts || []);
    }
  }, [survey]);

  useEffect(() => {
    const fetchClients = async () => {
      const { data } = await supabase
        .from("clients")
        .select("id, name")
        .order("name");
      
      if (data) setClients(data);
    };

    if (open) {
      fetchClients();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!survey) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("surveys")
        .update({
          system_name: formData.system_name,
          system_description: formData.system_description,
          survey_date: formData.survey_date,
          received_date: formData.received_date || null,
          last_email_bounce_date: formData.last_email_bounce_date || null,
          status: formData.status as any,
          client_id: formData.client_id
        })
        .eq("id", survey.id);

      if (error) throw error;

      toast({
        title: "הסקר עודכן בהצלחה",
        description: "פרטי הסקר נשמרו בהצלחה במערכת",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: "לא ניתן לעדכן את הסקר",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!survey) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">עריכת סקר</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client_id">לקוח</Label>
            <Select value={formData.client_id} onValueChange={(value) => setFormData(prev => ({ ...prev, client_id: value }))}>
              <SelectTrigger>
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
            <Label htmlFor="system_name">שם המערכת</Label>
            <Input
              id="system_name"
              value={formData.system_name}
              onChange={(e) => setFormData(prev => ({ ...prev, system_name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="system_description">תיאור המערכת</Label>
            <Textarea
              id="system_description"
              value={formData.system_description}
              onChange={(e) => setFormData(prev => ({ ...prev, system_description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="survey_date">תאריך ביצוע הסקר</Label>
            <Input
              id="survey_date"
              type="date"
              value={formData.survey_date}
              onChange={(e) => setFormData(prev => ({ ...prev, survey_date: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="received_date">תאריך קבלת הסקר</Label>
            <Input
              id="received_date"
              type="date"
              value={formData.received_date}
              onChange={(e) => setFormData(prev => ({ ...prev, received_date: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">סטטוס</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
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

          {/* שדה תאריך הקפצת מייל - רק עבור סטטוס שאלות השלמה */}
          {formData.status === 'completion_questions_with_admin' && (
            <div className="space-y-2">
              <Label htmlFor="last_email_bounce_date">תאריך הקפצת מייל אחרון</Label>
              <Input
                id="last_email_bounce_date"
                type="date"
                value={formData.last_email_bounce_date}
                onChange={(e) => setFormData(prev => ({ ...prev, last_email_bounce_date: e.target.value }))}
              />
            </div>
          )}

          {/* Contact Display Section */}
          {contacts.length > 0 && (
            <ContactDisplaySection contacts={contacts} />
          )}

          <div className="flex gap-2 justify-end">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              ביטול
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "שומר..." : "שמור שינויים"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditSurveyDialog;