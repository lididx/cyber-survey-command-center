import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMutation } from "@tanstack/react-query";

interface AddCVECategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AddCVECategoryDialog = ({
  open,
  onOpenChange,
  onSuccess,
}: AddCVECategoryDialogProps) => {
  const [displayName, setDisplayName] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const { toast } = useToast();

  const addCategoryMutation = useMutation({
    mutationFn: async (data: { name: string; display_name: string; description: string }) => {
      const { error } = await supabase
        .from("cve_categories")
        .insert({
          name: data.name,
          display_name: data.display_name,
          description: data.description,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      onSuccess();
      handleClose();
      toast({
        title: "הצלחה",
        description: "הקטגוריה נוספה בהצלחה",
      });
    },
    onError: (error) => {
      console.error("Error adding CVE category:", error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעת הוספת הקטגוריה",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!displayName.trim() || !name.trim()) {
      toast({
        title: "שגיאה",
        description: "יש למלא את השדות החובה",
        variant: "destructive",
      });
      return;
    }

    // Generate internal name from display name if not provided
    const internalName = name.trim() || displayName.trim().toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^\w_]/g, '');

    addCategoryMutation.mutate({
      name: internalName,
      display_name: displayName.trim(),
      description: description.trim(),
    });
  };

  const handleClose = () => {
    setDisplayName("");
    setName("");
    setDescription("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>הוספת קטגוריית CVE חדשה</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">שם הקטגוריה להצגה *</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="לדוגמא: מערכות הפעלה"
              required
              dir="rtl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">שם פנימי (אנגלית)</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="לדוגמא: operating_systems"
              dir="ltr"
            />
            <p className="text-xs text-muted-foreground">
              אם לא מוזן, יווצר באופן אוטומטי מהשם להצגה
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">תיאור</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="תיאור קצר של הקטגוריה..."
              rows={3}
              dir="rtl"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              ביטול
            </Button>
            <Button 
              type="submit" 
              disabled={addCategoryMutation.isPending}
            >
              {addCategoryMutation.isPending ? "מוסיף..." : "הוספה"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCVECategoryDialog;