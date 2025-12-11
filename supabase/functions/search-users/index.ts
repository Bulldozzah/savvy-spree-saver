import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Missing Supabase env vars" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create client with user's JWT to verify authentication
    const token = authHeader.replace("Bearer ", "");
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user has admin or super_admin role
    const { data: roleData, error: roleError } = await userClient
      .rpc("has_role", { _user_id: user.id, _role: "admin" });
    
    const { data: superAdminData, error: superAdminError } = await userClient
      .rpc("has_role", { _user_id: user.id, _role: "super_admin" });

    const isAdmin = roleData === true;
    const isSuperAdmin = superAdminData === true;

    if (!isAdmin && !isSuperAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: Admin role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    let query = "";
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      query = (body?.q ?? "").toString().trim();
    } else {
      const { searchParams } = new URL(req.url);
      query = (searchParams.get("q") ?? "").toString().trim();
    }

    if (!query) {
      return new Response(JSON.stringify({ users: [] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const perPage = 200;
    let page = 1;
    const qLower = query.toLowerCase();
    const results: Array<{ id: string; email: string | null }>= [];

    while (page <= 10) { // safety cap
      const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage });
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const users = data?.users ?? [];
      for (const u of users) {
        const email = u.email ?? "";
        if (email.toLowerCase().includes(qLower)) {
          results.push({ id: u.id, email: u.email ?? null });
        }
      }

      if (users.length < perPage || results.length >= 100) break;
      page++;
    }

    return new Response(JSON.stringify({ users: results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
