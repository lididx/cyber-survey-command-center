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
  contactNames?: string[];
  userFirstName?: string;
  userGender?: string;
}

const EmailTemplateDialog = ({ open, onOpenChange, surveyName, clientName, contactEmail, contactNames = [], userFirstName = "", userGender = "male" }: EmailTemplateDialogProps) => {
  const { toast } = useToast();

  const genderText = {
    surveyor: userGender === "female" ? "סוקרת" : "סוקר",
    requesting: userGender === "female" ? "מבקשת" : "מבקש"
  };

  const contactNamesText = contactNames.length > 0 ? contactNames.join(", ") : "צוות המערכת";

  const emailSubject = `קביעת סקר אפליקציה למערכת ${surveyName} - ${clientName}`;

  const emailTemplate = `נושא: ${emailSubject}

היי ${contactNamesText},

שמי ${userFirstName} אני ${genderText.surveyor} אפליקציה מטעם חברת Citadel העובדת עם ${clientName}, קיבלתי את המייל שלכם על מנת לתאם מולכם סקר אפליקציה למערכת ${surveyName}.

להלן הנושאים עליהם נעבור במהלך סקר האפליקציה על המערכת:
	•	תיאור המערכת (מידע כללי על המערכת הכולל גם גרסאות שפות תכנות)
	•	הזדהות למערכת (דרך ההזדהות למערכת, מדיניות סיסמאות, אופן ומיקום שמירת סיסמאות ועוד..)
	•	ממשקים מול מערכות אחרות (ממשקים העובדים מול המערכת / דרכי ההתממשקות \ אופן ההתממשקות – ירידה לפרטים טכניים)
	•	משתמשים והרשאות (מעבר על סוגי ההרשאות והקבוצות במערכת, אופן הוספת הרשאות, ניהול קבוצות ועוד..)
	•	ארכיטקטורה אפליקטיבית (שרתים, שמות שרתים, גרסאות מערכות הפעלה וגרסאות שירותים – שירותי Web/ מסד נתונים וכו' )
	•	עבודה מול בסיס הנתונים (משתמשים אפליקטיביים, סוגי שאילתות בבסיס הנתונים, הרשאות המשתמש האפליקטיבי ואופן שמירת פרטי זיהוי)
	•	לוגים וחיווים (סוגי חיווים, זמן שמירה, מיקום ועוד..)
	•	בדיקת קלטים (בדיקה האם קיימת ולידציה על הקלטים המתקבלים למערכת, בדיקה של מנגנוני העלאת קבצים למערכת במידה וקיים)
	•	סביבות עבודה
	•	תווך הצפנה של המערכת

כמה דגשים: 
1.	הסקר הינו סקר תשאולי בלבד.
2.	במהלך הסקר אצטרך לקחת תצלומי מסך מתוך המערכת לכן יש צורך בגישה מלאה למערכת בזמן הפגישה.
3.	במידה ואתם חושבים שיש גורמים נוספים שיכולים לעזור במהלך הפגישה אתם מוזמנים להוסיף אותם.
4.	אשמח שתשלחו לי מספר תאריכים בהם אתם זמינים לביצוע הפגישה.

תודה רבה,
${userFirstName}
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
      const subject = encodeURIComponent(emailSubject);
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
            תבנית מייל לקביעת פגישה - {surveyName}
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