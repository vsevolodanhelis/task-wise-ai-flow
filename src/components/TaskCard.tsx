
import { useState } from "react";
import { format } from "date-fns";
import { Task, TaskPriority } from "@/types/task";
import { useTaskContext } from "@/context/TaskContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Check, Clock, Edit, Trash2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
}

const priorityColors: Record<TaskPriority, string> = {
  low: "bg-task-blue text-blue-800",
  medium: "bg-task-yellow text-yellow-800",
  high: "bg-task-orange text-orange-800",
  urgent: "bg-task-red text-red-800",
};

const priorityBorders: Record<TaskPriority, string> = {
  low: "border-l-task-blue",
  medium: "border-l-task-yellow",
  high: "border-l-task-orange",
  urgent: "border-l-task-red",
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, onClick }) => {
  const { toggleTaskStatus, deleteTask } = useTaskContext();
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  const handleToggleStatus = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleTaskStatus(task.id);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) onClick();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteAlert(true);
  };

  const confirmDelete = () => {
    deleteTask(task.id);
    setShowDeleteAlert(false);
  };

  const isCompletedClass = task.status === "completed" ? "opacity-70" : "";
  
  return (
    <>
      <Card 
        className={cn(
          "mb-3 transition-all duration-200 hover:shadow hover:translate-y-[-2px] cursor-pointer animate-fade-in border-l-4 rounded-lg overflow-hidden",
          priorityBorders[task.priority],
          isCompletedClass
        )}
        onClick={onClick}
      >
        <CardContent className="p-4">
          {task.status === "completed" && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-green-400" />
          )}
          
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className={cn(
                "text-lg font-medium line-clamp-1", 
                task.status === "completed" && "line-through text-muted-foreground"
              )}>
                {task.title}
              </h3>
              <p className={cn(
                "text-sm text-muted-foreground line-clamp-2 mb-2",
                task.status === "completed" && "line-through"
              )}>
                {task.description}
              </p>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                size="icon"
                variant="ghost"
                className="rounded-full hover:bg-background"
                onClick={handleToggleStatus}
              >
                <div className={cn(
                  "h-5 w-5 rounded-full border flex items-center justify-center",
                  task.status === "completed" 
                    ? "bg-green-400 border-green-500" 
                    : "bg-transparent border-gray-300"
                )}>
                  {task.status === "completed" && <Check className="h-3 w-3 text-white" />}
                </div>
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="rounded-full hover:bg-background"
                onClick={handleEdit}
              >
                <Edit className="h-4 w-4 text-muted-foreground" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="rounded-full hover:bg-background hover:text-red-500"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
          
          {task.progress !== undefined && task.progress > 0 && (
            <Progress 
              value={task.progress} 
              className="h-1.5 mb-3"
              indicatorClassName={cn(
                task.progress === 100 ? "bg-green-500" : task.progress > 50 ? "bg-task-blue" : "bg-task-purple"
              )}
            />
          )}
          
          <div className="flex flex-wrap gap-2 mt-3">
            {task.tags.map((tag) => (
              <Badge 
                key={tag.id} 
                style={{ backgroundColor: tag.color, color: "white" }} 
                className="shadow-sm text-xs font-normal px-2 py-0.5"
              >
                {tag.name}
              </Badge>
            ))}
            
            <div className="ml-auto flex items-center gap-2">
              <Badge className={cn(priorityColors[task.priority], "shadow-sm text-xs font-normal")}>
                {task.priority}
              </Badge>
              
              {task.dueDate && (
                <Badge variant="outline" className="flex items-center gap-1 shadow-sm border-muted">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs">{format(new Date(task.dueDate), "MMM d")}</span>
                </Badge>
              )}
            </div>
          </div>
          
          {task.aiScore !== undefined && (
            <div className="mt-3 flex items-center">
              <div className="text-xs text-muted-foreground flex items-center">
                <Sparkles className="h-3 w-3 mr-1 text-task-purple" />
                AI Priority
              </div>
              <div 
                className="ml-2 h-1.5 flex-1 bg-gray-200 rounded-full overflow-hidden"
              >
                <div 
                  className="h-full bg-gradient-to-r from-task-purple to-task-purple-dark" 
                  style={{ width: `${task.aiScore}%` }}
                />
              </div>
              <div className="ml-2 text-xs font-medium">
                {task.aiScore}%
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent className="rounded-xl border border-border/70">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this task?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete "{task.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600 rounded-full">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
