import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ConvRow {
  id: string; guest_id: string; host_id: string; last_message_at: string | null;
  last_check_out: string | null;
}

interface PartnerInfo {
  user_id: string; full_name: string | null; avatar_url: string | null; account_type: string;
}

const Conversations = () => {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [convs, setConvs] = useState<ConvRow[]>([]);
  const [partners, setPartners] = useState<Record<string, PartnerInfo>>({});
  const [unread, setUnread] = useState<Record<string, number>>({});
  const [lastMsgs, setLastMsgs] = useState<Record<string, string>>({});
  const [fetching, setFetching] = useState(true);

  useEffect(() => { if (!loading && !user) navigate("/login"); }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("conversations")
        .select("*")
        .or(`guest_id.eq.${user.id},host_id.eq.${user.id}`)
        .order("last_message_at", { ascending: false, nullsFirst: false });
      const list = (data || []) as ConvRow[];
      setConvs(list);

      if (list.length > 0) {
        const partnerIds = list.map((c) => (c.guest_id === user.id ? c.host_id : c.guest_id));
        const { data: profs } = await supabase.rpc("get_public_profiles", { target_user_ids: partnerIds });
        if (profs) {
          const map: Record<string, PartnerInfo> = {};
          (profs as any[]).forEach((p) => { map[p.user_id] = p; });
          setPartners(map);
        }

        // Last message previews + unread counts (per conversation)
        const previews: Record<string, string> = {};
        const counts: Record<string, number> = {};
        await Promise.all(list.map(async (c) => {
          const { data: msgs } = await supabase
            .from("messages").select("body, image_url, sender_id").eq("conversation_id", c.id)
            .order("created_at", { ascending: false }).limit(1);
          if (msgs && msgs[0]) previews[c.id] = msgs[0].body || (msgs[0].image_url ? "📷 Imagem" : "");

          const isGuest = c.guest_id === user.id;
          const field = isGuest ? "read_by_guest" : "read_by_host";
          const { count } = await supabase.from("messages").select("id", { count: "exact", head: true })
            .eq("conversation_id", c.id).neq("sender_id", user.id).eq(field, false);
          counts[c.id] = count || 0;
        }));
        setLastMsgs(previews);
        setUnread(counts);
      }
      setFetching(false);
    })();
  }, [user]);

  if (loading || fetching) {
    return <div className="container-page flex min-h-[60vh] items-center justify-center"><p className="text-muted-foreground">Carregando...</p></div>;
  }

  return (
    <div className="container-page py-8">
      <h1 className="mb-6 font-heading text-2xl font-bold text-foreground">Mensagens</h1>
      {convs.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-12 text-center">
          <MessageCircle className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-muted-foreground">Você ainda não tem conversas.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {convs.map((c) => {
            const partnerId = c.guest_id === user!.id ? c.host_id : c.guest_id;
            const p = partners[partnerId];
            const name = p?.full_name || (p?.account_type === "owner" ? "Anfitrião" : "Hóspede");
            const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
            const u = unread[c.id] || 0;
            return (
              <Link key={c.id} to={`/chat?id=${c.id}`}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-muted">
                <Avatar className="h-12 w-12">
                  {p?.avatar_url && <AvatarImage src={p.avatar_url} alt={name} />}
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-foreground truncate">{name}</p>
                    {c.last_message_at && (
                      <span className="text-xs text-muted-foreground shrink-0">
                        {new Date(c.last_message_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{lastMsgs[c.id] || "Sem mensagens ainda"}</p>
                </div>
                {u > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                    {u > 99 ? "99+" : u}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Conversations;
