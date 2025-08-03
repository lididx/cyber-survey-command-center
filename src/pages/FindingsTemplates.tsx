import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, FileText, FolderPlus, Copy } from "lucide-react";
import { AddFindingTemplateDialog } from "@/components/AddFindingTemplateDialog";
import { AddFindingCategoryDialog } from "@/components/AddFindingCategoryDialog";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface FindingCategory {
  id: string;
  name: string;
  display_name: string;
  description: string;
}

interface FindingTemplate {
  id: string;
  category_id: string;
  subject: string;
  test_description: string;
  severity: string;
  damage_potential: string;
  tech_risk_level: string;
  test_findings: string;
  exposure_description: string;
  created_at: string;
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'קריטית':
    case 'קריטי':
      return 'bg-purple-500';
    case 'גבוהה':
    case 'גבוה':
      return 'bg-red-500';
    case 'בינונית':
    case 'בינוני':
      return 'bg-orange-500';
    case 'נמוכה':
    case 'נמוך':
      return 'bg-cyan-500';
    default:
      return 'bg-gray-500';
  }
};

export default function FindingsTemplates() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [addTemplateDialogOpen, setAddTemplateDialogOpen] = useState(false);
  const [addCategoryDialogOpen, setAddCategoryDialogOpen] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "הועתק בהצלחה",
        description: `${fieldName} הועתק ללוח`,
      });
    });
  };

  const { data: categories = [], refetch: refetchCategories } = useQuery({
    queryKey: ["findings-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("findings_categories")
        .select("*")
        .order("display_name");
      
      if (error) throw error;
      return data as FindingCategory[];
    },
  });

  const { data: templates = [], refetch: refetchTemplates } = useQuery({
    queryKey: ["findings-templates", selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from("findings_templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (selectedCategory) {
        query = query.eq("category_id", selectedCategory);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as FindingTemplate[];
    },
    enabled: !!selectedCategory,
  });

  const filteredTemplates = templates.filter(template =>
    template.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.test_description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);

  return (
    <div className="min-h-screen bg-background p-6 rtl">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-foreground">תבניות ממצאים</h1>
            <div className="flex gap-2">
              <Button onClick={() => setAddCategoryDialogOpen(true)} variant="outline" className="gap-2">
                <FolderPlus className="h-4 w-4" />
                הוספת קטגוריה
              </Button>
              {selectedCategory && (
                <Button onClick={() => setAddTemplateDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  הוספת תבנית חדשה
                </Button>
              )}
            </div>
          </div>
          
          <div className="relative mb-6">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="חיפוש בתבניות..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
        </div>

        {!selectedCategory ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <Card
                key={category.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedCategory(category.id)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {category.display_name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{category.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-4 mb-6">
              <Button 
                variant="outline" 
                onClick={() => setSelectedCategory(null)}
              >
                ← חזרה לקטגוריות
              </Button>
              <h2 className="text-2xl font-semibold">{selectedCategoryData?.display_name}</h2>
            </div>

            <div className="grid gap-6">
              {filteredTemplates.map((template) => (
                <Card key={template.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{template.subject}</span>
                      <div className="flex gap-2">
                        <Badge className={`${getSeverityColor(template.severity)} text-white`}>
                          {template.severity}
                        </Badge>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">תיאור הבדיקה:</h4>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => copyToClipboard(template.test_description, "תיאור הבדיקה")}
                          className="h-8 w-8 p-0"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-muted-foreground">{template.test_description}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <span className="font-medium">סבירות: </span>
                        <Badge className={`${getSeverityColor(template.severity)} text-white`}>
                          {template.severity}
                        </Badge>
                      </div>
                      <div>
                        <span className="font-medium">פוטנציאל נזק: </span>
                        <Badge className={`${getSeverityColor(template.damage_potential)} text-white`}>
                          {template.damage_potential}
                        </Badge>
                      </div>
                      <div>
                        <span className="font-medium">רמת סיכון טכנולוגית: </span>
                        <Badge className={`${getSeverityColor(template.tech_risk_level)} text-white`}>
                          {template.tech_risk_level}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">ממצאי הבדיקה:</h4>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => copyToClipboard(template.test_findings, "ממצאי הבדיקה")}
                          className="h-8 w-8 p-0"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-muted-foreground whitespace-pre-wrap">{template.test_findings}</p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">תיאור החשיפה / הסיכונים:</h4>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => copyToClipboard(template.exposure_description, "תיאור החשיפה / הסיכונים")}
                          className="h-8 w-8 p-0"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-muted-foreground whitespace-pre-wrap">{template.exposure_description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredTemplates.length === 0 && selectedCategory && (
                <Card>
                  <CardContent className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {searchTerm ? "לא נמצאו תבניות התואמות לחיפוש" : "אין תבניות בקטגוריה זו"}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>

      <AddFindingTemplateDialog
        open={addTemplateDialogOpen}
        onOpenChange={setAddTemplateDialogOpen}
        categoryId={selectedCategory || ""}
        categories={categories}
        onSuccess={() => {
          refetchTemplates();
          setAddTemplateDialogOpen(false);
        }}
      />

      <AddFindingCategoryDialog
        open={addCategoryDialogOpen}
        onOpenChange={setAddCategoryDialogOpen}
        onSuccess={() => {
          refetchCategories();
          setAddCategoryDialogOpen(false);
        }}
      />
    </div>
  );
}