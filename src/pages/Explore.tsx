import { useState, useEffect, useMemo } from "react";
import { destinations } from "@/data/mockData";
import type { Room } from "@/data/mockData";
import RoomCard from "@/components/RoomCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { MapPin, TrendingUp } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { mapListingToRoom, enrichRoomsWithReviews } from "@/lib/listings";
import { generateDemoRooms } from "@/lib/demoRooms";

const FILTERS = ["Todos", "São Paulo", "Rio de Janeiro", "Gramado"];

const Explore = () => {
  const { favoriteIds, toggleFavorite } = useFavorites();
  const { t } = useLanguage();
  const [realRooms, setRealRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("Todos");

  const demoRooms = useMemo(() => generateDemoRooms(), []);

  useEffect(() => {
    supabase.from("listings").select("*").then(async ({ data }) => {
      if (data) setRealRooms(await enrichRoomsWithReviews(data.map(mapListingToRoom)));
      setLoading(false);
    });
  }, []);

  const allRooms = useMemo(() => [...realRooms, ...demoRooms], [realRooms, demoRooms]);
  const filtered = filter === "Todos" ? allRooms : allRooms.filter((r) => r.city === filter);

  const destinationsWithCount = destinations.map((dest) => ({
    ...dest,
    roomCount: allRooms.filter((r) => r.city === dest.name).length,
  }));

  return (
    <div className="container-page py-8 sm:py-12">
      <div className="animate-fade-in">
        <h1 className="mb-1 font-heading text-3xl font-bold text-foreground sm:text-4xl">{t("explore.title")}</h1>
        <p className="mb-10 text-muted-foreground">{t("explore.subtitle")}</p>
      </div>

      <div className="mb-14">
        <h2 className="mb-5 flex items-center gap-2 font-heading text-xl font-semibold text-foreground sm:text-2xl">
          <MapPin className="h-5 w-5 text-primary" /> {t("explore.trending")}
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {destinationsWithCount.map((dest, i) => (
            <Link
              key={dest.id}
              to={`/buscar?city=${encodeURIComponent(dest.name)}`}
              style={{ animationDelay: `${i * 80}ms` }}
              className="group relative overflow-hidden rounded-2xl shadow-card transition-all duration-300 hover:shadow-elevated hover:-translate-y-1 animate-fade-in"
            >
              <div className="aspect-[3/2]">
                <img src={dest.image} alt={dest.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 p-5">
                <h3 className="font-heading text-2xl font-bold text-white">{dest.name}</h3>
                <p className="text-sm text-white/90">{dest.roomCount} {t("destinations.rooms")}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="flex items-center gap-2 font-heading text-xl font-semibold text-foreground sm:text-2xl">
          <TrendingUp className="h-5 w-5 text-primary" /> {t("explore.hot")}
        </h2>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                filter === f
                  ? "bg-primary text-primary-foreground shadow-card"
                  : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-80 w-full rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((room, i) => (
            <div key={room.id} style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }} className="animate-fade-in">
              <RoomCard room={room} isFavorite={favoriteIds.has(room.id)} onToggleFavorite={toggleFavorite} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Explore;
