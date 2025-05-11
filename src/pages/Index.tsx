
import { useState } from "react";
import { Link } from "react-router-dom";
import { TaskProvider } from "@/context/TaskContext";
import { useAuth } from "@/context/AuthContext";
import { TaskList } from "@/components/TaskList";
import { TaskFilters } from "@/components/TaskFilters";
import { TaskForm } from "@/components/TaskForm";
import { TaskAnalytics } from "@/components/TaskAnalytics";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, LayoutDashboard, List, Calendar, Settings, User, LogOut, Sparkles } from "lucide-react";
import { TaskStatus } from "@/types/task";
import { useIsMobile } from "@/hooks/use-mobile";

const Dashboard = () => {
  const [showAddTask, setShowAddTask] = useState(false);
  const [currentFilter, setCurrentFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [showAiPrioritized, setShowAiPrioritized] = useState(false);
  const [activeView, setActiveView] = useState<"tasks" | "analytics">("tasks");
  const { signOut, user } = useAuth();
  
  const isMobile = useIsMobile();

  const handleAddTask = () => {
    setShowAddTask(true);
  };

  const handleAddTaskComplete = () => {
    setShowAddTask(false);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent/20">
      <header className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b border-border/50 px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-task-purple to-task-purple-dark bg-clip-text text-transparent">
              Kairo
            </h1>
            <span className="ml-2 bg-gradient-to-r from-task-purple to-task-purple-dark px-2 py-0.5 text-xs text-white rounded-full shadow-sm">
              Beta
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!isMobile && (
              <Link to="/profile">
                <Button variant="outline" size="sm" className="mr-2">
                  <User className="mr-1 h-3.5 w-3.5" />
                  Profile
                </Button>
              </Link>
            )}
            <Button
              className="bg-gradient-to-r from-task-purple to-task-purple-dark hover:bg-task-purple-dark transition-all shadow-sm"
              size="sm"
              onClick={handleAddTask}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add Task
            </Button>
          </div>
        </div>
      </header>

      <div className="px-4 py-4">
        <div className="flex flex-col gap-5">
          {/* Mobile Tabs */}
          <div className="w-full flex overflow-x-auto no-scrollbar space-x-2 pb-2">
            <Button
              variant={activeView === "tasks" ? "default" : "outline"}
              className={`flex justify-start whitespace-nowrap rounded-full ${
                activeView === "tasks" ? "bg-task-purple hover:bg-task-purple-dark text-white shadow-sm" : "border-border/50"
              }`}
              size="sm"
              onClick={() => setActiveView("tasks")}
            >
              <List className="mr-1.5 h-3.5 w-3.5" />
              Tasks
            </Button>
            <Button
              variant={activeView === "analytics" ? "default" : "outline"}
              className={`flex justify-start whitespace-nowrap rounded-full ${
                activeView === "analytics" ? "bg-task-purple hover:bg-task-purple-dark text-white shadow-sm" : "border-border/50"
              }`}
              size="sm"
              onClick={() => setActiveView("analytics")}
            >
              <LayoutDashboard className="mr-1.5 h-3.5 w-3.5" />
              Analytics
            </Button>
            <Button 
              variant={showAiPrioritized ? "default" : "outline"}
              className={`flex justify-start whitespace-nowrap rounded-full ${
                showAiPrioritized ? "bg-task-purple hover:bg-task-purple-dark text-white shadow-sm" : "border-border/50"
              }`}
              size="sm"
              onClick={() => setShowAiPrioritized(!showAiPrioritized)}
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              AI Priority
            </Button>
            <Link to="/profile" className="ml-auto">
              <Button 
                variant="outline" 
                className="flex justify-start whitespace-nowrap rounded-full border-border/50" 
                size="sm"
              >
                <User className="mr-1.5 h-3.5 w-3.5" />
                Profile
              </Button>
            </Link>
            <Button 
              variant="outline" 
              className="flex justify-start whitespace-nowrap rounded-full border-border/50" 
              size="sm"
              onClick={handleSignOut}
            >
              <LogOut className="mr-1.5 h-3.5 w-3.5" />
              Sign Out
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
            <div className="mt-4">
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
        <DialogContent className="sm:max-w-[425px] rounded-xl border border-border/70 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-semibold">Add New Task</DialogTitle>
          </DialogHeader>
          <TaskForm onComplete={handleAddTaskComplete} />
        </DialogContent>
      </Dialog>
      
      {/* Mobile Action Button */}
      <div className="fixed bottom-6 right-6">
        <Button 
          onClick={handleAddTask}
          size="icon" 
          className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-task-purple to-task-purple-dark hover:bg-task-purple-dark transition-all"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
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
