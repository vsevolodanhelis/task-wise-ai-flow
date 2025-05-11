
import { supabase } from "@/integrations/supabase/client";
import { Task, TaskPriority, TaskStatus, TaskTag } from "@/types/task";

export const fetchTasks = async (userId: string): Promise<Task[]> => {
  const { data, error } = await supabase
    .from("tasks")
    .select("*, tags:task_tags(tag_id)")
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching tasks:", error);
    throw error;
  }

  // Fetch all the tags
  const { data: tagsData, error: tagsError } = await supabase
    .from("tags")
    .select("*")
    .eq("user_id", userId);

  if (tagsError) {
    console.error("Error fetching tags:", tagsError);
    throw tagsError;
  }

  // Map tasks with their tags
  const tasksWithTags = data.map((task: any) => {
    const tagIds = task.tags?.map((t: any) => t.tag_id) || [];
    const taskTags = tagsData.filter((tag: any) => tagIds.includes(tag.id));
    
    return {
      ...task,
      tags: taskTags,
      dueDate: task.due_date ? new Date(task.due_date) : null,
      createdAt: new Date(task.created_at),
      updatedAt: new Date(task.updated_at),
      completedAt: task.completed_at ? new Date(task.completed_at) : undefined,
    };
  });

  return tasksWithTags;
};

export const createTask = async (
  task: Omit<Task, "id" | "createdAt" | "updatedAt" | "aiScore">, 
  userId: string
): Promise<Task> => {
  const { title, description, dueDate, priority, status, tags, progress } = task;
  
  // Insert the task
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      title,
      description,
      due_date: dueDate,
      priority,
      status,
      progress,
      user_id: userId,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating task:", error);
    throw error;
  }

  // Insert task-tag relationships if tags exist
  if (tags && tags.length > 0) {
    const taskTagRelations = tags.map(tag => ({
      task_id: data.id,
      tag_id: tag.id,
    }));

    const { error: tagError } = await supabase
      .from("task_tags")
      .insert(taskTagRelations);

    if (tagError) {
      console.error("Error associating tags with task:", tagError);
      throw tagError;
    }
  }

  // Return the new task with tags
  return {
    ...data,
    tags: tags || [],
    dueDate: data.due_date ? new Date(data.due_date) : null,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
  };
};

export const updateTask = async (task: Task, userId: string): Promise<Task> => {
  // First update the task details
  const { data, error } = await supabase
    .from("tasks")
    .update({
      title: task.title,
      description: task.description,
      due_date: task.dueDate,
      priority: task.priority,
      status: task.status,
      progress: task.progress,
      completed_at: task.completedAt,
      updated_at: new Date(),
    })
    .eq("id", task.id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating task:", error);
    throw error;
  }

  // Delete existing tag associations
  const { error: deleteError } = await supabase
    .from("task_tags")
    .delete()
    .eq("task_id", task.id);

  if (deleteError) {
    console.error("Error removing existing tags:", deleteError);
    throw deleteError;
  }

  // Insert new tag associations
  if (task.tags && task.tags.length > 0) {
    const taskTagRelations = task.tags.map(tag => ({
      task_id: task.id,
      tag_id: tag.id,
    }));

    const { error: insertError } = await supabase
      .from("task_tags")
      .insert(taskTagRelations);

    if (insertError) {
      console.error("Error associating tags with task:", insertError);
      throw insertError;
    }
  }

  // Return the updated task with tags
  return {
    ...data,
    tags: task.tags || [],
    dueDate: data.due_date ? new Date(data.due_date) : null,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
  };
};

export const deleteTask = async (taskId: string, userId: string): Promise<void> => {
  // First delete the task-tag associations
  const { error: deleteTagsError } = await supabase
    .from("task_tags")
    .delete()
    .eq("task_id", taskId);

  if (deleteTagsError) {
    console.error("Error deleting task tags:", deleteTagsError);
    throw deleteTagsError;
  }

  // Then delete the task
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error deleting task:", error);
    throw error;
  }
};

export const fetchTags = async (userId: string): Promise<TaskTag[]> => {
  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching tags:", error);
    throw error;
  }

  return data;
};

export const createTag = async (tag: Omit<TaskTag, "id">, userId: string): Promise<TaskTag> => {
  const { data, error } = await supabase
    .from("tags")
    .insert({
      name: tag.name,
      color: tag.color,
      user_id: userId,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating tag:", error);
    throw error;
  }

  return data;
};

// Calculate AI score for tasks (client-side for now, could be moved to a Supabase function)
export const calculateAiScore = (task: Omit<Task, "id" | "createdAt" | "updatedAt" | "aiScore">): number => {
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
    score += 10; // Not started tasks get priority
  } else {
    score += 5; // In-progress tasks get lower priority
  }
  
  return Math.min(100, score);
};

// Set up realtime listeners
export const setupTasksSubscription = (userId: string, onTasksUpdate: () => void) => {
  const channel = supabase
    .channel('public:tasks')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${userId}` },
      () => {
        onTasksUpdate();
      }
    )
    .subscribe();
    
  return () => {
    supabase.removeChannel(channel);
  };
};
