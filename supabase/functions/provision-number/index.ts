import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    
    return new Response(
      JSON.stringify({
        success: true,
        message: "OlaqVerify provision-number function is working"
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: String(error)
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});
