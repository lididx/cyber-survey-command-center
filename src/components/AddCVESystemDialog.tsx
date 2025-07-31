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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMutation } from "@tanstack/react-query";

interface CVECategory {
  id: string;
  name: string;
  display_name: string;
  description: string;
}

interface AddCVESystemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CVECategory[];
  onSuccess: () => void;
}

const AddCVESystemDialog = ({
  open,
  onOpenChange,
  categories,
  onSuccess,
}: AddCVESystemDialogProps) => {
  const [systemName, setSystemName] = useState("");
  const [systemUrl, setSystemUrl] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const { toast } = useToast();

  const addSystemMutation = useMutation({
    mutationFn: async (data: { name: string; url: string; category_id: string }) => {
      const { error } = await supabase
        .from("cve_systems")
        .insert({
          name: data.name,
          url: data.url,
          category_id: data.category_id,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      onSuccess();
      handleClose();
      toast({
        title: "הצלחה",
        description: "המערכת נוספה בהצלחה",
      });
    },
    onError: (error) => {
      console.error("Error adding CVE system:", error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעת הוספת המערכת",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!systemName.trim() || !systemUrl.trim() || !selectedCategory) {
      toast({
        title: "שגיאה",
        description: "יש למלא את כל השדות",
        variant: "destructive",
      });
      return;
    }

    // Validate URL format
    try {
      new URL(systemUrl);
    } catch {
      toast({
        title: "שגיאה",
        description: "יש להזין כתובת URL תקינה",
        variant: "destructive",
      });
      return;
    }

    addSystemMutation.mutate({
      name: systemName.trim(),
      url: systemUrl.trim(),
      category_id: selectedCategory,
    });
  };

  const handleClose = () => {
    setSystemName("");
    setSystemUrl("");
    setSelectedCategory("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>הוספת מערכת CVE חדשה</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">קטגוריה</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="בחר קטגוריה" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="systemName">שם המערכת/שירות</Label>
            <Input
              id="systemName"
              value={systemName}
              onChange={(e) => setSystemName(e.target.value)}
              placeholder="לדוגמא: Apache HTTP Server"
              required
              dir="rtl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="systemUrl">קישור CVE</Label>
            <Input
              id="systemUrl"
              type="url"
              value={systemUrl}
              onChange={(e) => setSystemUrl(e.target.value)}
              placeholder="https://www.cvedetails.com/..."
              required
              dir="ltr"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              ביטול
            </Button>
            <Button 
              type="submit" 
              disabled={addSystemMutation.isPending}
            >
              {addSystemMutation.isPending ? "מוסיף..." : "הוספה"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCVESystemDialog;