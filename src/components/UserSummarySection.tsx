import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

interface Survey {
  id: string;
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

interface UserSummarySectionProps {
  surveys: Survey[];
  statusLabels: Record<string, string>;
  userProfiles: UserProfile[];
}

const UserSummarySection = ({ surveys, statusLabels, userProfiles }: UserSummarySectionProps) => {
  // Group surveys by user
  const userSurveyData = userProfiles.map(user => {
    const userSurveys = surveys.filter(survey => survey.user_id === user.id);
    const statusCounts = userSurveys.reduce((acc, survey) => {
      acc[survey.status] = (acc[survey.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      user,
      totalSurveys: userSurveys.length,
      statusCounts
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          סיכום סקרים לפי משתמש
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {userSurveyData.map(({ user, totalSurveys, statusCounts }) => (
            <div key={user.id} className="p-4 border rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">
                  {user.first_name} {user.last_name}
                </h3>
                <Badge variant="outline" className="text-sm">
                  {totalSurveys} סקרים סה"כ
                </Badge>
              </div>
              
              {totalSurveys > 0 && (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(statusCounts).map(([status, count]) => (
                    <Badge 
                      key={status} 
                      variant="secondary" 
                      className="text-xs"
                    >
                      {statusLabels[status] || status}: {count}
                    </Badge>
                  ))}
                </div>
              )}
              
              {totalSurveys === 0 && (
                <p className="text-muted-foreground text-sm">אין סקרים פעילים</p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserSummarySection;