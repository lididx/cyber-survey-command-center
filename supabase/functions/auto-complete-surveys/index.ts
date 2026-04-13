import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    // Find archived surveys with chen_review status that haven't been updated in 10+ days
    const { data: stuckSurveys, error: fetchError } = await supabase
      .from("surveys")
      .select("id, system_name, updated_at")
      .eq("is_archived", true)
      .eq("status", "chen_review")
      .lt("updated_at", tenDaysAgo.toISOString());

    if (fetchError) throw fetchError;

    if (!stuckSurveys || stuckSurveys.length === 0) {
      return new Response(JSON.stringify({ message: "No surveys to auto-complete", count: 0 }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Update each survey to completed
    const ids = stuckSurveys.map(s => s.id);
    const { error: updateError } = await supabase
      .from("surveys")
      .update({ status: "completed" })
      .in("id", ids);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ 
      message: `Auto-completed ${ids.length} surveys`, 
      count: ids.length,
      surveyIds: ids 
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
