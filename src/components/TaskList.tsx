
import { useState } from "react";
import { useTaskContext } from "@/context/TaskContext";
import { TaskCard } from "@/components/TaskCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TaskForm } from "@/components/TaskForm";
import { Task, TaskStatus } from "@/types/task";
import { useIsMobile } from "@/hooks/use-mobile";

interface TaskListProps {
  filter?: string;
  searchQuery?: string;
  statusFilter?: TaskStatus | "all";
  showAiPrioritized?: boolean;
}

export const TaskList: React.FC<TaskListProps> = ({
  filter,
  searchQuery = "",
  statusFilter = "all",
  showAiPrioritized = false,
}) => {
  const { tasks: allTasks, getAiPrioritizedTasks } = useTaskContext();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const isMobile = useIsMobile();

  const filteredTasks = allTasks.filter((task) => {
    // Tag filter
    if (filter && !task.tags.some((tag) => tag.id === filter)) {
      return false;
    }
    
    // Status filter
    if (statusFilter !== "all" && task.status !== statusFilter) {
      return false;
    }
    
    // Search query
    if (
      searchQuery &&
      !task.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !task.description.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    
    return true;
  });
  
  // Use AI prioritized tasks or regular filtered tasks
  const displayedTasks = showAiPrioritized 
    ? getAiPrioritizedTasks().filter(task => {
        // Apply the same filters to AI prioritized tasks
        if (filter && !task.tags.some((tag) => tag.id === filter)) {
          return false;
        }
        
        if (statusFilter !== "all" && task.status !== statusFilter) {
          return false;
        }
        
        if (
          searchQuery &&
          !task.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !task.description.toLowerCase().includes(searchQuery.toLowerCase())
        ) {
          return false;
        }
        
        return true;
      })
    : filteredTasks;

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  const handleCloseDialog = () => {
    setSelectedTask(null);
  };

  if (displayedTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-medium mb-2">No tasks found</h3>
        <p className="text-muted-foreground">
          {filter
            ? "No tasks with this tag. Try a different filter or create a new task."
            : searchQuery
            ? "No tasks match your search. Try different keywords."
            : "No tasks yet. Create your first task to get started."}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
        {displayedTasks.map((task) => (
          <TaskCard key={task.id} task={task} onClick={() => handleTaskClick(task)} />
        ))}
      </div>

      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          {selectedTask && (
            <TaskForm
              task={selectedTask}
              onComplete={handleCloseDialog}
              isEditMode
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
