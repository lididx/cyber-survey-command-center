import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Mail, Clock, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
interface Survey {
  id: string;
  system_name: string;
  created_at: string;
  updated_at: string;
  survey_date: string;
  status: string;
  user_id: string;
  clients: {
    name: string;
  };
}
interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
}
interface SystemSettings {
  stuck_survey_threshold_days: number;
  status_colors: Record<string, string>;
}
interface SurveyDetailsTableProps {
  surveys: Survey[];
  systemSettings: SystemSettings;
  statusLabels: Record<string, string>;
  isAdmin?: boolean;
  userProfiles?: UserProfile[];
}
const SurveyDetailsTable = ({
  surveys,
  systemSettings,
  statusLabels,
  isAdmin = false,
  userProfiles = []
}: SurveyDetailsTableProps) => {
  const {
    toast
  } = useToast();
  const getDaysInStatus = (survey: Survey) => {
    return Math.floor((Date.now() - new Date(survey.updated_at).getTime()) / (1000 * 60 * 60 * 24));
  };
  const isStuck = (survey: Survey) => {
    const days = getDaysInStatus(survey);
    return days > systemSettings.stuck_survey_threshold_days && survey.status !== 'completed';
  };
  const handleSendReminder = (surveyId: string, systemName: string) => {
    // This would integrate with email service
    toast({
      title: "תזכורת נשלחה",
      description: `תזכורת נשלחה עבור סקר ${systemName}`
    });
  };
  const getStatusColor = (status: string) => {
    return systemSettings.status_colors[status] || "#8884d8";
  };
  const getUserName = (userId: string) => {
    const user = userProfiles.find(profile => profile.id === userId);
    return user ? `${user.first_name} ${user.last_name}` : "לא ידוע";
  };
  return <Card>
      <CardHeader>
        <CardTitle>טבלת פירוט סקרים</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">לקוח</TableHead>
                <TableHead className="text-center">כותרת סקר</TableHead>
                <TableHead className="text-center">תאריך ביצוע הסקר</TableHead>
                <TableHead className="text-center">סטטוס נוכחי</TableHead>
                <TableHead className="text-center">ימים בסטטוס</TableHead>
                {isAdmin && <TableHead className="text-center">בעל הסקר</TableHead>}
                
              </TableRow>
            </TableHeader>
            <TableBody>
              {surveys.map(survey => {
              const daysInStatus = getDaysInStatus(survey);
              const stuck = isStuck(survey);
              return <TableRow key={survey.id} className={stuck ? "bg-red-50 border-red-200" : ""}>
                    <TableCell className="text-center font-medium">
                      {survey.clients?.name || "לא ידוע"}
                    </TableCell>
                    <TableCell className="text-center">
                      {survey.system_name}
                    </TableCell>
                    <TableCell className="text-center">
                      {survey.survey_date ? new Date(survey.survey_date).toLocaleDateString('he-IL') : "לא נקבע"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge style={{
                    backgroundColor: getStatusColor(survey.status),
                    color: 'white'
                  }}>
                        {statusLabels[survey.status] || survey.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className={stuck ? "text-red-600 font-bold" : ""}>
                          {daysInStatus}
                        </span>
                        {stuck && <AlertTriangle className="h-4 w-4 text-red-500" />}
                      </div>
                    </TableCell>
                    {isAdmin && <TableCell className="text-center font-medium">
                        {getUserName(survey.user_id)}
                      </TableCell>}
                    
                  </TableRow>;
            })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>;
};
export default SurveyDetailsTable;