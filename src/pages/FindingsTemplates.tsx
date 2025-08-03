import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, FileText, FolderPlus, Copy, Shield, Database, User, Lock, Wifi, MessageSquare, AlertTriangle, Settings, Network, Server, Globe, Building } from "lucide-react";
import { AddFindingTemplateDialog } from "@/components/AddFindingTemplateDialog";
import { AddFindingCategoryDialog } from "@/components/AddFindingCategoryDialog";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface FindingCategory {
  id: string;
  name: string;
  display_name: string;
  description: string;
  order_index?: number;
}

interface SortableCategoryProps {
  category: FindingCategory;
  onSelect: (categoryId: string) => void;
  onDelete?: (categoryId: string) => void;
  isAdmin: boolean;
}

function SortableCategory({ category, onSelect, onDelete, isAdmin }: SortableCategoryProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Only trigger select if we're not dragging
    if (!isDragging) {
      onSelect(category.id);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    if (onDelete) {
      onDelete(category.id);
    }
  };

  const IconComponent = getCategoryIcon(category.name);

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="cursor-pointer hover:shadow-lg transition-shadow relative"
      onClick={handleCardClick}
    >
      {/* Drag handle - separate from main card content */}
      <div 
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 w-6 h-6 cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none' }}
      >
        <div className="w-full h-full bg-muted rounded flex items-center justify-center">
          <div className="w-3 h-3 bg-muted-foreground/30 rounded-sm"></div>
        </div>
      </div>

      <CardHeader className="pr-10">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconComponent className="h-5 w-5" />
            {category.display_name}
          </div>
          {isAdmin && onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteClick}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              ×
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{category.description}</p>
      </CardContent>
    </Card>
  );
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
  recommendations?: string;
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

const getCategoryIcon = (categoryName: string) => {
  switch (categoryName) {
    case 'system_description':
      return Building;
    case 'architecture':
      return Network;
    case 'authentication':
      return Lock;
    case 'permissions':
      return User;
    case 'interfaces':
      return Wifi;
    case 'alerts':
      return MessageSquare;
    case 'error_messages':
      return AlertTriangle;
    case 'session_management':
      return Settings;
    case 'input_validation':
      return Shield;
    case 'database':
      return Database;
    case 'environments':
      return Server;
    case 'traffic_medium':
      return Globe;
    default:
      return FileText;
  }
};

export default function FindingsTemplates() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [addTemplateDialogOpen, setAddTemplateDialogOpen] = useState(false);
  const [addCategoryDialogOpen, setAddCategoryDialogOpen] = useState(false);
  const [categoriesOrder, setCategoriesOrder] = useState<FindingCategory[]>([]);
  const { profile } = useAuth();
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "הועתק בהצלחה",
        description: `${fieldName} הועתק ללוח`,
      });
    });
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm("האם אתה בטוח שברצונך למחוק את הקטגוריה? פעולה זו תמחק גם את כל התבניות בקטגוריה.")) {
      return;
    }

    try {
      // First delete all templates in this category
      await supabase
        .from("findings_templates")
        .delete()
        .eq("category_id", categoryId);

      // Then delete the category
      const { error } = await supabase
        .from("findings_categories")
        .delete()
        .eq("id", categoryId);

      if (error) throw error;

      toast({
        title: "קטגוריה נמחקה בהצלחה",
        description: "הקטגוריה וכל התבניות שלה נמחקו מהמערכת",
      });

      refetchCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה במחיקת הקטגוריה",
        variant: "destructive",
      });
    }
  };

  const isAdmin = profile?.role === "admin";

  const { data: categories = [], refetch: refetchCategories } = useQuery({
    queryKey: ["findings-categories"],
    queryFn: async () => {
      console.log("Fetching categories...");
      const { data, error } = await supabase
        .from("findings_categories")
        .select("*")
        .order("order_index", { ascending: true })
        .order("display_name", { ascending: true });
      
      if (error) {
        console.error("Error fetching categories:", error);
        throw error;
      }
      console.log("Categories fetched:", data);
      return data as FindingCategory[];
    },
  });

  useEffect(() => {
    console.log("Categories updated:", categories);
    setCategoriesOrder(categories);
  }, [categories]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    console.log("Drag ended:", { active: active.id, over: over?.id });

    if (over && active.id !== over.id) {
      console.log("Order change detected, updating...");
      
      const oldIndex = categoriesOrder.findIndex((item) => item.id === active.id);
      const newIndex = categoriesOrder.findIndex((item) => item.id === over.id);
      
      console.log("Moving from index", oldIndex, "to", newIndex);
      
      const newCategoriesOrder = arrayMove(categoriesOrder, oldIndex, newIndex);
      console.log("New order:", newCategoriesOrder.map(c => ({ id: c.id, name: c.display_name })));

      setCategoriesOrder(newCategoriesOrder);

      // Save new order to database
      try {
        console.log("Saving order to database...");
        
        // Update each category with its new order_index
        const updatePromises = newCategoriesOrder.map(async (category, index) => {
          console.log(`Updating category ${category.display_name} to order_index ${index}`);
          const { error } = await supabase
            .from("findings_categories")
            .update({ order_index: index })
            .eq("id", category.id);
          
          if (error) {
            console.error(`Error updating category ${category.id}:`, error);
            throw error;
          }
          return { success: true, id: category.id, index };
        });

        await Promise.all(updatePromises);
        console.log("All categories updated successfully");

        toast({
          title: "סדר הקטגוריות נשמר",
          description: "הסדר החדש נשמר במערכת",
        });

        // Refetch to ensure consistency
        refetchCategories();
        
      } catch (error) {
        console.error("Error saving category order:", error);
        toast({
          title: "שגיאה",
          description: "אירעה שגיאה בשמירת הסדר",
          variant: "destructive",
        });
        // Revert to original order on error
        setCategoriesOrder(categories);
      }
    }
  };
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

  const selectedCategoryData = categoriesOrder.find(cat => cat.id === selectedCategory);

  return (
    <Layout>
      <div className="min-h-screen bg-background p-6" dir="rtl">
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
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              תוכל לגרור ולשחרר קטגוריות כדי לסדר אותן לפי הצורך
              {isAdmin && " • לחיצה על × תמחק את הקטגוריה"}
            </p>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={categoriesOrder.map(cat => cat.id)} strategy={verticalListSortingStrategy}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categoriesOrder.map((category) => (
                    <SortableCategory
                      key={category.id}
                      category={category}
                      onSelect={setSelectedCategory}
                      onDelete={isAdmin ? handleDeleteCategory : undefined}
                      isAdmin={isAdmin}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        ) : (
          <div dir="rtl">
            <div className="flex items-center gap-4 mb-6">
              <Button 
                variant="default" 
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
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => copyToClipboard(template.subject, "נושא הממצא")}
                        className="h-8 w-8 p-0"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
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

                    {/* המלצות */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">המלצות:</h4>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => copyToClipboard((template as any).recommendations || "אין המלצות", "המלצות")}
                          className="h-8 w-8 p-0"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-muted-foreground whitespace-pre-wrap">
                        {(template as any).recommendations || "אין המלצות מוגדרות"}
                      </p>
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
    </Layout>
  );
}