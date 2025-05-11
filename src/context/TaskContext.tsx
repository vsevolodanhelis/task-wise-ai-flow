
import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { Task, TaskPriority, TaskStatus, TaskTag } from "@/types/task";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import * as taskService from "@/services/taskService";
import { v4 as uuidv4 } from 'uuid';

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

// Local storage keys
const LOCAL_STORAGE_TASKS_KEY = "kairo_guest_tasks";
const LOCAL_STORAGE_TAGS_KEY = "kairo_guest_tags";

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tags, setTags] = useState<TaskTag[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user, isAuthenticated, isGuest } = useAuth();

  // Fetch tasks and tags whenever the authenticated user changes or guest mode changes
  useEffect(() => {
    if (isGuest) {
      loadLocalData();
    } else if (user?.id) {
      fetchUserData();
    } else if (!isAuthenticated) {
      // Clear tasks when not authenticated and not in guest mode
      setTasks([]);
      setTags([]);
      setLoading(false);
    }
  }, [user?.id, isAuthenticated, isGuest]);

  // Set up realtime subscription for task updates (only when authenticated)
  useEffect(() => {
    if (!user?.id || isGuest) return;
    
    const unsubscribe = taskService.setupTasksSubscription(user.id, fetchUserData);
    
    return () => {
      unsubscribe();
    };
  }, [user?.id, isGuest]);

  // Load data from local storage for guest mode
  const loadLocalData = () => {
    setLoading(true);
    try {
      // Load tasks from localStorage
      const storedTasks = localStorage.getItem(LOCAL_STORAGE_TASKS_KEY);
      if (storedTasks) {
        setTasks(JSON.parse(storedTasks));
      } else {
        setTasks([]);
      }
      
      // Load tags from localStorage
      const storedTags = localStorage.getItem(LOCAL_STORAGE_TAGS_KEY);
      if (storedTags) {
        setTags(JSON.parse(storedTags));
      } else {
        // Initialize with default tags
        setTags(DEFAULT_TAGS.map(tag => ({
          ...tag,
          id: uuidv4() // Generate unique IDs for guest mode
        })));
        // Save default tags to localStorage
        localStorage.setItem(LOCAL_STORAGE_TAGS_KEY, JSON.stringify(DEFAULT_TAGS));
      }
    } catch (error) {
      console.error("Error loading local data:", error);
      // Reset to defaults
      setTasks([]);
      setTags(DEFAULT_TAGS);
    } finally {
      setLoading(false);
    }
  };

  // Save tasks to localStorage (for guest mode)
  const saveTasksToLocalStorage = (updatedTasks: Task[]) => {
    if (isGuest) {
      localStorage.setItem(LOCAL_STORAGE_TASKS_KEY, JSON.stringify(updatedTasks));
    }
  };

  // Save tags to localStorage (for guest mode)
  const saveTagsToLocalStorage = (updatedTags: TaskTag[]) => {
    if (isGuest) {
      localStorage.setItem(LOCAL_STORAGE_TAGS_KEY, JSON.stringify(updatedTags));
    }
  };

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
    if (isGuest) {
      loadLocalData();
      return;
    }
    
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
    // Handle guest mode
    if (isGuest) {
      const now = new Date();
      const newTask: Task = {
        ...task,
        id: uuidv4(),
        createdAt: now,
        updatedAt: now,
        aiScore: calculateAiScoreForGuest(task),
      };
      
      const updatedTasks = [...tasks, newTask];
      setTasks(updatedTasks);
      saveTasksToLocalStorage(updatedTasks);
      
      toast({
        title: "Task added",
        description: `"${task.title}" has been added to your tasks.`,
      });
      return;
    }
    
    // Handle authenticated mode
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

  // Calculate AI score for guest mode (simplified version)
  const calculateAiScoreForGuest = (task: Omit<Task, "id" | "createdAt" | "updatedAt" | "aiScore">) => {
    let score = 0;
    
    // Priority based score
    if (task.priority === 'high') score += 30;
    else if (task.priority === 'medium') score += 20;
    else score += 10;
    
    // Due date based score
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      const today = new Date();
      const diffDays = Math.round((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
      
      if (diffDays <= 1) score += 30;
      else if (diffDays <= 3) score += 20;
      else if (diffDays <= 7) score += 10;
    }
    
    // Tags based score
    if (task.tags.some(tag => tag.name.toLowerCase() === 'urgent')) {
      score += 25;
    }
    
    return score;
  };

  const updateTask = async (updatedTask: Task) => {
    // Handle guest mode
    if (isGuest) {
      const updatedTasks = tasks.map((t) => 
        t.id === updatedTask.id 
          ? { ...updatedTask, updatedAt: new Date(), aiScore: calculateAiScoreForGuest(updatedTask) } 
          : t
      );
      
      setTasks(updatedTasks);
      saveTasksToLocalStorage(updatedTasks);
      
      toast({
        title: "Task updated",
        description: `"${updatedTask.title}" has been updated.`,
      });
      return;
    }
    
    // Handle authenticated mode
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
    // Handle guest mode
    if (isGuest) {
      const taskToDelete = tasks.find(task => task.id === taskId);
      if (!taskToDelete) return;
      
      const updatedTasks = tasks.filter((task) => task.id !== taskId);
      setTasks(updatedTasks);
      saveTasksToLocalStorage(updatedTasks);
      
      toast({
        title: "Task deleted",
        description: `"${taskToDelete.title}" has been deleted.`,
        variant: "destructive",
      });
      return;
    }
    
    // Handle authenticated mode
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
    // Handle guest mode
    if (isGuest) {
      const newTag: TaskTag = {
        ...tag,
        id: uuidv4(),
      };
      
      const updatedTags = [...tags, newTag];
      setTags(updatedTags);
      saveTagsToLocalStorage(updatedTags);
      
      toast({
        title: "Tag created",
        description: `"${tag.name}" tag has been created.`,
      });
      return;
    }
    
    // Handle authenticated mode
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
    if (!task) return;
    
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
    if (!task) return;
    
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
