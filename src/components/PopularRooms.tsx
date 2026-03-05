import { rooms } from "@/data/mockData";
import RoomCard from "./RoomCard";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const PopularRooms = () => {
  const featured = rooms.filter((r) => r.featured);

  return (
    <section className="container-page py-16">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
            Quartos Populares
          </h2>
          <p className="mt-1 text-muted-foreground">
            As hospedagens mais bem avaliadas pelos nossos hóspedes
          </p>
        </div>
        <Link to="/buscar">
          <Button variant="ghost" className="hidden gap-1 sm:inline-flex">
            Ver todos <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {featured.map((room) => (
          <RoomCard key={room.id} room={room} />
        ))}
      </div>
    </section>
  );
};

export default PopularRooms;
