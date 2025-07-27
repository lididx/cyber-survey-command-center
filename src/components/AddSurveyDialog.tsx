import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Client {
  id: string;
  name: string;
}

interface Contact {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
}

interface AddSurveyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AddSurveyDialog = ({ open, onOpenChange, onSuccess }: AddSurveyDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    systemName: "",
    clientId: "",
    systemDescription: "",
    surveyDate: "",
    receivedDate: "",
    status: "received" as const
  });
  const [contacts, setContacts] = useState<Contact[]>([
    { firstName: "", lastName: "", email: "", phone: "", role: "" }
  ]);

  const statusOptions = [
    { value: "received", label: "התקבל" },
    { value: "email_sent_to_admin", label: "נשלח מייל תיאום למנהל המערכת" },
    { value: "meeting_scheduled", label: "פגישה נקבעה" },
    { value: "in_writing", label: "בכתיבה" },
    { value: "completion_questions_with_admin", label: "שאלות השלמה מול מנהל מערכת" },
    { value: "chen_review", label: "בבקרה של חן" },
    { value: "completed", label: "הסתיים" }
  ];

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
    
    if (!user) return;
    
    setLoading(true);

    try {
      // Create survey
      const { data: surveyData, error: surveyError } = await supabase
        .from("surveys")
        .insert({
          user_id: user.id,
          client_id: formData.clientId,
          system_name: formData.systemName,
          system_description: formData.systemDescription,
          survey_date: formData.surveyDate,
          received_date: formData.receivedDate,
          status: formData.status
        })
        .select()
        .single();

      if (surveyError) throw surveyError;

      // Create contacts - only if they have at least first name
      const validContacts = contacts.filter(contact => 
        contact.firstName.trim() || contact.lastName.trim() || contact.email.trim() || contact.phone.trim()
      );

      if (validContacts.length > 0) {
        const contactsData = validContacts.map(contact => ({
          survey_id: surveyData.id,
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

      toast({
        title: "סקר נוסף בהצלחה",
        description: "הסקר נוסף למערכת בהצלחה",
      });

      // Reset form
      setFormData({
        systemName: "",
        clientId: "",
        systemDescription: "",
        surveyDate: "",
        receivedDate: "",
        status: "received"
      });
      setContacts([{ firstName: "", lastName: "", email: "", phone: "", role: "" }]);
      
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: error.message || "לא ניתן להוסיף את הסקר",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchClients();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>הוסף סקר חדש</DialogTitle>
          <DialogDescription>
            מלא את פרטי הסקר ואנשי הקשר
          </DialogDescription>
        </DialogHeader>

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
                onValueChange={(value: typeof formData.status) => setFormData({ ...formData, status: value })}
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

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "מוסיף..." : "הוסף סקר"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddSurveyDialog;