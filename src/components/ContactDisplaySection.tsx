import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
}

interface ContactDisplaySectionProps {
  contacts: Contact[];
  title?: string;
}

const ContactDisplaySection = ({ contacts, title = "אנשי קשר" }: ContactDisplaySectionProps) => {
  return (
    <Card className="bg-muted/30 border-muted">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {contacts.length === 0 ? (
          <p className="text-sm text-muted-foreground">אין אנשי קשר רשומים</p>
        ) : (
          contacts.map((contact, index) => (
            <div key={contact.id} className="space-y-1">
              <div className="font-medium text-sm">
                {contact.first_name} {contact.last_name}
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                {contact.email && <div>📧 {contact.email}</div>}
                {contact.phone && <div>📞 {contact.phone}</div>}
                {contact.role && <div>💼 {contact.role}</div>}
              </div>
              {index < contacts.length - 1 && <div className="border-b border-muted pt-2" />}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default ContactDisplaySection;