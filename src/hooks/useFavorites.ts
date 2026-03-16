import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const useFavorites = () => {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) { setFavoriteIds(new Set()); return; }
    supabase.from("favorites").select("room_id").eq("user_id", user.id)
      .then(({ data }) => {
        if (data) setFavoriteIds(new Set(data.map((f: any) => f.room_id)));
      });
  }, [user]);

  const toggleFavorite = useCallback(async (roomId: string) => {
    if (!user) { toast.error("Faça login para favoritar"); return; }

    if (favoriteIds.has(roomId)) {
      setFavoriteIds((prev) => { const n = new Set(prev); n.delete(roomId); return n; });
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("room_id", roomId);
      toast.success("Removido dos favoritos");
    } else {
      setFavoriteIds((prev) => new Set(prev).add(roomId));
      await supabase.from("favorites").insert({ user_id: user.id, room_id: roomId });
      toast.success("Adicionado aos favoritos ❤️");
    }
  }, [user, favoriteIds]);

  return { favoriteIds, toggleFavorite };
};
