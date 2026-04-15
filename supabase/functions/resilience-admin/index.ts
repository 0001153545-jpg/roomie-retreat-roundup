import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = "0001152760@senaimgaluno.com.br";
const BACKUP_TABLES = ["profiles", "listings", "reservations", "reviews", "favorites"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify JWT from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create client with user's token to verify identity
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user || user.email !== ADMIN_EMAIL) {
      return new Response(JSON.stringify({ error: "Acesso negado" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service role client for admin operations
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { action, backup_id, label } = await req.json();

    switch (action) {
      case "backup": {
        // Snapshot all tables
        const snapshot: Record<string, unknown[]> = {};
        for (const table of BACKUP_TABLES) {
          const { data, error } = await admin.from(table).select("*");
          if (error) throw new Error(`Erro ao ler ${table}: ${error.message}`);
          snapshot[table] = data || [];
        }

        const { data: backup, error: insertErr } = await admin
          .from("resilience_backups")
          .insert({
            label: label || `Backup ${new Date().toLocaleString("pt-BR")}`,
            snapshot_data: snapshot,
            tables_included: BACKUP_TABLES,
            created_by: user.id,
          })
          .select()
          .single();

        if (insertErr) throw new Error(`Erro ao salvar backup: ${insertErr.message}`);

        return new Response(JSON.stringify({ success: true, backup }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "restore": {
        if (!backup_id) throw new Error("backup_id é obrigatório");

        const { data: backup, error: fetchErr } = await admin
          .from("resilience_backups")
          .select("*")
          .eq("id", backup_id)
          .single();

        if (fetchErr || !backup) throw new Error("Backup não encontrado");

        const snapshot = backup.snapshot_data as Record<string, unknown[]>;

        // Delete in reverse dependency order, then re-insert
        const deleteOrder = ["favorites", "reviews", "reservations", "listings", "profiles"];
        const insertOrder = ["profiles", "listings", "reservations", "reviews", "favorites"];

        for (const table of deleteOrder) {
          const { error } = await admin.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
          if (error) throw new Error(`Erro ao limpar ${table}: ${error.message}`);
        }

        for (const table of insertOrder) {
          const rows = snapshot[table];
          if (rows && rows.length > 0) {
            const { error } = await admin.from(table).insert(rows);
            if (error) throw new Error(`Erro ao restaurar ${table}: ${error.message}`);
          }
        }

        return new Response(JSON.stringify({ success: true, message: "Dados restaurados com sucesso" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "simulate_data_loss": {
        // First create automatic backup
        const snapshot: Record<string, unknown[]> = {};
        for (const table of BACKUP_TABLES) {
          const { data } = await admin.from(table).select("*");
          snapshot[table] = data || [];
        }

        await admin.from("resilience_backups").insert({
          label: `[Auto] Antes de simulação de perda - ${new Date().toLocaleString("pt-BR")}`,
          snapshot_data: snapshot,
          tables_included: BACKUP_TABLES,
          created_by: user.id,
        });

        // Delete all data from tables (except backups)
        const deleteOrder = ["favorites", "reviews", "reservations", "listings", "profiles"];
        for (const table of deleteOrder) {
          await admin.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
        }

        return new Response(JSON.stringify({ success: true, message: "Dados removidos. Backup automático criado." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "simulate_corruption": {
        // First create automatic backup
        const snapshot: Record<string, unknown[]> = {};
        for (const table of BACKUP_TABLES) {
          const { data } = await admin.from(table).select("*");
          snapshot[table] = data || [];
        }

        await admin.from("resilience_backups").insert({
          label: `[Auto] Antes de corrupção - ${new Date().toLocaleString("pt-BR")}`,
          snapshot_data: snapshot,
          tables_included: BACKUP_TABLES,
          created_by: user.id,
        });

        // Corrupt data: set null/invalid values in listings and profiles
        const { data: listings } = await admin.from("listings").select("id").limit(5);
        if (listings) {
          for (const l of listings) {
            await admin.from("listings").update({ title: "CORRUPTED_DATA_" + Math.random(), price: -999, city: "", state: "" }).eq("id", l.id);
          }
        }

        const { data: profiles } = await admin.from("profiles").select("id").limit(5);
        if (profiles) {
          for (const p of profiles) {
            await admin.from("profiles").update({ full_name: "CORRUPTED_" + Math.random(), phone: "INVALID" }).eq("id", p.id);
          }
        }

        return new Response(JSON.stringify({ success: true, message: "Dados corrompidos. Backup automático criado." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "list_backups": {
        const { data, error } = await admin
          .from("resilience_backups")
          .select("id, label, tables_included, created_at")
          .order("created_at", { ascending: false })
          .limit(20);

        if (error) throw new Error(error.message);

        return new Response(JSON.stringify({ backups: data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "delete_backup": {
        if (!backup_id) throw new Error("backup_id é obrigatório");
        await admin.from("resilience_backups").delete().eq("id", backup_id);
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Ação inválida" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
