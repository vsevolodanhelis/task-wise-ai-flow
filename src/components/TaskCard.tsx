
import { useState } from "react";
import { format } from "date-fns";
import { Task, TaskPriority } from "@/types/task";
import { useTaskContext } from "@/context/TaskContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Check, Clock, Edit, Trash2 } from "lucide-react";
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

  return (
    <>
      <Card 
        className={cn(
          "mb-3 transition-all duration-200 hover:shadow-md cursor-pointer animate-fade-in",
          task.status === "completed" ? "opacity-70" : ""
        )}
        onClick={onClick}
      >
        <CardContent className="p-4">
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
                onClick={handleToggleStatus}
              >
                <Check className={cn(
                  "h-4 w-4",
                  task.status === "completed" && "text-green-500"
                )} />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleEdit}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {task.progress !== undefined && task.progress > 0 && (
            <Progress 
              value={task.progress} 
              className="h-2 mb-3"
              indicatorClassName={cn(
                task.progress === 100 ? "bg-green-500" : task.progress > 50 ? "bg-task-blue" : "bg-task-purple"
              )}
            />
          )}
          
          <div className="flex flex-wrap gap-2 mt-2">
            {task.tags.map((tag) => (
              <Badge key={tag.id} style={{ backgroundColor: tag.color, color: "white" }}>
                {tag.name}
              </Badge>
            ))}
            
            <Badge className={cn(priorityColors[task.priority], "ml-auto")}>
              {task.priority}
            </Badge>
            
            {task.dueDate && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {format(new Date(task.dueDate), "MMM d")}
              </Badge>
            )}
          </div>
          
          {task.aiScore !== undefined && (
            <div className="mt-2 flex items-center">
              <div className="text-xs text-muted-foreground">AI Priority Score:</div>
              <div className="ml-1 text-xs font-medium">
                {task.aiScore}
              </div>
              <div 
                className="ml-1 h-2 flex-1 bg-gray-200 rounded-full overflow-hidden"
              >
                <div 
                  className="h-full bg-gradient-to-r from-task-purple to-task-purple-dark" 
                  style={{ width: `${task.aiScore}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this task?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the task "{task.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
