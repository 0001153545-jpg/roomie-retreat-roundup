import room1 from "@/assets/room-1.jpg";
import room2 from "@/assets/room-2.jpg";
import room3 from "@/assets/room-3.jpg";
import room4 from "@/assets/room-4.jpg";
import room5 from "@/assets/room-5.jpg";
import room6 from "@/assets/room-6.jpg";
import destBeach from "@/assets/destination-beach.jpg";
import destCity from "@/assets/destination-city.jpg";
import destMountain from "@/assets/destination-mountain.jpg";

export interface Room {
  id: string;
  title: string;
  description: string;
  city: string;
  state: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  guests: number;
  image: string;
  images: string[];
  amenities: string[];
  type: string;
  host: string;
  hostAvatar: string;
  featured?: boolean;
}

export interface Destination {
  id: string;
  name: string;
  image: string;
  roomCount: number;
  description: string;
}

export interface Review {
  id: string;
  userName: string;
  userAvatar: string;
  roomId: string;
  roomTitle: string;
  rating: number;
  comment: string;
  date: string;
}

export const rooms: Room[] = [
  {
    id: "1",
    title: "Suíte Luxo com Vista para o Mar",
    description: "Uma suíte deslumbrante com vista panorâmica para o oceano, decoração sofisticada, cama king-size e banheiro em mármore. Inclui café da manhã e acesso ao spa.",
    city: "Rio de Janeiro",
    state: "RJ",
    price: 450,
    originalPrice: 580,
    rating: 4.9,
    reviewCount: 124,
    guests: 2,
    image: room1,
    images: [room1, room3, room5],
    amenities: ["Wi-Fi", "Ar condicionado", "Piscina", "Café da manhã", "Spa", "Estacionamento"],
    type: "Suíte",
    host: "Hotel Copacabana Palace",
    hostAvatar: "CP",
    featured: true,
  },
  {
    id: "2",
    title: "Quarto Boutique no Centro Histórico",
    description: "Quarto charmoso em hotel boutique localizado no coração do Pelourinho. Decoração artística, wi-fi rápido e café da manhã colonial incluído.",
    city: "Salvador",
    state: "BA",
    price: 220,
    rating: 4.7,
    reviewCount: 89,
    guests: 2,
    image: room2,
    images: [room2, room6],
    amenities: ["Wi-Fi", "Ar condicionado", "Café da manhã"],
    type: "Standard",
    host: "Pousada do Pelourinho",
    hostAvatar: "PP",
  },
  {
    id: "3",
    title: "Suíte Master com Sala de Estar",
    description: "Ampla suíte com sala de estar separada, ideal para famílias ou estadias longas. Vista para a cidade, cozinha compacta e área de trabalho.",
    city: "São Paulo",
    state: "SP",
    price: 380,
    originalPrice: 450,
    rating: 4.8,
    reviewCount: 203,
    guests: 4,
    image: room3,
    images: [room3, room1, room4],
    amenities: ["Wi-Fi", "Ar condicionado", "Estacionamento", "Academia", "Lavanderia"],
    type: "Suíte Master",
    host: "Grand Hyatt SP",
    hostAvatar: "GH",
    featured: true,
  },
  {
    id: "4",
    title: "Penthouse com Vista Panorâmica",
    description: "Cobertura exclusiva no último andar com vista 360° da cidade. Terraço privativo, jacuzzi e serviço de concierge 24h.",
    city: "Curitiba",
    state: "PR",
    price: 650,
    rating: 5.0,
    reviewCount: 45,
    guests: 2,
    image: room4,
    images: [room4, room1],
    amenities: ["Wi-Fi", "Ar condicionado", "Jacuzzi", "Terraço", "Concierge 24h"],
    type: "Penthouse",
    host: "Hotel Mabu",
    hostAvatar: "HM",
  },
  {
    id: "5",
    title: "Quarto Resort Beira-Mar",
    description: "Quarto com varanda de frente para o mar em resort all-inclusive. Praia privativa, piscina com bar molhado e atividades aquáticas.",
    city: "Porto de Galinhas",
    state: "PE",
    price: 520,
    originalPrice: 680,
    rating: 4.6,
    reviewCount: 167,
    guests: 3,
    image: room5,
    images: [room5, room2, room6],
    amenities: ["Wi-Fi", "Ar condicionado", "Piscina", "Café da manhã", "Praia privativa", "Aceita animais"],
    type: "Resort",
    host: "Nannai Resort",
    hostAvatar: "NR",
    featured: true,
  },
  {
    id: "6",
    title: "Quarto Colonial de Charme",
    description: "Hospedagem em casarão histórico do século XIX, com mobiliário de época restaurado e conforto moderno. Experiência cultural única.",
    city: "Ouro Preto",
    state: "MG",
    price: 180,
    rating: 4.5,
    reviewCount: 72,
    guests: 2,
    image: room6,
    images: [room6, room2],
    amenities: ["Wi-Fi", "Café da manhã", "Estacionamento"],
    type: "Pousada",
    host: "Pousada Solar dos Inconfidentes",
    hostAvatar: "PS",
  },
];

export const destinations: Destination[] = [
  {
    id: "1",
    name: "Rio de Janeiro",
    image: destBeach,
    roomCount: 2340,
    description: "Praias icônicas e paisagens de tirar o fôlego",
  },
  {
    id: "2",
    name: "São Paulo",
    image: destCity,
    roomCount: 4120,
    description: "Gastronomia, cultura e vida noturna vibrante",
  },
  {
    id: "3",
    name: "Gramado",
    image: destMountain,
    roomCount: 890,
    description: "Charme europeu na Serra Gaúcha",
  },
];

export const reviews: Review[] = [
  {
    id: "1",
    userName: "Ana Silva",
    userAvatar: "AS",
    roomId: "1",
    roomTitle: "Suíte Luxo com Vista para o Mar",
    rating: 5,
    comment: "Experiência incrível! A vista para o mar é de tirar o fôlego. O atendimento foi impecável e o café da manhã espetacular. Com certeza voltarei!",
    date: "2026-02-15",
  },
  {
    id: "2",
    userName: "Carlos Mendes",
    userAvatar: "CM",
    roomId: "3",
    roomTitle: "Suíte Master com Sala de Estar",
    rating: 4,
    comment: "Ótima localização e quarto espaçoso. Perfeito para viagem a trabalho. A cozinha compacta foi um diferencial. Recomendo!",
    date: "2026-02-10",
  },
  {
    id: "3",
    userName: "Maria Oliveira",
    userAvatar: "MO",
    roomId: "5",
    roomTitle: "Quarto Resort Beira-Mar",
    rating: 5,
    comment: "Melhor resort que já fiquei no Brasil! A praia privativa é paradisíaca e as atividades aquáticas são incríveis. Férias perfeitas!",
    date: "2026-01-28",
  },
  {
    id: "4",
    userName: "Pedro Santos",
    userAvatar: "PS",
    roomId: "2",
    roomTitle: "Quarto Boutique no Centro Histórico",
    rating: 5,
    comment: "Que lugar mágico! A decoração é linda e a localização no Pelourinho é perfeita para explorar Salvador. O café colonial é divino.",
    date: "2026-01-20",
  },
];

export const cities = [
  "Rio de Janeiro", "São Paulo", "Salvador", "Curitiba", "Florianópolis",
  "Porto de Galinhas", "Ouro Preto", "Gramado", "Búzios", "Paraty",
  "Belo Horizonte", "Recife", "Fortaleza", "Natal", "Manaus",
];
