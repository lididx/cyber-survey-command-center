import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowRight,
  Copy,
  Edit,
  FileText,
  Plus,
  Search,
  Trash2,
  Clipboard,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FindingSearchCombobox } from "@/components/FindingSearchCombobox";
import { AddSurveyFindingDialog } from "@/components/AddSurveyFindingDialog";
import { EditSurveyFindingDialog } from "@/components/EditSurveyFindingDialog";
import {
  copyFindingToClipboard,
  copyAllFindingsToClipboard,
  type FindingData,
} from "@/utils/findingCopyHelpers";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function SurveyFindings() {
  const { surveyId } = useParams<{ surveyId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [survey, setSurvey] = useState<any>(null);
  const [findings, setFindings] = useState<any[]>([]);
  const [filteredFindings, setFilteredFindings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [selectedFinding, setSelectedFinding] = useState<any>(null);
  const [findingToDelete, setFindingToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (surveyId) {
      fetchSurvey();
      fetchFindings();
    }
  }, [surveyId]);

  useEffect(() => {
    filterFindings();
  }, [findings, searchText, severityFilter, statusFilter]);

  const fetchSurvey = async () => {
    const { data, error } = await supabase
      .from("surveys")
      .select(`
        *,
        clients (
          name,
          logo_url
        )
      `)
      .eq("id", surveyId)
      .single();

    if (error) {
      console.error("Error fetching survey:", error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בטעינת פרטי הסקר",
        variant: "destructive",
      });
    } else {
      setSurvey(data);
    }
  };

  const fetchFindings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("survey_findings")
      .select("*")
      .eq("survey_id", surveyId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching findings:", error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בטעינת הממצאים",
        variant: "destructive",
      });
    } else {
      setFindings(data || []);
    }
    setLoading(false);
  };

  const filterFindings = () => {
    let filtered = [...findings];

    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(
        (f) =>
          f.subject?.toLowerCase().includes(search) ||
          f.test_description?.toLowerCase().includes(search) ||
          f.test_findings?.toLowerCase().includes(search)
      );
    }

    if (severityFilter !== "all") {
      filtered = filtered.filter((f) => f.severity === severityFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((f) => f.status === statusFilter);
    }

    setFilteredFindings(filtered);
  };

  const handleTemplateSelect = async (template: any) => {
    const { data, error } = await supabase
      .from("findings_templates")
      .select("*")
      .eq("id", template.id)
      .single();

    if (error) {
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בטעינת פרטי הממצא",
        variant: "destructive",
      });
      return;
    }

    setSelectedTemplate(data);
    setShowAddDialog(true);
  };

  const handleDeleteFinding = async (findingId: string) => {
    const { error } = await supabase
      .from("survey_findings")
      .delete()
      .eq("id", findingId);

    if (error) {
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה במחיקת הממצא",
        variant: "destructive",
      });
    } else {
      toast({
        title: "הממצא הוסר בהצלחה",
        description: "הממצא הוסר מהמערכת",
      });
      fetchFindings();
    }
    setFindingToDelete(null);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "קריטית":
      case "critical":
        return "bg-purple-500";
      case "גבוהה":
      case "high":
        return "bg-red-500";
      case "בינונית":
      case "medium":
        return "bg-orange-500";
      case "נמוכה":
      case "low":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getSeverityLabel = (severity: string) => {
    const labels: Record<string, string> = {
      קריטית: "קריטית",
      גבוהה: "גבוהה",
      בינונית: "בינונית",
      נמוכה: "נמוכה",
      critical: "קריטית",
      high: "גבוהה",
      medium: "בינונית",
      low: "נמוכה",
    };
    return labels[severity] || severity;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      open: "פתוח",
      in_progress: "בטיפול",
      closed: "נסגר",
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-yellow-500";
      case "in_progress":
        return "bg-blue-500";
      case "closed":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>טוען...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6" dir="rtl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-4"
        >
          <ArrowRight className="ml-2 h-4 w-4" />
          חזרה לדשבורד
        </Button>

        <div className="flex items-center gap-4">
          {survey?.clients?.logo_url && (
            <img
              src={survey.clients.logo_url}
              alt={survey.clients.name}
              className="h-16 w-16 object-contain"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold">{survey?.system_name}</h1>
            <p className="text-muted-foreground">
              {survey?.clients?.name} |{" "}
              {survey?.survey_date
                ? new Date(survey.survey_date).toLocaleDateString("he-IL")
                : "ללא תאריך"}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Add Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            הוסף ממצא חדש
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FindingSearchCombobox onSelect={handleTemplateSelect} />
          <Button
            onClick={() => {
              setSelectedTemplate(null);
              setShowAddDialog(true);
            }}
            className="w-full"
          >
            <Plus className="ml-2 h-4 w-4" />
            הוסף ממצא בהקלדה חופשית
          </Button>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="חיפוש..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pr-10"
              />
            </div>

            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="חומרה" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל החומרות</SelectItem>
                <SelectItem value="קריטית">קריטית</SelectItem>
                <SelectItem value="גבוהה">גבוהה</SelectItem>
                <SelectItem value="בינונית">בינונית</SelectItem>
                <SelectItem value="נמוכה">נמוכה</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="סטטוס" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הסטטוסים</SelectItem>
                <SelectItem value="open">פתוח</SelectItem>
                <SelectItem value="in_progress">בטיפול</SelectItem>
                <SelectItem value="closed">נסגר</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() =>
                copyAllFindingsToClipboard(filteredFindings as FindingData[])
              }
              disabled={filteredFindings.length === 0}
            >
              <Clipboard className="ml-2 h-4 w-4" />
              העתק הכל ({filteredFindings.length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Findings List */}
      {filteredFindings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {findings.length === 0
                ? "טרם שוייכו ממצאים למערכת זו"
                : "לא נמצאו ממצאים התואמים את הסינון"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFindings.map((finding) => (
            <Card key={finding.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg flex-1 text-right">
                    {finding.subject}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge className={getSeverityColor(finding.severity) + " text-white"}>
                      {getSeverityLabel(finding.severity)}
                    </Badge>
                    <Badge className={getStatusColor(finding.status) + " text-white"}>
                      {getStatusLabel(finding.status)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground text-right line-clamp-3">
                  {finding.test_findings}
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyFindingToClipboard(finding as FindingData)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedFinding(finding);
                      setShowEditDialog(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setFindingToDelete(finding.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground text-left">
                  {new Date(finding.created_at).toLocaleDateString("he-IL")}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <AddSurveyFindingDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        surveyId={surveyId!}
        templateData={selectedTemplate}
        onSuccess={() => {
          fetchFindings();
          setSelectedTemplate(null);
        }}
      />

      <EditSurveyFindingDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        finding={selectedFinding}
        onSuccess={fetchFindings}
      />

      <AlertDialog
        open={!!findingToDelete}
        onOpenChange={(open) => !open && setFindingToDelete(null)}
      >
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו תסיר את הממצא מהמערכת הנוכחית בלבד. הממצא יישאר במאגר הכללי.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => findingToDelete && handleDeleteFinding(findingToDelete)}
            >
              הסר
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
