import type { Room } from "@/data/mockData";

const categories = ["Casa", "Apartamento", "Chalé", "Hotel", "Pousada", "Flat", "Studio", "Loft"];

const cityData: Record<string, { state: string; neighborhoods: string[]; adjectives: string[] }> = {
  "São Paulo": {
    state: "SP",
    neighborhoods: ["Jardins", "Vila Madalena", "Pinheiros", "Itaim Bibi", "Moema", "Higienópolis", "Bela Vista", "Consolação"],
    adjectives: ["Moderno", "Elegante", "Aconchegante", "Corporativo", "Design", "Executivo", "Charmoso", "Sofisticado"],
  },
  "Rio de Janeiro": {
    state: "RJ",
    neighborhoods: ["Copacabana", "Ipanema", "Leblon", "Botafogo", "Santa Teresa", "Barra da Tijuca", "Lapa", "Urca"],
    adjectives: ["Beira-mar", "Vista Cristo", "Boêmio", "Praiano", "Vista Pão de Açúcar", "Colonial", "Tropical", "Vista Lagoa"],
  },
  "Gramado": {
    state: "RS",
    neighborhoods: ["Centro", "Bavária", "Planalto", "Várzea Grande", "Serra Grande", "Piratini", "Avenida Borges", "Palace"],
    adjectives: ["Alpino", "Rústico", "Europeu", "Serrano", "Aconchegante", "Romântico", "Vista Montanha", "Charmoso"],
  },
};

const amenityPool = [
  "Wi-Fi", "Ar condicionado", "TV", "Cozinha", "Estacionamento",
  "Piscina", "Café da manhã", "Aquecimento", "Lareira", "Vista panorâmica",
  "Academia", "Spa", "Jacuzzi", "Aceita animais",
];

const hostNames = ["Ana", "Carlos", "Mariana", "Bruno", "Julia", "Ricardo", "Camila", "Diego", "Fernanda", "Lucas"];

function seeded(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function pick<T>(arr: T[], n: number): T { return arr[n % arr.length]; }

export function generateDemoRooms(): Room[] {
  const rooms: Room[] = [];
  Object.entries(cityData).forEach(([city, info]) => {
    for (let i = 0; i < 20; i++) {
      const seed = seeded(`${city}-${i}`);
      const category = pick(categories, seed);
      const neighborhood = pick(info.neighborhoods, seed + 1);
      const adjective = pick(info.adjectives, seed + 3);
      const price = 120 + ((seed * 13) % 780);
      const hasDiscount = seed % 3 === 0;
      const originalPrice = hasDiscount ? Math.round(price * (1.2 + ((seed % 30) / 100))) : undefined;
      const rating = 3.8 + ((seed % 13) / 10);
      const reviewCount = 5 + ((seed * 7) % 340);
      const guests = 1 + (seed % 6);
      const bedrooms = 1 + (seed % 4);
      const beds = bedrooms + ((seed % 3) === 0 ? 1 : 0);
      const bathrooms = 1 + (seed % 3);
      const superHost = seed % 4 === 0;
      const host = pick(hostNames, seed + 5);
      const amenitiesCount = 4 + (seed % 5);
      const amenities = amenityPool.slice(0, amenitiesCount);
      const imgSeed = `${city.replace(/ /g, "")}-${i}`;
      const image = `https://picsum.photos/seed/${imgSeed}/800/600`;
      const images = [0, 1, 2, 3].map((k) => `https://picsum.photos/seed/${imgSeed}-${k}/800/600`);

      rooms.push({
        id: `demo-${city.toLowerCase().replace(/ /g, "-")}-${i}`,
        title: `${category} ${adjective} em ${neighborhood}`,
        description: `Encantador ${category.toLowerCase()} localizado em ${neighborhood}, ${city}. Ambiente ${adjective.toLowerCase()} com todo o conforto para uma estadia inesquecível.`,
        city,
        state: info.state,
        price: Math.round(price),
        originalPrice,
        rating: Math.round(rating * 10) / 10,
        reviewCount,
        guests,
        image,
        images,
        amenities,
        type: category,
        host: `${host} • Anfitrião`,
        hostAvatar: host.slice(0, 2).toUpperCase(),
        superHost,
        bedrooms,
        beds,
        bathrooms,
        category,
        demo: true,
      });
    }
  });
  return rooms;
}
