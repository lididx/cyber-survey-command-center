import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMutation } from "@tanstack/react-query";

interface CVECategory {
  id: string;
  name: string;
  display_name: string;
  description: string;
}

interface CVESystem {
  id: string;
  category_id: string;
  name: string;
  url: string;
  created_at: string;
}

interface EditCVESystemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  system: CVESystem | null;
  categories: CVECategory[];
  onSuccess: () => void;
}

const EditCVESystemDialog = ({
  open,
  onOpenChange,
  system,
  categories,
  onSuccess,
}: EditCVESystemDialogProps) => {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (system) {
      setName(system.name);
      setUrl(system.url);
      setCategoryId(system.category_id);
    }
  }, [system]);

  const updateSystemMutation = useMutation({
    mutationFn: async (data: { name: string; url: string; category_id: string }) => {
      if (!system) throw new Error("No system selected");
      
      const { error } = await supabase
        .from("cve_systems")
        .update({
          name: data.name,
          url: data.url,
          category_id: data.category_id,
        })
        .eq("id", system.id);

      if (error) throw error;
    },
    onSuccess: () => {
      onSuccess();
      handleClose();
      toast({
        title: "הצלחה",
        description: "המערכת עודכנה בהצלחה",
      });
    },
    onError: (error) => {
      console.error("Error updating CVE system:", error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעת עדכון המערכת",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !url.trim() || !categoryId) {
      toast({
        title: "שגיאה",
        description: "יש למלא את כל השדות החובה",
        variant: "destructive",
      });
      return;
    }

    updateSystemMutation.mutate({
      name: name.trim(),
      url: url.trim(),
      category_id: categoryId,
    });
  };

  const handleClose = () => {
    setName("");
    setUrl("");
    setCategoryId("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>עריכת מערכת CVE</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">שם המערכת *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="לדוגמא: SQLite"
              required
              dir="rtl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">קישור CVE *</Label>
            <Input
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              required
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">קטגוריה *</Label>
            <Select value={categoryId} onValueChange={setCategoryId} required>
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

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              ביטול
            </Button>
            <Button 
              type="submit" 
              disabled={updateSystemMutation.isPending}
            >
              {updateSystemMutation.isPending ? "מעדכן..." : "עדכן"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditCVESystemDialog;