import { useState, useEffect } from "react";
import { Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface FindingTemplate {
  id: string;
  subject: string;
  severity: string;
  category_id: string;
  categories?: {
    display_name: string;
  };
}

interface FindingSearchComboboxProps {
  onSelect: (template: FindingTemplate) => void;
  placeholder?: string;
}

export function FindingSearchCombobox({
  onSelect,
  placeholder = "חפש ממצא קיים במאגר...",
}: FindingSearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<FindingTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("findings_templates")
        .select(`
          id,
          subject,
          severity,
          category_id,
          categories:findings_categories(display_name)
        `)
        .order("subject");

      if (!error && data) {
        setTemplates(data as FindingTemplate[]);
      }
      setLoading(false);
    };

    if (open) {
      fetchTemplates();
    }
  }, [open]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-purple-500";
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-orange-500";
      case "low":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getSeverityLabel = (severity: string) => {
    const labels: Record<string, string> = {
      critical: "קריטית",
      high: "גבוהה",
      medium: "בינונית",
      low: "נמוכה",
    };
    return labels[severity] || severity;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between text-right"
        >
          <Search className="h-4 w-4" />
          {placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[600px] p-0" align="start">
        <Command dir="rtl">
          <CommandInput placeholder="הקלד לחיפוש..." className="text-right" />
          <CommandList>
            <CommandEmpty>
              {loading ? "טוען..." : "לא נמצאו ממצאים"}
            </CommandEmpty>
            <CommandGroup>
              {templates.map((template) => (
                <CommandItem
                  key={template.id}
                  value={template.subject}
                  onSelect={() => {
                    onSelect(template);
                    setOpen(false);
                  }}
                  className="flex items-center gap-2 justify-end text-right cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Badge
                      className={cn(
                        "text-white",
                        getSeverityColor(template.severity)
                      )}
                    >
                      {getSeverityLabel(template.severity)}
                    </Badge>
                    {template.categories && (
                      <span className="text-xs text-muted-foreground">
                        {template.categories.display_name}
                      </span>
                    )}
                  </div>
                  <span className="flex-1">{template.subject}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
