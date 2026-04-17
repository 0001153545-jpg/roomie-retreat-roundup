import type { Room } from "@/data/mockData";

export const mapListingToRoom = (l: any): Room => ({
  id: l.id,
  title: l.title,
  description: l.description || "",
  city: l.city,
  state: l.state,
  price: l.discount_percent > 0 ? Number(l.price) * (1 - l.discount_percent / 100) : Number(l.price),
  originalPrice: l.discount_percent > 0 ? Number(l.price) : undefined,
  rating: 4.5,
  reviewCount: 0,
  guests: l.guests,
  image: l.image_url || "/placeholder.svg",
  images: l.images?.length > 0 ? l.images : [l.image_url || "/placeholder.svg"],
  amenities: ["Wi-Fi"],
  type: l.type,
  host: l.title,
  hostAvatar: l.title.slice(0, 2).toUpperCase(),
  featured: true,
});
