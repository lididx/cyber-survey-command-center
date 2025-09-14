import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Save, Palette, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface SystemSettings {
  stuck_survey_threshold_days: number;
  status_colors: Record<string, string>;
  email_templates: Record<string, string>;
}

interface AdminSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  systemSettings: SystemSettings;
  onSettingsUpdate: () => void;
}

const AdminSettingsDialog = ({ open, onOpenChange, systemSettings, onSettingsUpdate }: AdminSettingsDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [thresholdDays, setThresholdDays] = useState(systemSettings.stuck_survey_threshold_days);
  const [statusColors, setStatusColors] = useState(systemSettings.status_colors);
  const [saving, setSaving] = useState(false);

  const statusLabels: Record<string, string> = {
    received: "התקבל",
    email_sent_to_admin: "נשלח מייל תיאום למנהל מערכת",
    meeting_scheduled: "פגישה נקבעה",
    in_writing: "בכתיבה",
    completion_questions_with_admin: "שאלות השלמה מול מנהל מערכת",
    chen_review: "בבקרה של חן",
    returned_from_review: "חזר מבדיקה",
    completed: "הסתיים"
  };

  const updateStatusColor = (status: string, color: string) => {
    setStatusColors(prev => ({
      ...prev,
      [status]: color
    }));
  };

  const saveSettings = async () => {
    if (!user) return;
    
    try {
      setSaving(true);

      // Save threshold days
      const { error: thresholdError } = await supabase
        .from("system_settings")
        .update({ setting_value: thresholdDays.toString() })
        .eq("setting_key", "stuck_survey_threshold_days");

      if (thresholdError) throw thresholdError;

      // Save status colors
      const { error: colorsError } = await supabase
        .from("system_settings")
        .update({ setting_value: statusColors })
        .eq("setting_key", "status_colors");

      if (colorsError) throw colorsError;

      // Log the change
      await supabase
        .from("audit_logs")
        .insert({
          user_id: user.id,
          action: "UPDATE_SYSTEM_SETTINGS",
          table_name: "system_settings",
          new_values: {
            stuck_survey_threshold_days: thresholdDays,
            status_colors: statusColors
          }
        });

      toast({
        title: "הגדרות נשמרו בהצלחה",
        description: "השינויים עודכנו במערכת",
      });

      onSettingsUpdate();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "שגיאה בשמירת הגדרות",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>הגדרות מערכת</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Threshold Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                הגדרות זמן
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="threshold">ימים עד סימון כסקר תקוע</Label>
                  <Input
                    id="threshold"
                    type="number"
                    min="1"
                    max="30"
                    value={thresholdDays}
                    onChange={(e) => setThresholdDays(parseInt(e.target.value) || 5)}
                    className="w-32"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    סקרים שלא עודכנו במשך {thresholdDays} ימים יסומנו כתקועים
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Colors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                צבעי סטטוסים
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(statusLabels).map(([status, label]) => (
                  <div key={status} className="flex items-center gap-3">
                    <Badge 
                      style={{ 
                        backgroundColor: statusColors[status] || "#8884d8",
                        color: 'white',
                        minWidth: '120px'
                      }}
                    >
                      {label}
                    </Badge>
                    <Input
                      type="color"
                      value={statusColors[status] || "#8884d8"}
                      onChange={(e) => updateStatusColor(status, e.target.value)}
                      className="w-16 h-8 p-1 border rounded"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
            <Button onClick={saveSettings} disabled={saving}>
              <Save className="h-4 w-4 ml-2" />
              {saving ? "שומר..." : "שמור הגדרות"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminSettingsDialog;