import { useState, useEffect, useMemo } from "react";
import { destinations } from "@/data/mockData";
import type { Room } from "@/data/mockData";
import RoomCard from "@/components/RoomCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { MapPin, TrendingUp, Sparkles } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { mapListingToRoom, enrichRoomsWithReviews } from "@/lib/listings";
import { generateDemoRooms } from "@/lib/demoRooms";

const CITY_FILTERS = ["Todas", "São Paulo", "Rio de Janeiro", "Gramado"];

const Explore = () => {
  const { favoriteIds, toggleFavorite } = useFavorites();
  const { t } = useLanguage();
  const [realRooms, setRealRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCity, setActiveCity] = useState<string>("Todas");

  const demoRooms = useMemo(() => generateDemoRooms(), []);

  useEffect(() => {
    supabase.from("listings").select("*").then(async ({ data }) => {
      if (data) setRealRooms(await enrichRoomsWithReviews(data.map(mapListingToRoom)));
      setLoading(false);
    });
  }, []);

  const allRooms = useMemo(() => [...realRooms, ...demoRooms], [realRooms, demoRooms]);

  const filteredRooms = useMemo(() => {
    if (activeCity === "Todas") return allRooms;
    return allRooms.filter((r) => r.city === activeCity);
  }, [allRooms, activeCity]);

  const destinationsWithCount = destinations.map((dest) => ({
    ...dest,
    roomCount: allRooms.filter((r) => r.city === dest.name).length,
  }));

  return (
    <div className="container-page py-10 animate-fade-in">
      <div className="mb-8">
        <span className="mb-2 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
          Explorar
        </span>
        <h1 className="mb-1 font-heading text-3xl font-bold text-foreground sm:text-4xl">{t("explore.title")}</h1>
        <p className="text-muted-foreground">{t("explore.subtitle")}</p>
      </div>

      {/* Destinations */}
      <div className="mb-14">
        <h2 className="mb-4 flex items-center gap-2 font-heading text-xl font-semibold text-foreground">
          <MapPin className="h-5 w-5 text-primary" /> {t("explore.trending")}
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {destinationsWithCount.map((dest) => (
            <Link
              key={dest.id}
              to={`/buscar?city=${encodeURIComponent(dest.name)}`}
              className="group relative overflow-hidden rounded-2xl shadow-card transition-all hover:shadow-elevated"
            >
              <div className="aspect-[3/2]">
                <img
                  src={dest.image}
                  alt={dest.name}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 p-5">
                <h3 className="font-heading text-xl font-bold text-white">{dest.name}</h3>
                <p className="text-sm text-white/90">{dest.roomCount} {t("destinations.rooms")}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="flex items-center gap-2 font-heading text-xl font-semibold text-foreground">
          <Sparkles className="h-5 w-5 text-primary" /> Hospedagens em destaque
        </h2>
        <div className="flex flex-wrap gap-2">
          {CITY_FILTERS.map((city) => (
            <button
              key={city}
              onClick={() => setActiveCity(city)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
                activeCity === city
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/5"
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-80 w-full rounded-2xl" />)}
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">Nenhum quarto disponível no momento.</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRooms.map((room) => (
            <RoomCard key={room.id} room={room} isFavorite={favoriteIds.has(room.id)} onToggleFavorite={toggleFavorite} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Explore;
