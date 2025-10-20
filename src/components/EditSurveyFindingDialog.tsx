import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  subject: z.string().min(1, "יש להזין נושא"),
  test_description: z.string().min(1, "יש להזין תיאור בדיקה"),
  test_findings: z.string().min(1, "יש להזין ממצאי בדיקה"),
  exposure_description: z.string().min(1, "יש להזין תיאור חשיפה"),
  recommendations: z.string().optional(),
  severity: z.enum(["נמוכה", "בינונית", "גבוהה", "קריטית"]),
  damage_potential: z.enum(["נמוך", "בינוני", "גבוה", "קריטי"]),
  tech_risk_level: z.enum(["נמוכה", "בינונית", "גבוהה", "קריטית"]),
  status: z.enum(["open", "in_progress", "closed"]),
});

interface EditSurveyFindingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  finding: any;
  onSuccess: () => void;
}

export function EditSurveyFindingDialog({
  open,
  onOpenChange,
  finding,
  onSuccess,
}: EditSurveyFindingDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: "",
      test_description: "",
      test_findings: "",
      exposure_description: "",
      recommendations: "",
      severity: "בינונית",
      damage_potential: "בינוני",
      tech_risk_level: "בינונית",
      status: "open",
    },
  });

  useEffect(() => {
    if (finding) {
      form.reset({
        subject: finding.subject || "",
        test_description: finding.test_description || "",
        test_findings: finding.test_findings || "",
        exposure_description: finding.exposure_description || "",
        recommendations: finding.recommendations || "",
        severity: finding.severity || "בינונית",
        damage_potential: finding.damage_potential || "בינוני",
        tech_risk_level: finding.tech_risk_level || "בינונית",
        status: finding.status || "open",
      });
    }
  }, [finding, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("survey_findings")
        .update({
          subject: values.subject,
          test_description: values.test_description,
          test_findings: values.test_findings,
          exposure_description: values.exposure_description,
          recommendations: values.recommendations || "",
          severity: values.severity,
          damage_potential: values.damage_potential,
          tech_risk_level: values.tech_risk_level,
          status: values.status,
        })
        .eq("id", finding.id);

      if (error) throw error;

      toast({
        title: "הממצא עודכן בהצלחה",
        description: "השינויים נשמרו במערכת",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating finding:", error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעדכון הממצא",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateInLibrary = async () => {
    if (!finding.finding_template_id) {
      toast({
        title: "לא ניתן לעדכן במאגר",
        description: "ממצא זה לא מקושר למאגר הכללי",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const values = form.getValues();
      const { error } = await supabase
        .from("findings_templates")
        .update({
          subject: values.subject,
          test_description: values.test_description,
          test_findings: values.test_findings,
          exposure_description: values.exposure_description,
          recommendations: values.recommendations || "",
          severity: values.severity,
          damage_potential: values.damage_potential,
          tech_risk_level: values.tech_risk_level,
        })
        .eq("id", finding.finding_template_id);

      if (error) throw error;

      toast({
        title: "המאגר עודכן בהצלחה",
        description: "התבנית במאגר הכללי עודכנה",
      });
    } catch (error) {
      console.error("Error updating library:", error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעדכון המאגר",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>עריכת ממצא</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>נושא הממצא</FormLabel>
                  <FormControl>
                    <Input placeholder="הזן את נושא הממצא" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="test_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>תיאור הבדיקה</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="תאר את הבדיקה שבוצעה"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="test_findings"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ממצאי הבדיקה</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="תאר את ממצאי הבדיקה"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="exposure_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>תיאור החשיפה / הסיכונים</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="תאר את החשיפה והסיכונים"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="recommendations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>המלצות</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="רשום המלצות לתיקון"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="severity"
                render={({ field }) => (
                  <FormItem className="text-right">
                    <FormLabel>חומרה</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="text-right">
                          <SelectValue placeholder="בחר חומרה" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="נמוכה">נמוכה</SelectItem>
                        <SelectItem value="בינונית">בינונית</SelectItem>
                        <SelectItem value="גבוהה">גבוהה</SelectItem>
                        <SelectItem value="קריטית">קריטית</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="damage_potential"
                render={({ field }) => (
                  <FormItem className="text-right">
                    <FormLabel>פוטנציאל נזק</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="text-right">
                          <SelectValue placeholder="בחר פוטנציאל נזק" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="נמוך">נמוך</SelectItem>
                        <SelectItem value="בינוני">בינוני</SelectItem>
                        <SelectItem value="גבוה">גבוה</SelectItem>
                        <SelectItem value="קריטי">קריטי</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tech_risk_level"
                render={({ field }) => (
                  <FormItem className="text-right">
                    <FormLabel>רמת סיכון טכנולוגית</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="text-right">
                          <SelectValue placeholder="בחר רמת סיכון" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="נמוכה">נמוכה</SelectItem>
                        <SelectItem value="בינונית">בינונית</SelectItem>
                        <SelectItem value="גבוהה">גבוהה</SelectItem>
                        <SelectItem value="קריטית">קריטית</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="text-right">
                    <FormLabel>סטטוס טיפול</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="text-right">
                          <SelectValue placeholder="בחר סטטוס" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="open">פתוח</SelectItem>
                        <SelectItem value="in_progress">בטיפול</SelectItem>
                        <SelectItem value="closed">נסגר</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                ביטול
              </Button>
              {finding?.finding_template_id && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleUpdateInLibrary}
                  disabled={isSubmitting}
                >
                  עדכן במאגר
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "שומר..." : "שמור שינויים"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
