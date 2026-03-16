import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { useEffect } from "react";

export const useFavorites = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) { setFavoriteIds(new Set()); return; }
    supabase.from("favorites").select("room_id").eq("user_id", user.id)
      .then(({ data }) => {
        if (data) setFavoriteIds(new Set(data.map((f: any) => f.room_id)));
      });
  }, [user]);

  const toggleFavorite = useCallback(async (roomId: string) => {
    if (!user) { toast.error(t("common.loginToFavorite")); return; }

    if (favoriteIds.has(roomId)) {
      setFavoriteIds((prev) => { const n = new Set(prev); n.delete(roomId); return n; });
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("room_id", roomId);
      toast.success(t("common.removedFavorite"));
    } else {
      setFavoriteIds((prev) => new Set(prev).add(roomId));
      await supabase.from("favorites").insert({ user_id: user.id, room_id: roomId });
      toast.success(t("common.addedFavorite"));
    }
  }, [user, favoriteIds, t]);

  return { favoriteIds, toggleFavorite };
};
