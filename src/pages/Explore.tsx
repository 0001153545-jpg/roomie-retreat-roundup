import { useState, useEffect } from "react";
import { destinations, rooms as mockRooms } from "@/data/mockData";
import type { Room } from "@/data/mockData";
import RoomCard from "@/components/RoomCard";
import { Link } from "react-router-dom";
import { MapPin, TrendingUp } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

const Explore = () => {
  const { favoriteIds, toggleFavorite } = useFavorites();
  const { t } = useLanguage();
  const [dbListings, setDbListings] = useState<Room[]>([]);

  useEffect(() => {
    supabase.from("listings").select("*").then(({ data }) => {
      if (data) {
        const converted: Room[] = data.map((l: any) => ({
          id: l.id, title: l.title, description: l.description || "",
          city: l.city, state: l.state,
          price: l.discount_percent > 0 ? l.price * (1 - l.discount_percent / 100) : l.price,
          originalPrice: l.discount_percent > 0 ? l.price : undefined,
          rating: 4.5, reviewCount: 0, guests: l.guests,
          image: l.image_url || "/placeholder.svg",
          images: l.images?.length > 0 ? l.images : [l.image_url || "/placeholder.svg"],
          amenities: ["Wi-Fi"], type: l.type, host: l.title,
          hostAvatar: l.title.slice(0, 2).toUpperCase(),
        }));
        setDbListings(converted);
      }
    });
  }, []);

  const allRooms = [...mockRooms, ...dbListings.filter(l => !mockRooms.some(r => r.id === l.id))];

  const destinationsWithCount = destinations.map((dest) => {
    const count = allRooms.filter((r) => r.city === dest.name).length;
    return { ...dest, roomCount: count };
  });

  return (
    <div className="container-page py-8">
      <h1 className="mb-1 font-heading text-2xl font-bold text-foreground sm:text-3xl">{t("explore.title")}</h1>
      <p className="mb-8 text-muted-foreground">{t("explore.subtitle")}</p>

      <div className="mb-12">
        <h2 className="mb-4 flex items-center gap-2 font-heading text-xl font-semibold text-foreground">
          <MapPin className="h-5 w-5 text-primary" /> {t("explore.trending")}
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {destinationsWithCount.map((dest) => (
            <Link key={dest.id} to={`/buscar?city=${encodeURIComponent(dest.name)}`} className="group relative overflow-hidden rounded-xl">
              <div className="aspect-[3/2]">
                <img src={dest.image} alt={dest.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-secondary/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 p-5">
                <h3 className="font-heading text-xl font-bold text-primary-foreground">{dest.name}</h3>
                <p className="text-sm text-primary-foreground/80">{dest.roomCount} {t("destinations.rooms")}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <h2 className="mb-4 flex items-center gap-2 font-heading text-xl font-semibold text-foreground">
        <TrendingUp className="h-5 w-5 text-primary" /> {t("explore.hot")}
      </h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {allRooms.slice(0, 9).map((room) => (
          <RoomCard key={room.id} room={room} isFavorite={favoriteIds.has(room.id)} onToggleFavorite={toggleFavorite} />
        ))}
      </div>
    </div>
  );
};

export default Explore;
