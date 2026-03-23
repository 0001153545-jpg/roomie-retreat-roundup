import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { rooms as mockRooms } from "@/data/mockData";
import type { Room } from "@/data/mockData";
import RoomCard from "@/components/RoomCard";
import { Search, SlidersHorizontal, MapPin, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFavorites } from "@/hooks/useFavorites";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";

const amenityFilters = ["Wi-Fi", "Ar condicionado", "Piscina", "Café da manhã", "Estacionamento", "Aceita animais"];

const SearchRooms = () => {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const [searchParams] = useSearchParams();
  const initialCity = searchParams.get("city") || "";
  const checkInParam = searchParams.get("checkIn") || "";
  const checkOutParam = searchParams.get("checkOut") || "";
  const guestsParam = searchParams.get("guests") || "";

  const [cityFilter, setCityFilter] = useState(initialCity);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("rating");
  const [showFilters, setShowFilters] = useState(false);
  const { favoriteIds, toggleFavorite } = useFavorites();
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
        }));
        setDbListings(converted);
      }
    });
  }, []);

  const toggleAmenity = (a: string) => {
    setSelectedAmenities((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);
  };

  const allRooms = useMemo(() => {
    // Merge mock rooms with DB listings, DB listings take priority by not duplicating ids
    const mockIds = new Set(mockRooms.map(r => r.id));
    return [...mockRooms, ...dbListings.filter(l => !mockIds.has(l.id))];
  }, [dbListings]);

  const filtered = useMemo(() => {
    const guestsFilter = guestsParam ? Number(guestsParam) : 0;
    let result = allRooms.filter((r) => {
      if (cityFilter && !r.city.toLowerCase().includes(cityFilter.toLowerCase())) return false;
      if (r.price > maxPrice) return false;
      if (selectedAmenities.length > 0 && !selectedAmenities.every((a) => r.amenities.includes(a))) return false;
      if (guestsFilter > 0 && r.guests < guestsFilter) return false;
      return true;
    });
    result.sort((a, b) => {
      if (sortBy === "price") return a.price - b.price;
      if (sortBy === "rating") return b.rating - a.rating;
      return b.reviewCount - a.reviewCount;
    });
    return result;
  }, [cityFilter, maxPrice, selectedAmenities, sortBy, guestsParam, allRooms]);

  const sortOptions = [
    { value: "rating", label: t("search.bestRating") },
    { value: "price", label: t("search.lowestPrice") },
    { value: "popular", label: t("search.mostPopular") },
  ];

  return (
    <div className="container-page py-8">
      <h1 className="mb-1 font-heading text-2xl font-bold text-foreground sm:text-3xl">{t("search.title")}</h1>
      <p className="mb-6 text-muted-foreground">
        {filtered.length} {t("search.found")}
        {checkInParam && checkOutParam && (
          <span> · {new Date(checkInParam + "T12:00:00").toLocaleDateString()} → {new Date(checkOutParam + "T12:00:00").toLocaleDateString()}</span>
        )}
        {guestsParam && <span> · {guestsParam} {t("hero.guestsPlural")}</span>}
      </p>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder={t("search.filterCity")} value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}
            className="w-full rounded-lg border border-input bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="relative">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
            className="styled-select appearance-none rounded-xl border border-input bg-card px-4 py-2.5 pr-10 text-sm font-medium text-foreground shadow-card outline-none transition-all focus:ring-2 focus:ring-ring hover:shadow-elevated cursor-pointer">
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>

        <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="gap-2 rounded-xl shadow-card hover:shadow-elevated">
          <SlidersHorizontal className="h-4 w-4" />{t("search.filters")}
        </Button>
      </div>

      {showFilters && (
        <div className="mb-6 rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-foreground">{t("search.maxPrice")}: {formatPrice(maxPrice)}</label>
            <input type="range" min={50} max={1000} step={10} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="styled-range w-full" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">{t("search.amenities")}</label>
            <div className="flex flex-wrap gap-2">
              {amenityFilters.map((a) => (
                <Badge key={a} variant={selectedAmenities.includes(a) ? "default" : "outline"}
                  className="cursor-pointer transition-all hover:scale-105" onClick={() => toggleAmenity(a)}>
                  {a}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((room) => (
            <RoomCard key={room.id} room={room} isFavorite={favoriteIds.has(room.id)} onToggleFavorite={toggleFavorite} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
          <h3 className="font-heading text-lg font-semibold text-foreground">{t("search.noResults")}</h3>
          <p className="text-muted-foreground">{t("search.adjustFilters")}</p>
        </div>
      )}
    </div>
  );
};

export default SearchRooms;
