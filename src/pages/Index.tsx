
import { useState } from "react";
import { TaskProvider } from "@/context/TaskContext";
import { TaskList } from "@/components/TaskList";
import { TaskFilters } from "@/components/TaskFilters";
import { TaskForm } from "@/components/TaskForm";
import { TaskAnalytics } from "@/components/TaskAnalytics";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, LayoutDashboard, List, Calendar, Settings, Sparkles } from "lucide-react";
import { TaskStatus } from "@/types/task";
import { useIsMobile } from "@/hooks/use-mobile";

const Dashboard = () => {
  const [showAddTask, setShowAddTask] = useState(false);
  const [currentFilter, setCurrentFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [showAiPrioritized, setShowAiPrioritized] = useState(false);
  const [activeView, setActiveView] = useState<"tasks" | "analytics">("tasks");

  const handleAddTask = () => {
    setShowAddTask(true);
  };

  const handleAddTaskComplete = () => {
    setShowAddTask(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-foreground flex items-center">
              <span className="text-task-purple">Kai</span>
              <span>ro</span>
              <Sparkles className="ml-1 h-4 w-4 text-task-yellow" />
            </h1>
            <span className="ml-2 bg-gradient-to-r from-task-purple to-task-purple-dark px-2 py-0.5 text-xs text-white rounded-full">
              Beta
            </span>
          </div>
          <Button
            className="bg-gradient-to-r from-task-purple to-task-purple-dark hover:bg-task-purple-dark transition-all shadow-md hover:shadow-lg"
            onClick={handleAddTask}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col gap-6">
          {/* Mobile Tabs */}
          <div className="w-full flex overflow-x-auto no-scrollbar space-x-2 pb-2">
            <Button
              variant={activeView === "tasks" ? "default" : "outline"}
              className={`flex justify-start whitespace-nowrap ${
                activeView === "tasks" ? "bg-task-purple hover:bg-task-purple-dark" : ""
              }`}
              onClick={() => setActiveView("tasks")}
            >
              <List className="mr-2 h-4 w-4" />
              Tasks
            </Button>
            <Button
              variant={activeView === "analytics" ? "default" : "outline"}
              className={`flex justify-start whitespace-nowrap ${
                activeView === "analytics" ? "bg-task-purple hover:bg-task-purple-dark" : ""
              }`}
              onClick={() => setActiveView("analytics")}
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Analytics
            </Button>
            <Button 
              variant="outline" 
              className="flex justify-start whitespace-nowrap" 
              disabled
            >
              <Calendar className="mr-2 h-4 w-4" />
              Calendar
            </Button>
            <Button 
              variant={showAiPrioritized ? "default" : "outline"}
              className={`flex justify-start whitespace-nowrap ${
                showAiPrioritized ? "bg-task-purple hover:bg-task-purple-dark" : ""
              }`}
              onClick={() => setShowAiPrioritized(!showAiPrioritized)}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              AI Priority
            </Button>
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Filters bar */}
            <TaskFilters
              onFilterChange={setCurrentFilter}
              onSearchChange={setSearchQuery}
              onStatusFilterChange={setStatusFilter}
              onAiPrioritizedChange={setShowAiPrioritized}
              currentFilter={currentFilter}
              currentStatus={statusFilter}
              aiPrioritized={showAiPrioritized}
            />

            {/* Main view */}
            <div className="mt-6">
              {activeView === "tasks" ? (
                <TaskList
                  filter={currentFilter}
                  searchQuery={searchQuery}
                  statusFilter={statusFilter}
                  showAiPrioritized={showAiPrioritized}
                />
              ) : (
                <TaskAnalytics />
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showAddTask} onOpenChange={setShowAddTask}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
          </DialogHeader>
          <TaskForm onComplete={handleAddTaskComplete} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Index = () => {
  return (
    <TaskProvider>
      <Dashboard />
    </TaskProvider>
  );
};

export default Index;
