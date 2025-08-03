import React, { useState } from "react";
import Layout from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Search, ExternalLink, FolderPlus, Edit, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import AddCVESystemDialog from "@/components/AddCVESystemDialog";
import AddCVECategoryDialog from "@/components/AddCVECategoryDialog";
import EditCVESystemDialog from "@/components/EditCVESystemDialog";
import { useAuth } from "@/hooks/useAuth";

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

const CVE = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addCategoryDialogOpen, setAddCategoryDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSystem, setEditingSystem] = useState<CVESystem | null>(null);
  const { toast } = useToast();
  const { profile } = useAuth();

  const { data: categories, isLoading: categoriesLoading, refetch: refetchCategories } = useQuery({
    queryKey: ["cve-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cve_categories")
        .select("*")
        .order("display_name");
      
      if (error) throw error;
      return data as CVECategory[];
    },
  });

  const { data: systems, isLoading: systemsLoading, refetch: refetchSystems } = useQuery({
    queryKey: ["cve-systems"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cve_systems")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data as CVESystem[];
    },
  });

  const filteredSystems = systems?.filter(system => {
    const matchesSearch = system.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory ? system.category_id === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  const getSystemsByCategory = (categoryId: string) => {
    return filteredSystems?.filter(system => system.category_id === categoryId) || [];
  };

  const handleAddSuccess = () => {
    refetchSystems();
    toast({
      title: "הצלחה",
      description: "המערכת נוספה בהצלחה למאגר ה-CVE",
    });
  };

  const handleAddCategorySuccess = () => {
    refetchCategories();
    toast({
      title: "הצלחה",
      description: "הקטגוריה נוספה בהצלחה למאגר ה-CVE",
    });
  };

  const handleDeleteSystem = async (systemId: string) => {
    if (!confirm("האם אתה בטוח שברצונך למחוק את המערכת?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("cve_systems")
        .delete()
        .eq("id", systemId);

      if (error) throw error;

      refetchSystems();
      toast({
        title: "הצלחה",
        description: "המערכת נמחקה בהצלחה",
      });
    } catch (error) {
      console.error("Error deleting CVE system:", error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה במחיקת המערכת",
        variant: "destructive",
      });
    }
  };

  const handleEditSystem = (system: CVESystem) => {
    setEditingSystem(system);
    setEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    refetchSystems();
    toast({
      title: "הצלחה",
      description: "המערכת עודכנה בהצלחה",
    });
  };

  if (categoriesLoading || systemsLoading) {
    return (
      <Layout>
        <div className="container mx-auto p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-10 bg-muted rounded"></div>
            <div className="grid grid-cols-1 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-foreground">מאגר CVE</h1>
            <div className="flex gap-2">
              <Button 
                onClick={() => setEditMode(!editMode)} 
                variant={editMode ? "destructive" : "outline"} 
                className="gap-2"
              >
                {editMode ? (
                  <>
                    <X className="h-4 w-4" />
                    בטל עריכה
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4" />
                    עריכה
                  </>
                )}
              </Button>
              <Button onClick={() => setAddCategoryDialogOpen(true)} variant="outline" className="gap-2">
                <FolderPlus className="h-4 w-4" />
                הוספת קטגוריה
              </Button>
              <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                הוספת מערכת חדשה
              </Button>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="חיפוש מערכת או שירות..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
              dir="rtl"
            />
          </div>

          {/* Category Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              הכל
            </Button>
            {categories?.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.display_name}
              </Button>
            ))}
          </div>
        </div>

        {/* CVE Categories and Systems */}
        <div className="grid grid-cols-1 gap-6">
          {categories?.map((category) => {
            const categorySystems = getSystemsByCategory(category.id);
            
            if (selectedCategory && selectedCategory !== category.id) return null;
            if (searchTerm && categorySystems.length === 0) return null;
            
            return (
              <Card key={category.id} className="border-border">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xl text-foreground">
                      {category.display_name}
                    </CardTitle>
                    <Badge variant="secondary" className="text-sm">
                      {categorySystems.length} מערכות
                    </Badge>
                  </div>
                  {category.description && (
                    <p className="text-muted-foreground text-sm">{category.description}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {categorySystems.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      לא נמצאו מערכות בקטגוריה זו
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {categorySystems.map((system) => (
                        <div
                          key={system.id}
                          className="p-3 rounded-lg border border-border hover:border-primary/50 transition-colors group"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <a
                              href={system.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-foreground text-sm leading-tight hover:text-primary transition-colors cursor-pointer flex-1"
                              title="לחץ לפתיחת הקישור"
                            >
                              {system.name}
                            </a>
                            <div className="flex gap-1">
                              {editMode && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleEditSystem(system);
                                    }}
                                    className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 h-6 w-6 p-0"
                                    title="ערוך מערכת"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleDeleteSystem(system.id);
                                    }}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-6 w-6 p-0"
                                    title="מחק מערכת"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                              <a
                                href={system.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
                                title="פתח קישור CVE"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* No Results */}
        {searchTerm && filteredSystems?.length === 0 && (
          <Card className="border-border">
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                לא נמצאו תוצאות עבור "{searchTerm}"
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <AddCVESystemDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        categories={categories || []}
        onSuccess={handleAddSuccess}
      />

      <AddCVECategoryDialog
        open={addCategoryDialogOpen}
        onOpenChange={setAddCategoryDialogOpen}
        onSuccess={handleAddCategorySuccess}
      />

      <EditCVESystemDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        system={editingSystem}
        categories={categories || []}
        onSuccess={handleEditSuccess}
      />
    </Layout>
  );
};

export default CVE;