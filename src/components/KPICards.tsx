import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Users, Activity, Clock, AlertTriangle } from "lucide-react";

interface Survey {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
  clients: {
    name: string;
  };
}

interface SystemSettings {
  stuck_survey_threshold_days: number;
}

interface KPICardsProps {
  surveys: Survey[];
  systemSettings: SystemSettings;
  statusLabels: Record<string, string>;
}

const KPICards = ({ surveys, systemSettings, statusLabels }: KPICardsProps) => {
  const totalSurveys = surveys.length;
  const uniqueClients = new Set(surveys.map(s => s.clients?.name).filter(Boolean)).size;
  const activeSurveys = surveys.filter(s => !['completed'].includes(s.status)).length;
  const completionQuestionsSurveys = surveys.filter(s => s.status === 'completion_questions_with_admin').length;
  
  // Calculate stuck surveys
  const stuckSurveys = surveys.filter(survey => {
    const daysSinceUpdate = Math.floor((Date.now() - new Date(survey.updated_at).getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceUpdate > systemSettings.stuck_survey_threshold_days && survey.status !== 'completed';
  }).length;

  const kpiData = [
    {
      title: "סה״כ סקרים מבוצעים",
      value: totalSurveys,
      icon: BarChart3,
      color: "bg-blue-500"
    },
    {
      title: "סה״כ לקוחות מטופלים",
      value: uniqueClients,
      icon: Users,
      color: "bg-green-500"
    },
    {
      title: "סקרים פעילים כעת",
      value: activeSurveys,
      icon: Activity,
      color: "bg-orange-500"
    },
    {
      title: "סקרים במצב שאלות השלמה",
      value: completionQuestionsSurveys,
      icon: Clock,
      color: "bg-purple-500"
    },
    {
      title: `סקרים תקועים (>${systemSettings.stuck_survey_threshold_days} ימים)`,
      value: stuckSurveys,
      icon: AlertTriangle,
      color: "bg-red-500"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {kpiData.map((kpi, index) => (
        <Card key={index} className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {kpi.title}
            </CardTitle>
            <div className={`p-2 rounded-full ${kpi.color} text-white`}>
              <kpi.icon className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpi.value}</div>
            {kpi.title.includes("תקועים") && kpi.value > 0 && (
              <Badge variant="destructive" className="mt-2">
                דורש תשומת לב
              </Badge>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default KPICards;