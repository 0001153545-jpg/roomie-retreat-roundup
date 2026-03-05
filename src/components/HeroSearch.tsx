import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, CalendarDays, Users, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cities } from "@/data/mockData";
import heroImage from "@/assets/hero-hotel.jpg";

const HeroSearch = () => {
  const navigate = useNavigate();
  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const handleDestinationChange = (value: string) => {
    setDestination(value);
    if (value.length > 0) {
      const filtered = cities.filter((c) =>
        c.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 5));
    } else {
      setSuggestions([]);
    }
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (destination) params.set("city", destination);
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    if (guests) params.set("guests", guests);
    navigate(`/buscar?${params.toString()}`);
  };

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Hotel de luxo com vista para o mar"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-secondary/90 via-secondary/70 to-secondary/40" />
      </div>

      <div className="container-page relative py-20 sm:py-28 lg:py-36">
        <div className="max-w-2xl animate-fade-in">
          <h1 className="font-heading text-3xl font-bold leading-tight text-primary-foreground sm:text-4xl lg:text-5xl xl:text-6xl">
            Encontre a hospedagem{" "}
            <span className="text-accent">perfeita</span>
          </h1>
          <p className="mt-4 text-base text-primary-foreground/80 sm:text-lg">
            Descubra hotéis, pousadas e quartos incríveis em todo o Brasil.
            Reserve com segurança e ao melhor preço.
          </p>
        </div>

        {/* Search bar */}
        <div className="mt-8 animate-fade-in rounded-2xl bg-card p-3 shadow-hero sm:mt-10 sm:p-4" style={{ animationDelay: "0.2s" }}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="relative lg:col-span-1">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Destino</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Para onde?"
                  value={destination}
                  onChange={(e) => handleDestinationChange(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              {suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-lg border border-border bg-card shadow-elevated">
                  {suggestions.map((city) => (
                    <button
                      key={city}
                      onClick={() => {
                        setDestination(city);
                        setSuggestions([]);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                    >
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      {city}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Check-in</label>
              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Check-out</label>
              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Hóspedes</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <select
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? "hóspede" : "hóspedes"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-end">
              <Button onClick={handleSearch} className="w-full gap-2 py-5 text-base shadow-hero">
                <Search className="h-4 w-4" />
                Buscar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSearch;
