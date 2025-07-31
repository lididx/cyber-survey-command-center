import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Filter } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Filters {
  dateFrom: Date | null;
  dateTo: Date | null;
  client: string;
  status: string;
  searchTerm: string;
}

interface StatisticsFiltersProps {
  filters: Filters;
  setFilters: (filters: Filters) => void;
  uniqueClients: string[];
  statusLabels: Record<string, string>;
}

const StatisticsFilters = ({ filters, setFilters, uniqueClients, statusLabels }: StatisticsFiltersProps) => {
  const updateFilter = (key: keyof Filters, value: any) => {
    setFilters({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: null,
      dateTo: null,
      client: "all",
      status: "all",
      searchTerm: ""
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          סינון מהיר
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Search */}
          <div className="space-y-2">
            <label className="text-sm font-medium">חיפוש טקסט</label>
            <Input
              placeholder="חיפוש לפי שם מערכת..."
              value={filters.searchTerm}
              onChange={(e) => updateFilter('searchTerm', e.target.value)}
            />
          </div>

          {/* Date From */}
          <div className="space-y-2">
            <label className="text-sm font-medium">מתאריך</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filters.dateFrom && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateFrom ? (
                    format(filters.dateFrom, "PPP", { locale: he })
                  ) : (
                    "בחר תאריך"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.dateFrom || undefined}
                  onSelect={(date) => updateFilter('dateFrom', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Date To */}
          <div className="space-y-2">
            <label className="text-sm font-medium">עד תאריך</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filters.dateTo && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateTo ? (
                    format(filters.dateTo, "PPP", { locale: he })
                  ) : (
                    "בחר תאריך"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.dateTo || undefined}
                  onSelect={(date) => updateFilter('dateTo', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Client */}
          <div className="space-y-2">
            <label className="text-sm font-medium">לקוח</label>
            <Select value={filters.client} onValueChange={(value) => updateFilter('client', value)}>
              <SelectTrigger>
                <SelectValue placeholder="בחר לקוח" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הלקוחות</SelectItem>
                {uniqueClients.map(client => (
                  <SelectItem key={client} value={client}>{client}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium">סטטוס</label>
            <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="בחר סטטוס" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הסטטוסים</SelectItem>
                {Object.entries(statusLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Clear Filters */}
          <div className="space-y-2">
            <label className="text-sm font-medium">&nbsp;</label>
            <Button variant="outline" onClick={clearFilters} className="w-full">
              נקה סינונים
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatisticsFilters;