
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Get the API key from environment variables
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body
    const { tasks, userId } = await req.json();
    
    if (!tasks || tasks.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No tasks provided' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create a system prompt for the AI
    const systemPrompt = `
      You are an AI assistant that helps prioritize tasks based on their importance, urgency, and impact.
      Analyze the given tasks and assign each an AI score from 1 to 100, where:
      - 1-30: Low priority
      - 31-70: Medium priority
      - 71-100: High priority
      
      Consider factors like:
      1. Due date (closer dates get higher priority)
      2. Task description and title (look for urgent language)
      3. Task status (incomplete tasks are more important than in-progress)
      4. Task priority as already set by the user
      
      Return only a JSON object with task IDs as keys and AI scores as values.
      Example: { "task-id-1": 85, "task-id-2": 45 }
    `;

    // Format tasks for the AI
    const tasksFormatted = tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description || '',
      due_date: task.due_date,
      status: task.status,
      priority: task.priority
    }));

    // Call OpenAI API
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: JSON.stringify(tasksFormatted) }
        ],
        temperature: 0.2,
      }),
    });

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await openAIResponse.json();
    const aiScores = JSON.parse(data.choices[0].message.content);
    
    // If user is authenticated, update the tasks in the database
    if (userId && userId !== 'guest') {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Update each task with its AI score
      for (const [taskId, score] of Object.entries(aiScores)) {
        await supabase
          .from('tasks')
          .update({ ai_score: score })
          .eq('id', taskId)
          .eq('user_id', userId);
      }
    }

    return new Response(
      JSON.stringify({ success: true, aiScores }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in ai-prioritize function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
