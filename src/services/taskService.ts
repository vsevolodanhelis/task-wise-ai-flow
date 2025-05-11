import { supabase } from "@/integrations/supabase/client";
import { Task, TaskTag, TaskPriority, TaskStatus } from "@/types/task";

// Fetch tasks from Supabase
export const fetchTasks = async (userId: string): Promise<Task[]> => {
  const { data, error } = await supabase
    .from("tasks")
    .select(`
      *,
      task_tags!inner (
        tag_id
      ),
      tags!inner (*)
    `)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  // Group tasks with tags
  const tasks = data.reduce((acc: Record<string, any>, row: any) => {
    const taskId = row.id;

    if (!acc[taskId]) {
      acc[taskId] = {
        ...row,
        tags: []
      };
    }

    if (row.tags) {
      const existingTagIds = acc[taskId].tags.map((tag: TaskTag) => tag.id);
      if (!existingTagIds.includes(row.tags.id)) {
        acc[taskId].tags.push({
          id: row.tags.id,
          name: row.tags.name,
          color: row.tags.color
        });
      }
    }

    return acc;
  }, {});

  // Convert to Task array and map database fields to client model
  return Object.values(tasks).map((task: any) => mapDbTaskToTask(task));
};

// Create a new task in Supabase
export const createTask = async (task: Omit<Task, "id" | "createdAt" | "updatedAt">, userId: string): Promise<Task> => {
  // Convert dates to ISO string format if they exist
  const dueDate = task.dueDate ? new Date(task.dueDate).toISOString() : null;
  const completedAt = task.completedAt ? new Date(task.completedAt).toISOString() : null;
  
  // Insert the task
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      progress: task.progress || 0,
      due_date: dueDate,
      completed_at: completedAt,
      user_id: userId,
      ai_score: task.aiScore || 0
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Add tags to the task
  if (task.tags && task.tags.length > 0) {
    const taskTags = task.tags.map(tag => ({
      task_id: data.id,
      tag_id: tag.id
    }));

    const { error: tagError } = await supabase
      .from("task_tags")
      .insert(taskTags);

    if (tagError) {
      throw tagError;
    }
  }

  // Return the created task with tags
  return {
    id: data.id,
    title: data.title,
    description: data.description,
    status: data.status as TaskStatus,
    priority: data.priority as TaskPriority,
    progress: data.progress,
    dueDate: data.due_date ? new Date(data.due_date) : undefined,
    tags: task.tags || [],
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
    aiScore: data.ai_score
  };
};

// Update an existing task in Supabase
export const updateTask = async (task: Task, userId: string): Promise<Task> => {
  // Convert dates to ISO string format if they exist
  const dueDate = task.dueDate ? new Date(task.dueDate).toISOString() : null;
  const completedAt = task.completedAt ? new Date(task.completedAt).toISOString() : null;
  
  // Update the task
  const { data, error } = await supabase
    .from("tasks")
    .update({
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      progress: task.progress || 0,
      due_date: dueDate,
      completed_at: completedAt,
      updated_at: new Date().toISOString(),
      ai_score: task.aiScore || 0
    })
    .eq("id", task.id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Remove existing tag associations
  const { error: removeTagError } = await supabase
    .from("task_tags")
    .delete()
    .eq("task_id", task.id);

  if (removeTagError) {
    throw removeTagError;
  }

  // Add new tag associations
  if (task.tags && task.tags.length > 0) {
    const taskTags = task.tags.map(tag => ({
      task_id: task.id,
      tag_id: tag.id
    }));

    const { error: tagError } = await supabase
      .from("task_tags")
      .insert(taskTags);

    if (tagError) {
      throw tagError;
    }
  }

  // Return the updated task with tags
  return {
    ...task,
    updatedAt: new Date(data.updated_at)
  };
};

// Delete a task from Supabase
export const deleteTask = async (taskId: string, userId: string): Promise<void> => {
  // First delete task tags (due to foreign key constraints)
  const { error: tagError } = await supabase
    .from("task_tags")
    .delete()
    .eq("task_id", taskId);

  if (tagError) {
    throw tagError;
  }

  // Then delete the task
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
};

// Fetch tags from Supabase
export const fetchTags = async (userId: string): Promise<TaskTag[]> => {
  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  return data.map((tag: any) => ({
    id: tag.id,
    name: tag.name,
    color: tag.color
  }));
};

// Create a new tag in Supabase
export const createTag = async (tag: Omit<TaskTag, "id">, userId: string): Promise<TaskTag> => {
  const { data, error } = await supabase
    .from("tags")
    .insert({
      name: tag.name,
      color: tag.color,
      user_id: userId
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return {
    id: data.id,
    name: data.name,
    color: data.color
  };
};

// Helper function to map database task to client task model
const mapDbTaskToTask = (dbTask: any): Task => {
  return {
    id: dbTask.id,
    title: dbTask.title,
    description: dbTask.description,
    status: dbTask.status as TaskStatus,
    priority: dbTask.priority as TaskPriority,
    progress: dbTask.progress,
    dueDate: dbTask.due_date ? new Date(dbTask.due_date) : undefined,
    tags: dbTask.tags || [],
    createdAt: new Date(dbTask.created_at),
    updatedAt: new Date(dbTask.updated_at),
    completedAt: dbTask.completed_at ? new Date(dbTask.completed_at) : undefined,
    aiScore: dbTask.ai_score
  };
};

// Set up realtime subscription for task updates
export const setupTasksSubscription = (userId: string, callback: () => void) => {
  const subscription = supabase
    .channel('tasks-channel')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${userId}` }, 
      () => {
        callback();
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
};

// Calculate AI task priority score
export const calculateAiScore = (task: Omit<Task, "id" | "createdAt" | "updatedAt" | "aiScore"> | Task): number => {
  let score = 0;
  
  // Priority based scoring
  switch (task.priority) {
    case 'high':
      score += 30;
      break;
    case 'medium':
      score += 20;
      break;
    case 'low':
      score += 10;
      break;
    default:
      score += 10;
  }
  
  // Due date based scoring
  if (task.dueDate) {
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    const diffDays = Math.round((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    
    if (diffDays <= 1) {
      score += 30;
    } else if (diffDays <= 3) {
      score += 20;
    } else if (diffDays <= 7) {
      score += 10;
    }
  }
  
  // Tag based scoring
  if (task.tags.some(tag => tag.name.toLowerCase().includes('urgent'))) {
    score += 25;
  }
  
  // Description length based scoring
  if (task.description && task.description.length > 100) {
    score += 5;
  }
  
  return score;
};

// Add this function to the existing file
export const generateAiPriorities = async (tasks: Task[], userId: string | null) => {
  try {
    const response = await fetch('/api/ai-prioritize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        tasks,
        userId: userId || 'guest'
      }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    return data.aiScores;
  } catch (error) {
    console.error('Error getting AI priorities:', error);
    throw error;
  }
};
