import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Clock, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Survey {
  id: string;
  system_name: string;
  updated_at: string;
  status: string;
  clients: {
    name: string;
  };
}

interface SystemSettings {
  stuck_survey_threshold_days: number;
}

interface RemindersSectionProps {
  surveys: Survey[];
  systemSettings: SystemSettings;
  statusLabels: Record<string, string>;
}

const RemindersSection = ({ surveys, systemSettings, statusLabels }: RemindersSectionProps) => {
  const { toast } = useToast();

  // Get stuck or critical surveys (exclude meeting_scheduled status)
  const criticalSurveys = surveys.filter(survey => {
    const daysSinceUpdate = Math.floor((Date.now() - new Date(survey.updated_at).getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceUpdate > systemSettings.stuck_survey_threshold_days && 
           survey.status !== 'completed' && 
           survey.status !== 'meeting_scheduled';
  });

  const handleSendReminder = (surveyId: string, systemName: string) => {
    // This would integrate with email service
    toast({
      title: "תזכורת נשלחה",
      description: `תזכורת נשלחה עבור סקר ${systemName}`,
    });
  };

  if (criticalSurveys.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-green-500" />
            תזכורות ופעולות מיידיות
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">כל הסקרים במצב תקין - אין סקרים תקועים</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          תזכורות ופעולות מיידיות
          <Badge variant="destructive">{criticalSurveys.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {criticalSurveys.map((survey) => {
            const daysSinceUpdate = Math.floor((Date.now() - new Date(survey.updated_at).getTime()) / (1000 * 60 * 60 * 24));
            
            return (
              <Card key={survey.id} className="border-red-200 bg-red-50">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="destructive">תקוע</Badge>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm">{survey.system_name}</h4>
                      <p className="text-xs text-muted-foreground">{survey.clients?.name}</p>
                    </div>
                    
                    <div className="text-xs space-y-1">
                      <div>סטטוס: {statusLabels[survey.status]}</div>
                      <div className="text-red-600 font-medium">
                        {daysSinceUpdate} ימים ללא עדכון
                      </div>
                      <div>עודכן לאחרונה: {new Date(survey.updated_at).toLocaleDateString('he-IL')}</div>
                    </div>
                    
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default RemindersSection;