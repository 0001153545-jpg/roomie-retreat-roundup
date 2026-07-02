import { Link } from "react-router-dom";
import { Star, MapPin, Heart, Users, BedDouble, Bath } from "lucide-react";
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

  const Wrapper: any = room.demo ? "div" : Link;
  const wrapperProps: any = room.demo ? {} : { to: `/quarto/${room.id}` };
  const discountPct = room.originalPrice ? Math.round((1 - room.price / room.originalPrice) * 100) : 0;

  const inner = (
    <>
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={room.image}
          alt={roomTitle}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Top row: super host + favorite */}
        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1.5">
            {room.superHost && (
              <Badge className="bg-white/95 text-foreground border-0 shadow-sm backdrop-blur">★ Super Host</Badge>
            )}
            {room.originalPrice && (
              <Badge className="bg-primary text-primary-foreground border-0 shadow-sm">{discountPct}% OFF</Badge>
            )}
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite?.(room.id);
            }}
            className="rounded-full bg-card/85 p-2 backdrop-blur transition-all hover:scale-110 hover:bg-card"
            aria-label="Favoritar"
          >
            <Heart className={`h-4 w-4 transition-colors ${isFavorite ? "fill-red-500 text-red-500" : "text-foreground"}`} />
          </button>
        </div>

        {/* Rating bottom-left over gradient */}
        {room.reviewCount > 0 && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-foreground shadow-sm backdrop-blur">
            <Star className="h-3.5 w-3.5 fill-accent text-accent" />
            <span className="tabular-nums">{room.rating.toFixed(1)}</span>
            <span className="text-muted-foreground font-normal">({room.reviewCount})</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="mb-1 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {room.city}, {room.state}
          </div>
          {room.category && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {room.category}
            </span>
          )}
        </div>
        <h3 className="font-heading text-base font-semibold text-card-foreground line-clamp-1">{roomTitle}</h3>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{room.guests}</span>
          {room.bedrooms && <span className="flex items-center gap-1"><BedDouble className="h-3.5 w-3.5" />{room.bedrooms} qto</span>}
          {room.bathrooms && <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" />{room.bathrooms}</span>}
        </div>

        <div className="mt-3 flex items-baseline flex-wrap gap-2">
          {room.originalPrice && <PriceDisplay value={room.originalPrice} size="sm" strikethrough />}
          <PriceDisplay value={room.price} size="xl" className="text-primary" />
          <span className="text-sm text-muted-foreground">{t("search.night")}</span>
        </div>
      </div>
    </>
  );

  return (
    <Wrapper
      {...wrapperProps}
      className="group block overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all duration-300 hover:shadow-elevated hover:-translate-y-1"
    >
      {inner}
    </Wrapper>
  );
};

export default RoomCard;
