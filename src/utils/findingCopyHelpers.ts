import { toast } from "@/hooks/use-toast";

export interface FindingData {
  subject: string;
  test_description: string;
  test_findings: string;
  exposure_description: string;
  recommendations?: string;
  severity: string;
  damage_potential: string;
  tech_risk_level: string;
  status: string;
}

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

const getDamagePotentialLabel = (level: string) => {
  const labels: Record<string, string> = {
    קריטי: "קריטי",
    גבוה: "גבוה",
    בינוני: "בינוני",
    נמוך: "נמוך",
    critical: "קריטי",
    high: "גבוה",
    medium: "בינוני",
    low: "נמוך",
  };
  return labels[level] || level;
};

const getTechRiskLabel = (level: string) => {
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
  return labels[level] || level;
};

export const formatFindingForCopy = (finding: FindingData): string => {
  return `נושא: ${finding.subject}
חומרה: ${getSeverityLabel(finding.severity)} | סטטוס: ${getStatusLabel(finding.status)}

תיאור הבדיקה:
${finding.test_description}

ממצאי הבדיקה:
${finding.test_findings}

תיאור החשיפה והסיכונים:
${finding.exposure_description}

פוטנציאל נזק: ${getDamagePotentialLabel(finding.damage_potential)}
רמת סיכון טכנולוגית: ${getTechRiskLabel(finding.tech_risk_level)}
${finding.recommendations ? `\nהמלצות:\n${finding.recommendations}` : ""}

---`;
};

export const copyFindingToClipboard = async (finding: FindingData) => {
  const formatted = formatFindingForCopy(finding);
  try {
    await navigator.clipboard.writeText(formatted);
    toast({
      title: "הועתק בהצלחה",
      description: "הממצא הועתק ללוח",
    });
  } catch (error) {
    toast({
      title: "שגיאה בהעתקה",
      description: "לא ניתן להעתיק את הממצא",
      variant: "destructive",
    });
  }
};

export const copyAllFindingsToClipboard = async (findings: FindingData[]) => {
  const formatted = findings.map(formatFindingForCopy).join("\n\n");
  try {
    await navigator.clipboard.writeText(formatted);
    toast({
      title: "הועתק בהצלחה",
      description: `${findings.length} ממצאים הועתקו ללוח`,
    });
  } catch (error) {
    toast({
      title: "שגיאה בהעתקה",
      description: "לא ניתן להעתיק את הממצאים",
      variant: "destructive",
    });
  }
};
