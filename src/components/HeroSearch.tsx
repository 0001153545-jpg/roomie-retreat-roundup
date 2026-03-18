import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, CalendarDays, Users, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cities } from "@/data/mockData";
import { useLanguage } from "@/contexts/LanguageContext";
import { format, addMonths, isBefore, startOfDay, addDays } from "date-fns";
import { pt, es, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import heroImage from "@/assets/hero-hotel.jpg";

const HeroSearch = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [destination, setDestination] = useState("");
  const [checkInDate, setCheckInDate] = useState<Date | undefined>();
  const [checkOutDate, setCheckOutDate] = useState<Date | undefined>();
  const [guests, setGuests] = useState("2");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkOutOpen, setCheckOutOpen] = useState(false);

  const today = startOfDay(new Date());
  const maxDate = addMonths(today, 6);
  const dateLocale = language === "pt" ? pt : language === "es" ? es : enUS;

  const handleDestinationChange = (value: string) => {
    setDestination(value);
    if (value.length > 0) {
      const filtered = cities.filter((c) => c.toLowerCase().includes(value.toLowerCase()));
      setSuggestions(filtered.slice(0, 5));
    } else {
      setSuggestions([]);
    }
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (destination) params.set("city", destination);
    if (checkInDate) params.set("checkIn", format(checkInDate, "yyyy-MM-dd"));
    if (checkOutDate) params.set("checkOut", format(checkOutDate, "yyyy-MM-dd"));
    if (guests) params.set("guests", guests);
    navigate(`/buscar?${params.toString()}`);
  };

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img src={heroImage} alt="Hotel de luxo com vista para o mar" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-secondary/90 via-secondary/70 to-secondary/40" />
      </div>

      <div className="container-page relative py-20 sm:py-28 lg:py-36">
        <div className="max-w-2xl animate-fade-in">
          <h1 className="font-heading text-3xl font-bold leading-tight text-primary-foreground sm:text-4xl lg:text-5xl xl:text-6xl">
            {t("hero.title1")}{" "}
            <span className="text-accent">{t("hero.title2")}</span>
          </h1>
          <p className="mt-4 text-base text-primary-foreground/80 sm:text-lg">{t("hero.subtitle")}</p>
        </div>

        <div className="mt-8 animate-fade-in rounded-2xl bg-card p-3 shadow-hero sm:mt-10 sm:p-4" style={{ animationDelay: "0.2s" }}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {/* Destination */}
            <div className="relative lg:col-span-1">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("hero.destination")}</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input type="text" placeholder={t("hero.destinationPlaceholder")} value={destination} onChange={(e) => handleDestinationChange(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
              {suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-lg border border-border bg-card shadow-elevated">
                  {suggestions.map((city) => (
                    <button key={city} onClick={() => { setDestination(city); setSuggestions([]); }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />{city}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Check-in */}
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("hero.checkIn")}</label>
              <Popover open={checkInOpen} onOpenChange={setCheckInOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-[42px]", !checkInDate && "text-muted-foreground")}>
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {checkInDate ? format(checkInDate, "dd/MM/yyyy") : t("room.selectDate")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={checkInDate}
                    onSelect={(d) => { setCheckInDate(d); setCheckInOpen(false); if (d && checkOutDate && checkOutDate <= d) setCheckOutDate(undefined); }}
                    disabled={(date) => isBefore(date, today) || date > maxDate}
                    locale={dateLocale} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>

            {/* Check-out */}
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("hero.checkOut")}</label>
              <Popover open={checkOutOpen} onOpenChange={setCheckOutOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-[42px]", !checkOutDate && "text-muted-foreground")}>
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {checkOutDate ? format(checkOutDate, "dd/MM/yyyy") : t("room.selectDate")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={checkOutDate}
                    onSelect={(d) => { setCheckOutDate(d); setCheckOutOpen(false); }}
                    disabled={(date) => isBefore(date, checkInDate ? addDays(checkInDate, 1) : addDays(today, 1)) || date > maxDate}
                    locale={dateLocale} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>

            {/* Guests */}
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("hero.guests")}</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <select value={guests} onChange={(e) => setGuests(e.target.value)}
                  className="styled-select w-full rounded-lg border border-input bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring appearance-none">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>{n} {n === 1 ? t("hero.guest") : t("hero.guestsPlural")}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-end">
              <Button onClick={handleSearch} className="w-full gap-2 py-5 text-base shadow-hero">
                <Search className="h-4 w-4" />{t("hero.searchBtn")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSearch;
