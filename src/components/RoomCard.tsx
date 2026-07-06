import { Link } from "react-router-dom";
import { Star, MapPin, Heart, Users, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Room } from "@/data/mockData";
import { useLanguage } from "@/contexts/LanguageContext";
import PriceDisplay from "@/components/PriceDisplay";
import { useAutoTranslate } from "@/hooks/useAutoTranslate";

interface RoomCardProps {
  room: Room;
  isFavorite?: boolean;
  onToggleFavorite?: (roomId: string) => void;
}

const RoomCard = ({ room, isFavorite, onToggleFavorite }: RoomCardProps) => {
  const { t } = useLanguage();

  const baseTitle = t(`room.name.${room.id}`) !== `room.name.${room.id}` ? t(`room.name.${room.id}`) : room.title;
  const roomTitle = useAutoTranslate(baseTitle, "pt");

  const inner = (
    <>
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={room.image}
          alt={roomTitle}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        {/* Bottom gradient */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleFavorite?.(room.id);
          }}
          className="absolute right-3 top-3 rounded-full bg-card/90 p-2 backdrop-blur-md transition-all hover:scale-110 hover:bg-card shadow-card"
          aria-label="Favoritar"
        >
          <Heart className={`h-4 w-4 transition-colors ${isFavorite ? "fill-red-500 text-red-500" : "text-foreground"}`} />
        </button>

        {/* Top-left badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5 items-start">
          {room.superHost && (
            <Badge className="bg-card/95 text-foreground border-0 backdrop-blur-md shadow-card gap-1">
              <Award className="h-3 w-3 text-primary" /> Super Host
            </Badge>
          )}
          {room.originalPrice && (
            <Badge className="bg-primary text-primary-foreground border-0 shadow-card">
              {Math.round((1 - room.price / room.originalPrice) * 100)}% OFF
            </Badge>
          )}
        </div>

        {/* Rating badge bottom-left over gradient */}
        {room.reviewCount > 0 && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-card/95 px-2.5 py-1 backdrop-blur-md shadow-card">
            <Star className="h-3.5 w-3.5 fill-accent text-accent" />
            <span className="text-xs font-semibold text-foreground tabular-nums">{room.rating.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground tabular-nums">({room.reviewCount})</span>
          </div>
        )}

        {/* Category chip bottom-right */}
        {room.category && (
          <div className="absolute bottom-3 right-3 rounded-full bg-card/90 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur-md shadow-card">
            {room.category}
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="mb-1 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          {room.city}, {room.state}
        </div>
        <h3 className="font-heading text-base font-semibold text-card-foreground line-clamp-1">{roomTitle}</h3>
        <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
          {room.reviewCount === 0 && (
            <span className="text-xs italic">{t("search.noReviews") !== "search.noReviews" ? t("search.noReviews") : "Sem avaliações"}</span>
          )}
          <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{room.guests}</span>
          {room.bedrooms != null && <span className="text-xs">· {room.bedrooms} quartos</span>}
          {room.bathrooms != null && <span className="text-xs">· {room.bathrooms} banh.</span>}
        </div>
        <div className="mt-3 flex items-baseline flex-wrap gap-2">
          {room.originalPrice && <PriceDisplay value={room.originalPrice} size="sm" strikethrough />}
          <PriceDisplay value={room.price} size="lg" />
          <span className="text-sm text-muted-foreground">{t("search.night")}</span>
        </div>
      </div>
    </>
  );

  const shell = "group block overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card transition-all duration-300 hover:shadow-elevated hover:-translate-y-1";

  if (room.demo) {
    return <div className={shell}>{inner}</div>;
  }

  return (
    <Link to={`/quarto/${room.id}`} className={shell}>
      {inner}
    </Link>
  );
};

export default RoomCard;
