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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

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

interface AddSurveyFindingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surveyId: string;
  templateData?: any;
  onSuccess: () => void;
}

export function AddSurveyFindingDialog({
  open,
  onOpenChange,
  surveyId,
  templateData,
  onSuccess,
}: AddSurveyFindingDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addToLibrary, setAddToLibrary] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

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
    if (templateData) {
      form.reset({
        subject: templateData.subject || "",
        test_description: templateData.test_description || "",
        test_findings: templateData.test_findings || "",
        exposure_description: templateData.exposure_description || "",
        recommendations: templateData.recommendations || "",
        severity: templateData.severity || "בינונית",
        damage_potential: templateData.damage_potential || "בינוני",
        tech_risk_level: templateData.tech_risk_level || "בינונית",
        status: "open",
      });
    }
  }, [templateData, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const insertData = {
        survey_id: surveyId,
        finding_template_id: templateData?.id || null,
        subject: values.subject,
        test_description: values.test_description,
        test_findings: values.test_findings,
        exposure_description: values.exposure_description,
        recommendations: values.recommendations || "",
        severity: values.severity,
        damage_potential: values.damage_potential,
        tech_risk_level: values.tech_risk_level,
        status: values.status,
        is_custom: !templateData,
        created_by: user.id,
      };

      const { error } = await supabase
        .from("survey_findings")
        .insert(insertData);

      if (error) throw error;

      // If this is a new custom finding and user wants to add to library
      if (!templateData && addToLibrary) {
        // First, get or create a default category
        const { data: categories } = await supabase
          .from("findings_categories")
          .select("id")
          .limit(1)
          .single();

        if (categories) {
          const { error: templateError } = await supabase
            .from("findings_templates")
            .insert({
              category_id: categories.id,
              subject: values.subject,
              test_description: values.test_description,
              test_findings: values.test_findings,
              exposure_description: values.exposure_description,
              recommendations: values.recommendations || "",
              severity: values.severity,
              damage_potential: values.damage_potential,
              tech_risk_level: values.tech_risk_level,
              created_by: user.id,
            });

          if (templateError) {
            console.error("Error adding to library:", templateError);
          }
        }
      }

      toast({
        title: "הממצא נוסף בהצלחה",
        description: "הממצא נוסף למערכת",
      });

      form.reset();
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding finding:", error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בהוספת הממצא",
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
          <DialogTitle>
            {templateData ? "הוספת ממצא ממאגר" : "הוספת ממצא חדש"}
          </DialogTitle>
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

            {!templateData && (
              <div className="flex items-center gap-2 justify-end">
                <label htmlFor="add-to-library" className="text-sm font-medium">
                  הוסף גם למאגר הכללי
                </label>
                <Checkbox
                  id="add-to-library"
                  checked={addToLibrary}
                  onCheckedChange={(checked) => setAddToLibrary(checked as boolean)}
                />
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                ביטול
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "מוסיף..." : "הוסף ממצא"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
