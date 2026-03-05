import { destinations, rooms } from "@/data/mockData";
import RoomCard from "@/components/RoomCard";
import { Link } from "react-router-dom";
import { MapPin, TrendingUp, Sparkles } from "lucide-react";

const Explore = () => {
  return (
    <div className="container-page py-8">
      <h1 className="mb-1 font-heading text-2xl font-bold text-foreground sm:text-3xl">
        Explorar
      </h1>
      <p className="mb-8 text-muted-foreground">
        Descubra os melhores destinos e hospedagens
      </p>

      {/* Destinations */}
      <div className="mb-12">
        <h2 className="mb-4 flex items-center gap-2 font-heading text-xl font-semibold text-foreground">
          <MapPin className="h-5 w-5 text-primary" /> Destinos em Alta
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {destinations.map((dest) => (
            <Link
              key={dest.id}
              to={`/buscar?city=${encodeURIComponent(dest.name)}`}
              className="group relative overflow-hidden rounded-xl"
            >
              <div className="aspect-[3/2]">
                <img src={dest.image} alt={dest.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-secondary/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 p-5">
                <h3 className="font-heading text-xl font-bold text-primary-foreground">{dest.name}</h3>
                <p className="text-sm text-primary-foreground/80">{dest.roomCount.toLocaleString()} hospedagens</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Trending */}
      <h2 className="mb-4 flex items-center gap-2 font-heading text-xl font-semibold text-foreground">
        <TrendingUp className="h-5 w-5 text-primary" /> Em Alta
      </h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.slice(0, 6).map((room) => (
          <RoomCard key={room.id} room={room} />
        ))}
      </div>
    </div>
  );
};

export default Explore;
