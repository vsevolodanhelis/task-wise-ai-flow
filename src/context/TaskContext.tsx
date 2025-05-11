
import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { Task, TaskPriority, TaskStatus, TaskTag } from "@/types/task";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import * as taskService from "@/services/taskService";

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
  loading: boolean;
  refetchTasks: () => Promise<void>;
}

const TaskContext = createContext<TaskContextProps | undefined>(undefined);

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tags, setTags] = useState<TaskTag[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();

  // Fetch tasks and tags whenever the authenticated user changes
  useEffect(() => {
    if (user?.id) {
      fetchUserData();
    } else if (!isAuthenticated) {
      // Clear tasks when not authenticated
      setTasks([]);
      setTags([]);
      setLoading(false);
    }
  }, [user?.id, isAuthenticated]);

  // Set up realtime subscription for task updates
  useEffect(() => {
    if (!user?.id) return;
    
    const unsubscribe = taskService.setupTasksSubscription(user.id, fetchUserData);
    
    return () => {
      unsubscribe();
    };
  }, [user?.id]);

  const fetchUserData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Fetch tasks
      const userTasks = await taskService.fetchTasks(user.id);
      setTasks(userTasks);
      
      // Fetch tags
      const userTags = await taskService.fetchTags(user.id);
      
      // If user has no tags yet, create default tags
      if (userTags.length === 0) {
        await Promise.all(
          DEFAULT_TAGS.map(async (tag) => {
            await taskService.createTag({
              name: tag.name,
              color: tag.color,
            }, user.id);
          })
        );
        // Fetch tags again after creating defaults
        const freshTags = await taskService.fetchTags(user.id);
        setTags(freshTags);
      } else {
        setTags(userTags);
      }
    } catch (error: any) {
      console.error("Error fetching user data:", error);
      toast({
        title: "Failed to load data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refetchTasks = async () => {
    if (!user?.id) return;
    
    try {
      const userTasks = await taskService.fetchTasks(user.id);
      setTasks(userTasks);
    } catch (error: any) {
      console.error("Error refetching tasks:", error);
      toast({
        title: "Failed to refresh tasks",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const addTask = async (task: Omit<Task, "id" | "createdAt" | "updatedAt" | "aiScore">) => {
    if (!user?.id) return;
    
    try {
      const aiScore = taskService.calculateAiScore(task);
      const newTask = await taskService.createTask({
        ...task,
        aiScore
      }, user.id);
      
      // Optimistically update the UI
      setTasks((prevTasks) => [...prevTasks, newTask]);
      
      toast({
        title: "Task added",
        description: `"${task.title}" has been added to your tasks.`,
      });
    } catch (error: any) {
      console.error("Error adding task:", error);
      toast({
        title: "Failed to add task",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateTask = async (updatedTask: Task) => {
    if (!user?.id) return;
    
    try {
      const aiScore = taskService.calculateAiScore(updatedTask);
      const task = await taskService.updateTask({
        ...updatedTask,
        aiScore
      }, user.id);
      
      // Optimistically update the UI
      setTasks((prevTasks) =>
        prevTasks.map((t) => (t.id === updatedTask.id ? task : t))
      );
      
      toast({
        title: "Task updated",
        description: `"${updatedTask.title}" has been updated.`,
      });
    } catch (error: any) {
      console.error("Error updating task:", error);
      toast({
        title: "Failed to update task",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!user?.id) return;
    
    const taskToDelete = tasks.find(task => task.id === taskId);
    if (!taskToDelete) return;
    
    try {
      await taskService.deleteTask(taskId, user.id);
      
      // Optimistically update the UI
      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
      
      toast({
        title: "Task deleted",
        description: `"${taskToDelete.title}" has been deleted.`,
        variant: "destructive",
      });
    } catch (error: any) {
      console.error("Error deleting task:", error);
      toast({
        title: "Failed to delete task",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getTaskById = (taskId: string) => {
    return tasks.find((task) => task.id === taskId);
  };

  const addTag = async (tag: Omit<TaskTag, "id">) => {
    if (!user?.id) return;
    
    try {
      const newTag = await taskService.createTag(tag, user.id);
      setTags((prevTags) => [...prevTags, newTag]);
      
      toast({
        title: "Tag created",
        description: `"${tag.name}" tag has been created.`,
      });
    } catch (error: any) {
      console.error("Error creating tag:", error);
      toast({
        title: "Failed to create tag",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getAiPrioritizedTasks = () => {
    return [...tasks].sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
  };

  const toggleTaskStatus = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !user?.id) return;
    
    const newStatus: TaskStatus = 
      task.status === 'pending' ? 'in-progress' :
      task.status === 'in-progress' ? 'completed' : 'pending';
    
    const completedAt = newStatus === 'completed' ? new Date() : undefined;
    const progress = newStatus === 'completed' ? 100 : 
                     newStatus === 'in-progress' ? Math.max(task.progress || 0, 25) : 0;
    
    const updatedTask = {
      ...task,
      status: newStatus,
      completedAt,
      progress,
      updatedAt: new Date(),
    };
    
    await updateTask(updatedTask);
  };

  const updateTaskProgress = async (taskId: string, progress: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !user?.id) return;
    
    // Update status based on progress
    let status: TaskStatus = task.status;
    if (progress === 100) {
      status = 'completed';
    } else if (progress > 0 && task.status === 'pending') {
      status = 'in-progress';
    } else if (progress === 0 && task.status === 'in-progress') {
      status = 'pending';
    }
    
    const updatedTask = {
      ...task,
      progress,
      status,
      completedAt: progress === 100 ? new Date() : undefined,
      updatedAt: new Date(),
    };
    
    await updateTask(updatedTask);
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
        updateTaskProgress,
        loading,
        refetchTasks
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
