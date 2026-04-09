import { useState, useEffect, useMemo } from "react";
import { rooms as mockRooms } from "@/data/mockData";
import type { Room } from "@/data/mockData";
import RoomCard from "./RoomCard";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

const OffersSection = () => {
  const { t } = useLanguage();
  const [dbListings, setDbListings] = useState<Room[]>([]);

  useEffect(() => {
    supabase.from("listings").select("*").eq("discount_percent", 0).not("discount_percent", "gt", 0)
      // fetch all, filter client-side for discounts
    supabase.from("listings").select("*").then(({ data }) => {
      if (data) {
        const converted: Room[] = data
          .filter((l: any) => l.discount_percent > 0)
          .map((l: any) => ({
            id: l.id,
            title: l.title,
            description: l.description || "",
            city: l.city,
            state: l.state,
            price: l.price * (1 - l.discount_percent / 100),
            originalPrice: l.price,
            rating: 4.5,
            reviewCount: 0,
            guests: l.guests,
            image: l.image_url || "/placeholder.svg",
            images: l.images?.length > 0 ? l.images : [l.image_url || "/placeholder.svg"],
            amenities: ["Wi-Fi"],
            type: l.type,
            host: l.title,
            hostAvatar: l.title.slice(0, 2).toUpperCase(),
          }));
        setDbListings(converted);
      }
    });
  }, []);

  const offers = useMemo(() => {
    const mockOffers = mockRooms.filter(r => r.originalPrice);
    const mockIds = new Set(mockOffers.map(r => r.id));
    return [...mockOffers, ...dbListings.filter(l => !mockIds.has(l.id))];
  }, [dbListings]);

  if (offers.length === 0) return null;

  return (
    <section className="container-page py-16">
      <h2 className="mb-2 font-heading text-2xl font-bold text-foreground sm:text-3xl">{t("offers.title")}</h2>
      <p className="mb-8 text-muted-foreground">{t("offers.subtitle")}</p>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {offers.map((room) => (
          <RoomCard key={room.id} room={room} />
        ))}
      </div>
    </section>
  );
};

export default OffersSection;
