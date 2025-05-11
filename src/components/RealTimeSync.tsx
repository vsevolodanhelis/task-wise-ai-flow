
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTaskContext } from "@/context/TaskContext";
import { useOfflineStorage } from "@/hooks/use-offline-storage";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/types/task";
import * as taskService from "@/services/taskService";

export const RealTimeSync: React.FC = () => {
  const { user } = useAuth();
  const { refetchTasks } = useTaskContext();
  const { queue, clearQueue, isOnline } = useOfflineStorage<Task>("tasks");
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  // Listen for realtime events
  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to task changes
    const channel = supabase
      .channel('task-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${user.id}` },
        (payload) => {
          console.log('Real-time change received:', payload);
          refetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Process offline queue when back online
  useEffect(() => {
    if (!isOnline || queue.length === 0 || !user?.id || syncing) return;

    const processQueue = async () => {
      setSyncing(true);
      
      toast({
        title: "Syncing changes",
        description: `Uploading ${queue.length} change${queue.length !== 1 ? 's' : ''} made while offline`,
      });
      
      try {
        // Process each queued operation in order
        for (const op of queue) {
          try {
            if (op.type === 'create') {
              await taskService.createTask(op.data, user.id);
            } else if (op.type === 'update') {
              await taskService.updateTask(op.data, user.id);
            } else if (op.type === 'delete') {
              await taskService.deleteTask(op.data.id, user.id);
            }
          } catch (error) {
            console.error(`Error processing queued operation:`, op, error);
          }
        }
        
        await refetchTasks();
        clearQueue();
        
        toast({
          title: "Sync complete",
          description: "Your changes have been uploaded successfully",
        });
      } catch (error) {
        console.error("Error syncing offline changes:", error);
        toast({
          title: "Sync failed",
          description: "Some changes couldn't be synchronized. Will try again later.",
          variant: "destructive",
        });
      } finally {
        setSyncing(false);
      }
    };

    processQueue();
  }, [isOnline, queue, user?.id, syncing]);

  // Render nothing - this is a background component
  return null;
};
