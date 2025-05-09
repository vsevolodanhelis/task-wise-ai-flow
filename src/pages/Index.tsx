
import { useState } from "react";
import { TaskProvider } from "@/context/TaskContext";
import { TaskList } from "@/components/TaskList";
import { TaskFilters } from "@/components/TaskFilters";
import { TaskForm } from "@/components/TaskForm";
import { TaskAnalytics } from "@/components/TaskAnalytics";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, LayoutDashboard, List, Calendar, Settings } from "lucide-react";
import { TaskStatus } from "@/types/task";
import { useIsMobile } from "@/hooks/use-mobile";

const Dashboard = () => {
  const [showAddTask, setShowAddTask] = useState(false);
  const [currentFilter, setCurrentFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [showAiPrioritized, setShowAiPrioritized] = useState(false);
  const [activeView, setActiveView] = useState<"tasks" | "analytics">("tasks");
  const isMobile = useIsMobile();

  const handleAddTask = () => {
    setShowAddTask(true);
  };

  const handleAddTaskComplete = () => {
    setShowAddTask(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-foreground flex items-center">
              <span className="text-task-purple">Task</span>
              <span>AI</span>
            </h1>
            <span className="ml-2 bg-task-purple px-2 py-0.5 text-xs text-white rounded-full">
              Beta
            </span>
          </div>
          <Button
            className="bg-task-purple hover:bg-task-purple-dark"
            onClick={handleAddTask}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="w-full lg:w-64 flex flex-row lg:flex-col space-x-2 lg:space-x-0 lg:space-y-2 overflow-x-auto lg:overflow-x-visible">
            <Button
              variant={activeView === "tasks" ? "default" : "outline"}
              className={`flex justify-start w-full ${
                activeView === "tasks" ? "bg-task-purple hover:bg-task-purple-dark" : ""
              }`}
              onClick={() => setActiveView("tasks")}
            >
              <List className="mr-2 h-4 w-4" />
              Tasks
            </Button>
            <Button
              variant={activeView === "analytics" ? "default" : "outline"}
              className={`flex justify-start w-full ${
                activeView === "analytics" ? "bg-task-purple hover:bg-task-purple-dark" : ""
              }`}
              onClick={() => setActiveView("analytics")}
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Analytics
            </Button>
            {!isMobile && (
              <>
                <Button variant="outline" className="flex justify-start w-full" disabled>
                  <Calendar className="mr-2 h-4 w-4" />
                  Calendar (Coming Soon)
                </Button>
                <Button variant="outline" className="flex justify-start w-full" disabled>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings (Coming Soon)
                </Button>
              </>
            )}

            {!isMobile && (
              <div className="mt-6 p-4 bg-accent/50 rounded-lg">
                <h3 className="font-medium mb-2">AI Assistant</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  TaskAI helps you prioritize tasks based on deadlines, importance, and your work habits.
                </p>
                <Button
                  variant={showAiPrioritized ? "default" : "outline"}
                  className={`w-full ${
                    showAiPrioritized ? "bg-task-purple hover:bg-task-purple-dark" : ""
                  }`}
                  onClick={() => setShowAiPrioritized(!showAiPrioritized)}
                >
                  {showAiPrioritized ? "Hide AI Priorities" : "Show AI Priorities"}
                </Button>
              </div>
            )}
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
