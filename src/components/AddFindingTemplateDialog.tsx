import { useState } from "react";
import * as React from "react";
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
import { useAuth } from "@/hooks/useAuth";

const formSchema = z.object({
  category_id: z.string().min(1, "יש לבחור קטגוריה"),
  subject: z.string().min(1, "יש להזין נושא נבחן"),
  test_description: z.string().min(1, "יש להזין תיאור בדיקה"),
  severity: z.enum(["נמוכה", "בינונית", "גבוהה", "קריטית"]),
  damage_potential: z.enum(["נמוך", "בינוני", "גבוה", "קריטי"]),
  tech_risk_level: z.enum(["נמוכה", "בינונית", "גבוהה", "קריטית"]),
  test_findings: z.string().min(1, "יש להזין ממצאי בדיקה"),
  exposure_description: z.string().min(1, "יש להזין תיאור חשיפה"),
  recommendations: z.string().optional(),
});

interface AddFindingTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: string;
  categories: Array<{ id: string; display_name: string }>;
  onSuccess: () => void;
}

export function AddFindingTemplateDialog({
  open,
  onOpenChange,
  categoryId,
  categories,
  onSuccess,
}: AddFindingTemplateDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category_id: categoryId,
      subject: "",
      test_description: "",
      severity: "בינונית",
      damage_potential: "בינוני",
      tech_risk_level: "בינונית",
      test_findings: "",
      exposure_description: "",
      recommendations: "",
    },
  });

  // Update the category when categoryId changes
  React.useEffect(() => {
    if (categoryId) {
      form.setValue("category_id", categoryId);
    }
  }, [categoryId, form]);

  // Calculate tech risk level automatically based on severity and damage potential
  const calculateTechRiskLevel = (severity: string, damagePotential: string): string => {
    const severityMap: Record<string, number> = {
      "נמוכה": 1,
      "בינונית": 2,
      "גבוהה": 3,
    };
    
    const damageMap: Record<string, number> = {
      "נמוך": 1,
      "בינוני": 2,
      "גבוה": 3,
    };
    
    const severityLevel = severityMap[severity] || 2;
    const damageLevel = damageMap[damagePotential] || 2;
    
    // Calculate according to the matrix
    if (severityLevel === 3 && damageLevel === 3) return "קריטית"; // גבוהה × גבוה
    if (severityLevel === 3 && damageLevel === 2) return "גבוהה"; // גבוהה × בינוני
    if (severityLevel === 3 && damageLevel === 1) return "בינונית"; // גבוהה × נמוך
    if (severityLevel === 2 && damageLevel === 3) return "גבוהה"; // בינונית × גבוה
    if (severityLevel === 2 && damageLevel === 2) return "בינונית"; // בינונית × בינוני
    if (severityLevel === 2 && damageLevel === 1) return "נמוכה"; // בינונית × נמוך
    if (severityLevel === 1 && damageLevel === 3) return "בינונית"; // נמוכה × גבוה
    if (severityLevel === 1 && damageLevel === 2) return "נמוכה"; // נמוכה × בינוני
    if (severityLevel === 1 && damageLevel === 1) return "נמוכה"; // נמוכה × נמוך
    
    return "בינונית"; // default
  };

  // Watch for changes in severity and damage potential to auto-calculate tech risk
  const watchedSeverity = form.watch("severity");
  const watchedDamagePotential = form.watch("damage_potential");
  
  React.useEffect(() => {
    const newTechRisk = calculateTechRiskLevel(watchedSeverity, watchedDamagePotential);
    form.setValue("tech_risk_level", newTechRisk as any);
  }, [watchedSeverity, watchedDamagePotential, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const insertData = {
        category_id: values.category_id,
        subject: values.subject,
        test_description: values.test_description,
        severity: values.severity,
        damage_potential: values.damage_potential,
        tech_risk_level: values.tech_risk_level,
        test_findings: values.test_findings,
        exposure_description: values.exposure_description,
        recommendations: values.recommendations || "",
        created_by: user.id,
      };

      const { error } = await supabase
        .from("findings_templates")
        .insert(insertData);

      if (error) throw error;

      toast({
        title: "תבנית נוספה בהצלחה",
        description: "התבנית החדשה נוספה למערכת",
      });

      form.reset();
      onSuccess();
    } catch (error) {
      console.error("Error adding template:", error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בהוספת התבנית",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto" 
        dir="rtl"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>הוספת תבנית ממצא חדשה</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>קטגוריה</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="בחר קטגוריה" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>הנושא הנבחן</FormLabel>
                  <FormControl>
                    <Input placeholder="הזן את הנושא הנבחן" {...field} />
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
                    <Input
                      placeholder="תאר את הבדיקה שבוצעה"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="severity"
                render={({ field }) => (
                  <FormItem className="text-right">
                    <FormLabel className="text-right">סבירות</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="text-right">
                          <SelectValue placeholder="בחר סבירות" />
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
                    <FormLabel className="text-right">פוטנציאל הנזק</FormLabel>
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
                    <FormLabel className="text-right">רמת הסיכון הטכנולוגית (חישוב אוטומטי)</FormLabel>
                    <FormControl>
                      <Input 
                        value={field.value} 
                        readOnly 
                        className="bg-muted text-right" 
                        placeholder="יחושב אוטומטית" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="test_findings"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ממצאי הבדיקה</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="תאר את ממצאי הבדיקה"
                      className="min-h-[120px]"
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
                      className="min-h-[120px]"
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
                      placeholder="רשום המלצות לתיקון הבעיה"
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                ביטול
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "מוסיף..." : "הוסף תבנית"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}