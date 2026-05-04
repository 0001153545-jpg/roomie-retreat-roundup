import type { Room } from "@/data/mockData";
import { supabase } from "@/integrations/supabase/client";

export const mapListingToRoom = (l: any): Room => ({
  id: l.id,
  title: l.title,
  description: l.description || "",
  city: l.city,
  state: l.state,
  price: l.discount_percent > 0 ? Number(l.price) * (1 - l.discount_percent / 100) : Number(l.price),
  originalPrice: l.discount_percent > 0 ? Number(l.price) : undefined,
  rating: 0,
  reviewCount: 0,
  guests: l.guests,
  image: l.image_url || "/placeholder.svg",
  images: l.images?.length > 0 ? l.images : [l.image_url || "/placeholder.svg"],
  amenities: l.amenities?.length > 0 ? l.amenities : ["Wi-Fi"],
  type: l.type,
  host: l.title,
  hostId: l.user_id,
  hostAvatar: l.title.slice(0, 2).toUpperCase(),
  featured: true,
});

/**
 * Enrich a list of rooms with real review aggregates (avg rating + count) from the DB.
 * Rooms without reviews keep rating=0 and reviewCount=0 (UI shows "Sem avaliações").
 */
export const enrichRoomsWithReviews = async (rooms: Room[]): Promise<Room[]> => {
  if (rooms.length === 0) return rooms;
  const ids = rooms.map((r) => r.id);
  const { data, error } = await supabase
    .from("reviews")
    .select("room_id, rating")
    .in("room_id", ids);
  if (error || !data) return rooms;

  const stats = new Map<string, { sum: number; count: number }>();
  for (const r of data as any[]) {
    const s = stats.get(r.room_id) || { sum: 0, count: 0 };
    s.sum += Number(r.rating) || 0;
    s.count += 1;
    stats.set(r.room_id, s);
  }
  return rooms.map((r) => {
    const s = stats.get(r.id);
    if (!s || s.count === 0) return r;
    return { ...r, rating: Math.round((s.sum / s.count) * 10) / 10, reviewCount: s.count };
  });
};
