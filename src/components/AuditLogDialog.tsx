import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";

interface AuditLog {
  id: string;
  user_id: string;
  table_name: string;
  record_id: string;
  action: string;
  old_values: any;
  new_values: any;
  created_at: string;
}

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
}

interface AuditLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AuditLogDialog = ({ open, onOpenChange }: AuditLogDialogProps) => {
  const { profile } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAuditLogs = async () => {
    if (!profile || !['admin', 'manager'].includes(profile.role)) return;
    
    setLoading(true);
    try {
      const { data: logs, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      // Get unique user IDs
      const userIds = [...new Set(logs?.map(log => log.user_id) || [])];
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, first_name, last_name")
          .in("id", userIds);

        setUserProfiles(profiles || []);
      }

      setAuditLogs(logs || []);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchAuditLogs();
    }
  }, [open]);

  const getUserName = (userId: string) => {
    const user = userProfiles.find(p => p.id === userId);
    return user ? `${user.first_name} ${user.last_name}` : "משתמש לא ידוע";
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'INSERT':
        return 'bg-green-500';
      case 'UPDATE':
        return 'bg-blue-500';
      case 'DELETE':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'INSERT':
        return 'הוספה';
      case 'UPDATE':
        return 'עדכון';
      case 'DELETE':
        return 'מחיקה';
      default:
        return action;
    }
  };

  const formatValue = (value: any) => {
    if (value === null || value === undefined) return 'ריק';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return value.toString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]" dir="rtl">
        <DialogHeader>
          <DialogTitle>יומן ביקורת (Audit Log)</DialogTitle>
          <DialogDescription>
            רשימת פעולות שבוצעו במערכת - 100 הפעולות האחרונות
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              אין פעולות ביקורת לתצוגה
            </div>
          ) : (
            <div className="space-y-4">
              {auditLogs.map((log) => (
                <Card key={log.id} className="border-r-4 border-r-muted">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge className={`${getActionColor(log.action)} text-white`}>
                          {getActionLabel(log.action)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {log.table_name}
                        </span>
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-medium">
                          {getUserName(log.user_id)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(log.created_at).toLocaleString('he-IL')}
                        </div>
                      </div>
                    </div>

                    {log.old_values && (
                      <div className="mb-2">
                        <div className="text-sm font-medium mb-1 text-red-600">ערכים ישנים:</div>
                        <div className="bg-red-50 p-2 rounded text-sm text-right">
                          <pre className="whitespace-pre-wrap">{formatValue(log.old_values)}</pre>
                        </div>
                      </div>
                    )}

                    {log.new_values && (
                      <div>
                        <div className="text-sm font-medium mb-1 text-green-600">ערכים חדשים:</div>
                        <div className="bg-green-50 p-2 rounded text-sm text-right">
                          <pre className="whitespace-pre-wrap">{formatValue(log.new_values)}</pre>
                        </div>
                      </div>
                    )}

                    {log.record_id && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        מזהה רשומה: {log.record_id}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default AuditLogDialog;