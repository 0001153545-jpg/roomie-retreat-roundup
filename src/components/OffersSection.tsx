import { useState, useEffect } from "react";
import type { Room } from "@/data/mockData";
import RoomCard from "./RoomCard";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { mapListingToRoom } from "@/lib/listings";

const OffersSection = () => {
  const { t } = useLanguage();
  const [offers, setOffers] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("listings").select("*").gt("discount_percent", 0).then(({ data }) => {
      if (data) setOffers(data.map(mapListingToRoom));
      setLoading(false);
    });
  }, []);

  if (!loading && offers.length === 0) return null;

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
