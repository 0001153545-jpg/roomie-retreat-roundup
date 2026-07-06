import type { Room } from "@/data/mockData";

// Deterministic pseudo-random for stable demo data
const seeded = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};

const categories = ["Casa", "Apartamento", "Chalé", "Hotel", "Pousada", "Flat", "Loft", "Suíte"];
const adjectives = ["Aconchegante", "Moderno", "Luxuoso", "Charmoso", "Encantador", "Elegante", "Rústico", "Sofisticado", "Panorâmico", "Exclusivo", "Boutique", "Premium"];
const features = ["com Piscina", "Vista para o Mar", "no Centro", "com Varanda", "Beira-Mar", "com Jardim", "Pé na Areia", "com Vista para a Montanha", "com Lareira", "com Terraço", "Duplex", "com Jacuzzi"];

const cities = [
  { name: "São Paulo", state: "SP", seedBase: 1000 },
  { name: "Rio de Janeiro", state: "RJ", seedBase: 2000 },
  { name: "Gramado", state: "RS", seedBase: 3000 },
];

const amenitiesPool = ["Wi-Fi", "Ar condicionado", "Piscina", "Café da manhã", "Estacionamento", "Academia", "Aceita pets", "Lavanderia", "Cozinha equipada", "TV a cabo", "Jacuzzi", "Churrasqueira"];

export const generateDemoRooms = (): Room[] => {
  const rooms: Room[] = [];
  cities.forEach(({ name, state, seedBase }) => {
    const rnd = seeded(seedBase);
    for (let i = 0; i < 22; i++) {
      const cat = categories[Math.floor(rnd() * categories.length)];
      const adj = adjectives[Math.floor(rnd() * adjectives.length)];
      const feat = features[Math.floor(rnd() * features.length)];
      const title = `${cat} ${adj} ${feat}`;
      const guests = 1 + Math.floor(rnd() * 8);
      const bedrooms = 1 + Math.floor(rnd() * 4);
      const beds = bedrooms + Math.floor(rnd() * 2);
      const bathrooms = 1 + Math.floor(rnd() * 3);
      const price = Math.round((120 + rnd() * 880) / 10) * 10;
      const hasDiscount = rnd() > 0.6;
      const rating = Math.round((4.2 + rnd() * 0.8) * 10) / 10;
      const reviewCount = 5 + Math.floor(rnd() * 480);
      const superHost = rnd() > 0.65;
      const seed = seedBase + i;
      const image = `https://picsum.photos/seed/rf${seed}/800/600`;
      const images = [0, 1, 2].map((k) => `https://picsum.photos/seed/rf${seed}${k}/800/600`);
      const shuffled = [...amenitiesPool].sort(() => rnd() - 0.5).slice(0, 4 + Math.floor(rnd() * 4));

      rooms.push({
        id: `demo-${seed}`,
        title,
        description: `${title} em ${name}. Espaço ${adj.toLowerCase()} com ${bedrooms} ${bedrooms > 1 ? "quartos" : "quarto"}, ${bathrooms} ${bathrooms > 1 ? "banheiros" : "banheiro"} e capacidade para até ${guests} hóspedes.`,
        city: name,
        state,
        price: hasDiscount ? Math.round(price * 0.85) : price,
        originalPrice: hasDiscount ? price : undefined,
        rating,
        reviewCount,
        guests,
        image,
        images,
        amenities: shuffled,
        type: cat,
        host: `Anfitrião ${name.split(" ")[0]}`,
        hostAvatar: name.slice(0, 2).toUpperCase(),
        featured: rnd() > 0.7,
        // Extra demo fields
        bedrooms,
        beds,
        bathrooms,
        category: cat,
        superHost,
        demo: true,
      } as Room);
    }
  });
  return rooms;
};
