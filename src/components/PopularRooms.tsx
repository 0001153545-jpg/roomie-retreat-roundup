import { useState, useEffect, useMemo } from "react";
import { rooms as mockRooms } from "@/data/mockData";
import type { Room } from "@/data/mockData";
import RoomCard from "./RoomCard";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/useFavorites";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

const PopularRooms = () => {
  const { favoriteIds, toggleFavorite } = useFavorites();
  const { t } = useLanguage();
  const [dbListings, setDbListings] = useState<Room[]>([]);

  useEffect(() => {
    supabase.from("listings").select("*").then(({ data }) => {
      if (data) {
        const converted: Room[] = data.map((l: any) => ({
          id: l.id,
          title: l.title,
          description: l.description || "",
          city: l.city,
          state: l.state,
          price: l.discount_percent > 0 ? l.price * (1 - l.discount_percent / 100) : l.price,
          originalPrice: l.discount_percent > 0 ? l.price : undefined,
          rating: 4.5,
          reviewCount: 0,
          guests: l.guests,
          image: l.image_url || "/placeholder.svg",
          images: l.images?.length > 0 ? l.images : [l.image_url || "/placeholder.svg"],
          amenities: ["Wi-Fi"],
          type: l.type,
          host: l.title,
          hostAvatar: l.title.slice(0, 2).toUpperCase(),
          featured: true,
        }));
        setDbListings(converted);
      }
    });
  }, []);

  const allRooms = useMemo(() => {
    const mockIds = new Set(mockRooms.map(r => r.id));
    const allMerged = [...mockRooms, ...dbListings.filter(l => !mockIds.has(l.id))];
    return allMerged.filter(r => r.featured);
  }, [dbListings]);

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
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {allRooms.map((room) => (
          <RoomCard key={room.id} room={room} isFavorite={favoriteIds.has(room.id)} onToggleFavorite={toggleFavorite} />
        ))}
      </div>
    </section>
  );
};

export default PopularRooms;
