import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const ChatBell = () => {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) { setUnread(0); return; }

    let mounted = true;
    const load = async () => {
      // Get all conversations where I'm guest or host
      const { data: convs } = await supabase
        .from("conversations")
        .select("id, guest_id, host_id")
        .or(`guest_id.eq.${user.id},host_id.eq.${user.id}`);
      if (!convs || !mounted) return;

      const convIds = convs.map((c) => c.id);
      if (convIds.length === 0) { setUnread(0); return; }

      // Count messages in those conversations not sent by me and not read by my role
      const guestConvIds = convs.filter((c) => c.guest_id === user.id).map((c) => c.id);
      const hostConvIds = convs.filter((c) => c.host_id === user.id).map((c) => c.id);

      let total = 0;
      if (guestConvIds.length > 0) {
        const { count } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .in("conversation_id", guestConvIds)
          .neq("sender_id", user.id)
          .eq("read_by_guest", false);
        total += count || 0;
      }
      if (hostConvIds.length > 0) {
        const { count } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .in("conversation_id", hostConvIds)
          .neq("sender_id", user.id)
          .eq("read_by_host", false);
        total += count || 0;
      }
      if (mounted) setUnread(total);
    };

    load();

    const channel = supabase
      .channel(`chatbell-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => load())
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (!user) return null;

  return (
    <Button asChild variant="ghost" size="icon" className="relative hidden sm:flex">
      <Link to="/mensagens" aria-label="Mensagens">
        <MessageCircle className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </Link>
    </Button>
  );
};

export default ChatBell;
