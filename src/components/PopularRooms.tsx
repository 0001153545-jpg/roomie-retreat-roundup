import { useState, useEffect } from "react";
import type { Room } from "@/data/mockData";
import RoomCard from "./RoomCard";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useFavorites } from "@/hooks/useFavorites";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { mapListingToRoom } from "@/lib/listings";

const PopularRooms = () => {
  const { favoriteIds, toggleFavorite } = useFavorites();
  const { t } = useLanguage();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("listings").select("*").order("created_at", { ascending: true }).then(({ data }) => {
      if (data) setRooms(data.map(mapListingToRoom));
      setLoading(false);
    });
  }, []);

  return (
    <section className="container-page py-16">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">{t("popular.title")}</h2>
          <p className="mt-1 text-muted-foreground">{t("popular.subtitle")}</p>
        </div>
        <Link to="/buscar">
          <Button variant="ghost" className="hidden gap-1 sm:inline-flex">{t("popular.viewAll")} <ArrowRight className="h-4 w-4" /></Button>
        </Link>
      </div>
      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-80 w-full rounded-xl" />
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">{t("search.noResults") || "Nenhum quarto disponível"}</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} isFavorite={favoriteIds.has(room.id)} onToggleFavorite={toggleFavorite} />
          ))}
        </div>
      )}
    </section>
  );
};

export default PopularRooms;
