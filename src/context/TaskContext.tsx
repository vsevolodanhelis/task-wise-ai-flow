
import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { Task, TaskPriority, TaskStatus, TaskTag } from "@/types/task";
import { useToast } from "@/hooks/use-toast";

// Predefined tags
export const DEFAULT_TAGS: TaskTag[] = [
  { id: "work", name: "Work", color: "#5C95FF" },
  { id: "personal", name: "Personal", color: "#6ECB63" },
  { id: "urgent", name: "Urgent", color: "#FF884B" },
  { id: "shopping", name: "Shopping", color: "#FFCB42" },
  { id: "health", name: "Health", color: "#ea384c" },
];

interface TaskContextProps {
  tasks: Task[];
  addTask: (task: Omit<Task, "id" | "createdAt" | "updatedAt" | "aiScore">) => void;
  updateTask: (updatedTask: Task) => void;
  deleteTask: (taskId: string) => void;
  getTaskById: (taskId: string) => Task | undefined;
  tags: TaskTag[];
  addTag: (tag: Omit<TaskTag, "id">) => void;
  getAiPrioritizedTasks: () => Task[];
  toggleTaskStatus: (taskId: string) => void;
  updateTaskProgress: (taskId: string, progress: number) => void;
}

const TaskContext = createContext<TaskContextProps | undefined>(undefined);

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tags, setTags] = useState<TaskTag[]>(DEFAULT_TAGS);
  const { toast } = useToast();

  // Load tasks from localStorage on initial render
  useEffect(() => {
    const savedTasks = localStorage.getItem("tasks");
    const savedTags = localStorage.getItem("tags");
    
    if (savedTasks) {
      try {
        const parsedTasks = JSON.parse(savedTasks);
        // Convert string dates back to Date objects
        const processedTasks = parsedTasks.map((task: any) => ({
          ...task,
          dueDate: task.dueDate ? new Date(task.dueDate) : null,
          createdAt: new Date(task.createdAt),
          updatedAt: new Date(task.updatedAt),
          completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
        }));
        setTasks(processedTasks);
      } catch (error) {
        console.error("Error parsing tasks from localStorage:", error);
      }
    }
    
    if (savedTags) {
      try {
        const parsedTags = JSON.parse(savedTags);
        setTags(parsedTags);
      } catch (error) {
        console.error("Error parsing tags from localStorage:", error);
      }
    }
  }, []);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  // Save tags to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("tags", JSON.stringify(tags));
  }, [tags]);

  const addTask = (task: Omit<Task, "id" | "createdAt" | "updatedAt" | "aiScore">) => {
    const now = new Date();
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
      aiScore: calculateAiScore(task),
    };

    setTasks((prevTasks) => [...prevTasks, newTask]);
    toast({
      title: "Task added",
      description: `"${task.title}" has been added to your tasks.`,
    });
  };

  const updateTask = (updatedTask: Task) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === updatedTask.id
          ? {
              ...updatedTask,
              updatedAt: new Date(),
              aiScore: calculateAiScore(updatedTask),
            }
          : task
      )
    );
    toast({
      title: "Task updated",
      description: `"${updatedTask.title}" has been updated.`,
    });
  };

  const deleteTask = (taskId: string) => {
    const taskToDelete = tasks.find(task => task.id === taskId);
    if (!taskToDelete) return;
    
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
    toast({
      title: "Task deleted",
      description: `"${taskToDelete.title}" has been deleted.`,
      variant: "destructive",
    });
  };

  const getTaskById = (taskId: string) => {
    return tasks.find((task) => task.id === taskId);
  };

  const addTag = (tag: Omit<TaskTag, "id">) => {
    const newTag: TaskTag = {
      ...tag,
      id: `tag-${Date.now()}`,
    };
    setTags((prevTags) => [...prevTags, newTag]);
    toast({
      title: "Tag created",
      description: `"${tag.name}" tag has been created.`,
    });
  };

  // Simulated AI priority calculation function
  const calculateAiScore = (task: Omit<Task, "id" | "createdAt" | "updatedAt" | "aiScore">): number => {
    let score = 0;
    
    // Priority factor (0-30 points)
    switch (task.priority) {
      case 'urgent': score += 30; break;
      case 'high': score += 20; break;
      case 'medium': score += 10; break;
      case 'low': score += 5; break;
    }
    
    // Due date factor (0-40 points)
    if (task.dueDate) {
      const today = new Date();
      const dueDate = new Date(task.dueDate);
      const daysUntilDue = Math.max(0, Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
      
      if (daysUntilDue <= 1) score += 40;
      else if (daysUntilDue <= 3) score += 30;
      else if (daysUntilDue <= 7) score += 20;
      else score += 10;
    }
    
    // Tags factor (0-15 points)
    if (task.tags.some(tag => tag.id === "urgent")) {
      score += 15;
    }
    
    // Progress factor (0-15 points)
    const progress = task.progress || 0;
    if (progress >= 75) {
      score += 15; // Almost done tasks get priority
    } else if (progress === 0) {
      score += 10; // Not started tasks get medium priority
    } else {
      score += 5; // In-progress tasks get lower priority
    }
    
    return Math.min(100, score);
  };

  const getAiPrioritizedTasks = () => {
    return [...tasks].sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
  };

  const toggleTaskStatus = (taskId: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id === taskId) {
          const newStatus: TaskStatus = 
            task.status === 'pending' ? 'in-progress' :
            task.status === 'in-progress' ? 'completed' : 'pending';
          
          const completedAt = newStatus === 'completed' ? new Date() : undefined;
          const progress = newStatus === 'completed' ? 100 : 
                         newStatus === 'in-progress' ? Math.max(task.progress || 0, 25) : 0;
          
          return {
            ...task,
            status: newStatus,
            completedAt,
            progress,
            updatedAt: new Date(),
          };
        }
        return task;
      })
    );
  };

  const updateTaskProgress = (taskId: string, progress: number) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id === taskId) {
          // Update status based on progress
          let status: TaskStatus = task.status;
          if (progress === 100) {
            status = 'completed';
          } else if (progress > 0 && task.status === 'pending') {
            status = 'in-progress';
          } else if (progress === 0 && task.status === 'in-progress') {
            status = 'pending';
          }
          
          return {
            ...task,
            progress,
            status,
            completedAt: progress === 100 ? new Date() : undefined,
            updatedAt: new Date(),
          };
        }
        return task;
      })
    );
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        addTask,
        updateTask,
        deleteTask,
        getTaskById,
        tags,
        addTag,
        getAiPrioritizedTasks,
        toggleTaskStatus,
        updateTaskProgress
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTaskContext = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error("useTaskContext must be used within a TaskProvider");
  }
  return context;
};
