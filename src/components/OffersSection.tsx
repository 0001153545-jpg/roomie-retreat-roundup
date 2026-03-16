import { rooms } from "@/data/mockData";
import RoomCard from "./RoomCard";
import { useLanguage } from "@/contexts/LanguageContext";

const OffersSection = () => {
  const offers = rooms.filter((r) => r.originalPrice);
  const { t } = useLanguage();

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
