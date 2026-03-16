import { rooms } from "@/data/mockData";
import RoomCard from "@/components/RoomCard";
import { useFavorites } from "@/hooks/useFavorites";
import { useLanguage } from "@/contexts/LanguageContext";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Favorites = () => {
  const { favoriteIds, toggleFavorite } = useFavorites();
  const { t } = useLanguage();
  const favoriteRooms = rooms.filter((r) => favoriteIds.has(r.id));

  return (
    <div className="container-page py-8">
      <h1 className="mb-1 font-heading text-2xl font-bold text-foreground sm:text-3xl">
        {t("favorites.title")}
      </h1>
      <p className="mb-6 text-muted-foreground">{t("favorites.subtitle")}</p>

      {favoriteRooms.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {favoriteRooms.map((room) => (
            <RoomCard key={room.id} room={room} isFavorite onToggleFavorite={toggleFavorite} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-12 text-center">
          <Heart className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-muted-foreground">{t("favorites.empty")}</p>
          <Link to="/buscar">
            <Button>{t("favorites.explore")}</Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default Favorites;
