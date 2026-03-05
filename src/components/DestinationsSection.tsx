import { Link } from "react-router-dom";
import { destinations } from "@/data/mockData";

const DestinationsSection = () => {
  return (
    <section className="bg-muted/50 py-16">
      <div className="container-page">
        <h2 className="mb-2 font-heading text-2xl font-bold text-foreground sm:text-3xl">
          Destinos Recomendados
        </h2>
        <p className="mb-8 text-muted-foreground">
          Explore os destinos mais procurados do Brasil
        </p>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {destinations.map((dest) => (
            <Link
              key={dest.id}
              to={`/buscar?city=${encodeURIComponent(dest.name)}`}
              className="group relative overflow-hidden rounded-xl"
            >
              <div className="aspect-[3/2]">
                <img
                  src={dest.image}
                  alt={dest.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-secondary/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 p-5">
                <h3 className="font-heading text-xl font-bold text-primary-foreground">
                  {dest.name}
                </h3>
                <p className="text-sm text-primary-foreground/80">
                  {dest.description}
                </p>
                <p className="mt-1 text-sm font-medium text-accent">
                  {dest.roomCount.toLocaleString()} hospedagens
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DestinationsSection;
