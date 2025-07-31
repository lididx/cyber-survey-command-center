import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ResponsiveContainer } from "recharts";

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
  status_colors: Record<string, string>;
}

interface ChartsSectionProps {
  surveys: Survey[];
  systemSettings: SystemSettings;
  statusLabels: Record<string, string>;
}

const ChartsSection = ({ surveys, systemSettings, statusLabels }: ChartsSectionProps) => {
  // Client distribution data
  const clientData = Object.entries(
    surveys.reduce((acc, survey) => {
      const clientName = survey.clients?.name || "לא ידוע";
      acc[clientName] = (acc[clientName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, count]) => ({ name, count }));

  // Status distribution data
  const statusData = Object.entries(
    surveys.reduce((acc, survey) => {
      acc[survey.status] = (acc[survey.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([status, count]) => ({ 
    status: statusLabels[status] || status, 
    count,
    originalStatus: status
  }));

  // Time in status data
  const timeInStatusData = statusData.map(item => {
    const statusSurveys = surveys.filter(s => s.status === item.originalStatus);
    const avgDays = statusSurveys.length > 0 ? 
      statusSurveys.reduce((acc, survey) => {
        const days = Math.floor((Date.now() - new Date(survey.updated_at).getTime()) / (1000 * 60 * 60 * 24));
        return acc + days;
      }, 0) / statusSurveys.length : 0;
    
    const stuckCount = statusSurveys.filter(survey => {
      const days = Math.floor((Date.now() - new Date(survey.updated_at).getTime()) / (1000 * 60 * 60 * 24));
      return days > systemSettings.stuck_survey_threshold_days;
    }).length;

    return {
      status: item.status,
      avgDays: Math.round(avgDays),
      stuckCount
    };
  });

  // Monthly trends data
  const monthlyData = surveys.reduce((acc, survey) => {
    const month = new Date(survey.created_at).toLocaleDateString('he-IL', { year: 'numeric', month: 'short' });
    if (!acc[month]) {
      acc[month] = { month, created: 0, completed: 0 };
    }
    acc[month].created++;
    if (survey.status === 'completed') {
      acc[month].completed++;
    }
    return acc;
  }, {} as Record<string, { month: string; created: number; completed: number }>);

  const monthlyTrends = Object.values(monthlyData).sort((a, b) => 
    new Date(a.month).getTime() - new Date(b.month).getTime()
  );

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Client Distribution Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>פיזור לפי לקוחות</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={clientData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {clientData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Status Distribution Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>פיזור לפי סטטוסים</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="status" 
                tick={{ fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Time in Status */}
      <Card>
        <CardHeader>
          <CardTitle>משך זמן בסטטוסים</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={timeInStatusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="status" 
                tick={{ fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis />
              <Tooltip />
              <Bar dataKey="avgDays" fill="#82ca9d" name="ממוצע ימים" />
              <Bar dataKey="stuckCount" fill="#ff8042" name="סקרים תקועים" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle>מגמות חודשיות</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="created" stroke="#8884d8" name="סקרים חדשים" />
              <Line type="monotone" dataKey="completed" stroke="#82ca9d" name="סקרים שהושלמו" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChartsSection;