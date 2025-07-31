import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface HistoryEntry {
  id: string;
  field_name: string;
  old_value: string;
  new_value: string;
  created_at: string;
  user_id: string;
  source: 'survey_history' | 'audit_logs';
  action?: string;
}

interface SurveyHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surveyId: string;
  surveyName: string;
}

const fieldNameLabels: Record<string, string> = {
  status: "סטטוס",
  is_archived: "ארכיון", 
  survey_date: "תאריך סקר",
  received_date: "תאריך קבלה",
  system_name: "שם מערכת",
  system_description: "תיאור מערכת",
  comments: "הערות"
};

const statusLabels: Record<string, string> = {
  received: "התקבל",
  email_sent_to_admin: "נשלח מייל תיאום למנהל המערכת",
  meeting_scheduled: "פגישה נקבעה",
  in_writing: "בכתיבה",
  completion_questions_with_admin: "שאלות השלמה מול מנהל מערכת",
  chen_review: "בבקרה של חן",
  completed: "הסתיים"
};

const SurveyHistoryDialog = ({ open, onOpenChange, surveyId, surveyName }: SurveyHistoryDialogProps) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchHistory = async () => {
    if (!surveyId) return;
    
    try {
      setLoading(true);
      
      // טעינת נתונים מטבלת survey_history
      const { data: surveyHistoryData, error: surveyHistoryError } = await supabase
        .from("survey_history")
        .select(`
          id,
          field_name,
          old_value,
          new_value,
          created_at,
          user_id
        `)
        .eq("survey_id", surveyId)
        .order("created_at", { ascending: false });

      if (surveyHistoryError) throw surveyHistoryError;

      // טעינת הערות מטבלת audit_logs
      const { data: auditLogsData, error: auditLogsError } = await supabase
        .from("audit_logs")
        .select(`
          id,
          action,
          new_values,
          created_at,
          user_id
        `)
        .eq("record_id", surveyId)
        .eq("table_name", "surveys")
        .eq("action", "comment")
        .order("created_at", { ascending: false });

      if (auditLogsError) throw auditLogsError;

      // המרת נתוני survey_history לפורמט אחיד
      const surveyHistoryEntries: HistoryEntry[] = (surveyHistoryData || []).map(entry => ({
        id: entry.id,
        field_name: entry.field_name,
        old_value: entry.old_value || "",
        new_value: entry.new_value || "",
        created_at: entry.created_at,
        user_id: entry.user_id,
        source: 'survey_history' as const
      }));

      // המרת נתוני audit_logs לפורמט אחיד
      const auditLogEntries: HistoryEntry[] = (auditLogsData || []).map(entry => {
        const newValues = entry.new_values as any;
        return {
          id: entry.id,
          field_name: "comments",
          old_value: "",
          new_value: newValues?.comments || "",
          created_at: entry.created_at,
          user_id: entry.user_id,
          source: 'audit_logs' as const,
          action: entry.action
        };
      });

      // שילוב הנתונים ומיון לפי תאריך
      const allEntries = [...surveyHistoryEntries, ...auditLogEntries];
      allEntries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setHistory(allEntries);
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: "לא ניתן לטעון את היסטוריית השינויים",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && surveyId) {
      fetchHistory();
    }
  }, [open, surveyId]);

  const formatValue = (fieldName: string, value: string) => {
    if (fieldName === "status") {
      return statusLabels[value] || value;
    }
    if (fieldName === "is_archived") {
      return value === "true" ? "כן" : "לא";
    }
    if (fieldName === "comments") {
      return value; // הערות מוצגות כמו שהן
    }
    return value;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">
            היסטוריית שינויים - {surveyName}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            אין שינויים מתועדים עבור סקר זה
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">תאריך ושעה</TableHead>
                <TableHead className="text-right">שדה</TableHead>
                <TableHead className="text-right">ערך קודם</TableHead>
                <TableHead className="text-right">ערך חדש</TableHead>
                <TableHead className="text-right">מבצע השינוי</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="text-right">
                    {new Date(entry.created_at).toLocaleString("he-IL")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline">
                      {fieldNameLabels[entry.field_name] || entry.field_name}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {entry.field_name === "comments" ? "-" : formatValue(entry.field_name, entry.old_value)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatValue(entry.field_name, entry.new_value)}
                  </TableCell>
                  <TableCell className="text-right">
                    משתמש מערכת
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SurveyHistoryDialog;