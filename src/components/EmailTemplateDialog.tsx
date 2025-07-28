import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EmailTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surveyName: string;
  clientName: string;
  contactEmail?: string;
}

const EmailTemplateDialog = ({ open, onOpenChange, surveyName, clientName, contactEmail }: EmailTemplateDialogProps) => {
  const { toast } = useToast();

  const emailTemplate = `נושא: בקשה לתיאום פגישה - סקר ${surveyName}

שלום רב,

אני פונה אליכם בעקבות הסקר שהתקבל עבור מערכת ${surveyName} של ${clientName}.

במטרה להשלים את תהליך הסקר בצורה יעילה ומקצועית, אני מבקש לתאם פגישה לדיון על הנושאים הבאים:

• סקירת דרישות המערכת
• הבהרת שאלות טכניות
• תיאום לוחות זמנים
• הגדרת אבני דרך

האם ניתן לתאם פגישה בימים הקרובים?

אנא הודיעו על זמינותכם.

בברכה,
[שם המבצע]
[פרטי יצירת קשר]`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(emailTemplate);
    toast({
      title: "הועתק ללוח",
      description: "תבנית המייל הועתקה ללוח בהצלחה",
    });
  };

  const openEmailClient = () => {
    if (contactEmail) {
      const subject = encodeURIComponent(`בקשה לתיאום פגישה - סקר ${surveyName}`);
      const body = encodeURIComponent(emailTemplate);
      window.open(`mailto:${contactEmail}?subject=${subject}&body=${body}`, '_blank');
    } else {
      copyToClipboard();
      toast({
        title: "אין כתובת מייל",
        description: "התבנית הועתקה ללוח. אנא הוסף את כתובת המייל ידנית",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">
            תבנית מייל לתיאום פגישה - {surveyName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Textarea
            value={emailTemplate}
            readOnly
            className="min-h-[400px] font-mono text-sm"
            dir="rtl"
          />
          
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={copyToClipboard}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              העתק ללוח
            </Button>
            
            <Button
              onClick={openEmailClient}
              className="flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              {contactEmail ? "פתח ביישום מייל" : "העתק ללוח"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmailTemplateDialog;