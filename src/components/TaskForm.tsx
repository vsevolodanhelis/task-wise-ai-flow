
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { useTaskContext } from "@/context/TaskContext";
import { Task, TaskPriority, TaskTag } from "@/types/task";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TaskFormProps {
  task?: Task;
  onComplete: () => void;
  isEditMode?: boolean;
}

const initialTask: Omit<Task, "id" | "createdAt" | "updatedAt" | "aiScore"> = {
  title: "",
  description: "",
  dueDate: null,
  priority: "medium",
  status: "pending",
  tags: [],
  progress: 0,
};

export const TaskForm: React.FC<TaskFormProps> = ({
  task,
  onComplete,
  isEditMode = false,
}) => {
  const { addTask, updateTask, tags: availableTags } = useTaskContext();
  const [formData, setFormData] = useState<Omit<Task, "id" | "createdAt" | "updatedAt" | "aiScore">>(
    task ? {
      ...task,
      dueDate: task.dueDate,
      tags: task.tags
    } : initialTask
  );

  useEffect(() => {
    if (task) {
      setFormData({
        ...task,
        dueDate: task.dueDate,
        tags: task.tags
      });
    }
  }, [task]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handlePriorityChange = (value: string) => {
    setFormData({
      ...formData,
      priority: value as TaskPriority,
    });
  };

  const handleDateChange = (date: Date | undefined) => {
    setFormData({
      ...formData,
      dueDate: date || null,
    });
  };

  const handleProgressChange = (value: number[]) => {
    setFormData({
      ...formData,
      progress: value[0],
      status: value[0] === 100 ? 'completed' : value[0] > 0 ? 'in-progress' : 'pending',
    });
  };

  const handleTagToggle = (tag: TaskTag) => {
    const isSelected = formData.tags.some((t) => t.id === tag.id);
    
    if (isSelected) {
      setFormData({
        ...formData,
        tags: formData.tags.filter((t) => t.id !== tag.id),
      });
    } else {
      setFormData({
        ...formData,
        tags: [...formData.tags, tag],
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert("Task title is required");
      return;
    }
    
    if (isEditMode && task) {
      updateTask({ ...task, ...formData });
    } else {
      addTask(formData);
    }
    
    onComplete();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          placeholder="Task title"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Task description"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dueDate">Due Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !formData.dueDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formData.dueDate ? (
                format(new Date(formData.dueDate), "PPP")
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
            <Calendar
              mode="single"
              selected={formData.dueDate ? new Date(formData.dueDate) : undefined}
              onSelect={handleDateChange}
              initialFocus
              className="p-3"
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label htmlFor="priority">Priority</Label>
        <Select
          value={formData.priority}
          onValueChange={handlePriorityChange}
        >
          <SelectTrigger id="priority">
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label>Task Progress ({formData.progress}%)</Label>
        <Slider
          defaultValue={[formData.progress || 0]}
          value={[formData.progress || 0]}
          max={100}
          step={5}
          onValueChange={handleProgressChange}
        />
      </div>

      <div className="space-y-2">
        <Label>Tags</Label>
        <div className="flex flex-wrap gap-2">
          {availableTags.map((tag) => {
            const isSelected = formData.tags.some((t) => t.id === tag.id);
            return (
              <Badge
                key={tag.id}
                style={{
                  backgroundColor: isSelected ? tag.color : "transparent",
                  color: isSelected ? "white" : tag.color,
                  borderColor: tag.color,
                }}
                variant={isSelected ? "default" : "outline"}
                className="cursor-pointer hover:opacity-80 transition-all"
                onClick={() => handleTagToggle(tag)}
              >
                {tag.name}
              </Badge>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onComplete}>
          Cancel
        </Button>
        <Button type="submit" className="bg-task-purple hover:bg-task-purple-dark">
          {isEditMode ? "Update Task" : "Add Task"}
        </Button>
      </div>
    </form>
  );
};
