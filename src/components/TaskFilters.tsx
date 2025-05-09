
import { useState, useEffect } from "react";
import { useTaskContext } from "@/context/TaskContext";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskStatus } from "@/types/task";
import { Search, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [showFilters, setShowFilters] = useState(false);

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

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            className="pl-9 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          className="sm:w-auto"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
        <Button
          variant={aiPrioritized ? "default" : "outline"}
          className={cn(
            "sm:w-auto",
            aiPrioritized && "bg-task-purple hover:bg-task-purple-dark"
          )}
          onClick={toggleAiPrioritized}
        >
          {aiPrioritized ? "AI Prioritized" : "AI Prioritize"}
        </Button>
      </div>

      {showFilters && (
        <div className="bg-background border rounded-lg p-4 animate-scale-in">
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2">Filter by status</h4>
            <Tabs
              value={currentStatus}
              onValueChange={handleStatusChange}
              className="w-full"
            >
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="in-progress">In Progress</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Filter by tag</h4>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge
                  key={tag.id}
                  style={{
                    backgroundColor:
                      currentFilter === tag.id ? tag.color : "transparent",
                    color: currentFilter === tag.id ? "white" : tag.color,
                    borderColor: tag.color,
                  }}
                  variant={currentFilter === tag.id ? "default" : "outline"}
                  className="cursor-pointer hover:opacity-80"
                  onClick={() => handleFilterClick(tag.id)}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
