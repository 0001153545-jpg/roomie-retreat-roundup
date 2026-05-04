import { Link } from "react-router-dom";
import { Star, MapPin, Heart, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Room } from "@/data/mockData";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";

interface RoomCardProps {
  room: Room;
  isFavorite?: boolean;
  onToggleFavorite?: (roomId: string) => void;
}

const RoomCard = ({ room, isFavorite, onToggleFavorite }: RoomCardProps) => {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const roomTitle = t(`room.name.${room.id}`) !== `room.name.${room.id}` ? t(`room.name.${room.id}`) : room.title;

  return (
    <Link to={`/quarto/${room.id}`}
      className="group block overflow-hidden rounded-xl border border-border bg-card shadow-card transition-all hover:shadow-elevated hover:-translate-y-1">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img src={room.image} alt={roomTitle} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFavorite?.(room.id); }}
          className="absolute right-3 top-3 rounded-full bg-card/80 p-2 backdrop-blur transition-colors hover:bg-card">
          <Heart className={`h-4 w-4 transition-colors ${isFavorite ? "fill-red-500 text-red-500" : "text-foreground"}`} />
        </button>
        {room.originalPrice && (
          <Badge className="absolute left-3 top-3 bg-primary text-primary-foreground border-0">
            {Math.round((1 - room.price / room.originalPrice) * 100)}% OFF
          </Badge>
        )}
      </div>
      <div className="p-4">
        <div className="mb-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{room.city}, {room.state}</div>
        <h3 className="font-heading text-base font-semibold text-card-foreground line-clamp-1">{roomTitle}</h3>
        <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
          {room.reviewCount > 0 ? (
            <>
              <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-accent text-accent" />{room.rating.toFixed(1)}</span>
              <span>({room.reviewCount} {t("search.reviews")})</span>
            </>
          ) : (
            <span className="text-xs italic">{t("search.noReviews") !== "search.noReviews" ? t("search.noReviews") : "Sem avaliações"}</span>
          )}
          <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{room.guests}</span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-heading text-lg font-bold text-foreground money">{formatPrice(room.price)}</span>
          {room.originalPrice && <span className="text-sm text-muted-foreground line-through money">{formatPrice(room.originalPrice)}</span>}
          <span className="text-sm text-muted-foreground">{t("search.night")}</span>
        </div>
      </div>
    </Link>
  );
};

export default RoomCard;
