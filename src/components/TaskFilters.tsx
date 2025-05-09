
import { useState, useEffect } from "react";
import { useTaskContext } from "@/context/TaskContext";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskStatus } from "@/types/task";
import { Search, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface TaskFiltersProps {
  onFilterChange: (tagId: string) => void;
  onSearchChange: (query: string) => void;
  onStatusFilterChange: (status: TaskStatus | "all") => void;
  onAiPrioritizedChange: (enabled: boolean) => void;
  currentFilter: string;
  currentStatus: TaskStatus | "all";
  aiPrioritized: boolean;
}

export const TaskFilters: React.FC<TaskFiltersProps> = ({
  onFilterChange,
  onSearchChange,
  onStatusFilterChange,
  onAiPrioritizedChange,
  currentFilter,
  currentStatus,
  aiPrioritized,
}) => {
  const { tags } = useTaskContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, onSearchChange]);

  const handleFilterClick = (tagId: string) => {
    onFilterChange(currentFilter === tagId ? "" : tagId);
  };

  const handleStatusChange = (status: string) => {
    onStatusFilterChange(status as TaskStatus | "all");
  };

  const toggleAiPrioritized = () => {
    onAiPrioritizedChange(!aiPrioritized);
  };
  
  const clearSearch = () => {
    setSearchQuery("");
    onSearchChange("");
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tasks..."
          className="pl-9 pr-9 w-full rounded-full bg-background border-border/50 focus-visible:ring-task-purple"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <Button
            variant="ghost" 
            size="icon"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 rounded-full p-0"
            onClick={clearSearch}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <div className="flex gap-2 items-center">
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
          <div className="flex gap-2">
            <CollapsibleTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "rounded-full border-border/50",
                  (currentFilter || currentStatus !== "all") && "border-task-purple text-task-purple"
                )}
              >
                <Filter className="h-3.5 w-3.5 mr-1.5" />
                {isOpen ? "Hide Filters" : "Filters"}
              </Button>
            </CollapsibleTrigger>
            
            {currentFilter && (
              <Badge 
                className="bg-task-purple shadow-sm flex items-center gap-1 px-3"
                onClick={() => onFilterChange("")}
              >
                {tags.find(tag => tag.id === currentFilter)?.name}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            )}
            
            {currentStatus !== "all" && (
              <Badge 
                className="bg-task-purple shadow-sm flex items-center gap-1 px-3"
                onClick={() => onStatusFilterChange("all")}
              >
                {currentStatus}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            )}
          </div>

          <CollapsibleContent className="mt-3 space-y-3 animate-scale-in">
            <div>
              <h4 className="text-sm font-medium mb-2 text-muted-foreground">Filter by status</h4>
              <Tabs
                value={currentStatus}
                onValueChange={handleStatusChange}
                className="w-full"
              >
                <TabsList className="grid grid-cols-4 w-full rounded-full h-9 bg-muted/50 p-1">
                  <TabsTrigger value="all" className="rounded-full text-xs">All</TabsTrigger>
                  <TabsTrigger value="pending" className="rounded-full text-xs">Pending</TabsTrigger>
                  <TabsTrigger value="in-progress" className="rounded-full text-xs">In Progress</TabsTrigger>
                  <TabsTrigger value="completed" className="rounded-full text-xs">Completed</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2 text-muted-foreground">Filter by tag</h4>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    style={{
                      backgroundColor: currentFilter === tag.id ? tag.color : "transparent",
                      color: currentFilter === tag.id ? "white" : tag.color,
                      borderColor: tag.color,
                    }}
                    variant={currentFilter === tag.id ? "default" : "outline"}
                    className="cursor-pointer hover:opacity-80 shadow-sm"
                    onClick={() => handleFilterClick(tag.id)}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};
