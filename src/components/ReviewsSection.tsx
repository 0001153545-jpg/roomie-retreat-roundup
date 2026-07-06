import { reviews as fallbackReviews } from "@/data/mockData";
import { Star, BadgeCheck, MapPin } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DisplayReview {
  id: string;
  userName: string;
  userAvatar: string;
  avatarUrl: string | null;
  roomTitle: string;
  rating: number;
  comment: string;
  date?: string;
  city?: string;
  verified?: boolean;
}

const demoCities = ["São Paulo, SP", "Rio de Janeiro, RJ", "Gramado, RS", "Salvador, BA", "Curitiba, PR", "Belo Horizonte, MG"];

const ReviewsSection = () => {
  const { t } = useLanguage();
  const [reviews, setReviews] = useState<DisplayReview[]>([]);

  useEffect(() => {
    (async () => {
      const { data: raw } = await supabase
        .from("reviews")
        .select("id, user_id, user_name, rating, comment, room_id, created_at")
        .gte("rating", 4)
        .order("created_at", { ascending: false })
        .limit(12);

      const data = raw;

      const fmt = (d?: string) => d ? new Date(d).toLocaleDateString("pt-BR", { month: "long", year: "numeric" }) : undefined;

      if (!data || data.length === 0) {
        setReviews(
          fallbackReviews
            .filter((r) => r.rating >= 4)
            .slice(0, 8)
            .map((r, i) => ({
              id: r.id, userName: r.userName, userAvatar: r.userAvatar, avatarUrl: null,
              roomTitle: r.roomTitle, rating: r.rating, comment: r.comment,
              date: fmt(r.date), city: demoCities[i % demoCities.length], verified: i % 2 === 0,
            }))
        );
        return;
      }

      const userIds = [...new Set(data.map((r: any) => r.user_id))];
      const roomIds = [...new Set(data.map((r: any) => r.room_id))];
      const [{ data: profs }, { data: rooms }] = await Promise.all([
        supabase.rpc("get_public_profiles", { target_user_ids: userIds }),
        supabase.from("listings").select("id, title, city, state").in("id", roomIds),
      ]);
      const profMap: Record<string, any> = {};
      (profs || []).forEach((p: any) => { profMap[p.user_id] = p; });
      const roomMap: Record<string, any> = {};
      (rooms || []).forEach((r: any) => { roomMap[r.id] = r; });

      setReviews(data.map((r: any, i: number) => {
        const prof = profMap[r.user_id];
        const room = roomMap[r.room_id];
        const name = prof?.full_name || r.user_name || "Hóspede";
        return {
          id: r.id,
          userName: name,
          userAvatar: name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase(),
          avatarUrl: prof?.avatar_url || null,
          roomTitle: room?.title || "",
          city: room ? `${room.city}, ${room.state}` : demoCities[i % demoCities.length],
          rating: r.rating,
          comment: r.comment,
          date: fmt(r.created_at),
          verified: i % 2 === 0,
        };
      }));
    })();
  }, []);

  if (reviews.length === 0) return null;

  return (
    <section className="bg-muted/40 py-16 sm:py-20">
      <div className="container-page">
        <div className="mb-8 animate-fade-in">
          <h2 className="mb-2 font-heading text-2xl font-bold text-foreground sm:text-3xl">{t("reviews.title")}</h2>
          <p className="text-muted-foreground">{t("reviews.subtitle")}</p>
        </div>

        <div className="-mx-4 overflow-x-auto scrollbar-hide px-4">
          <div className="flex gap-5 pb-4 snap-x snap-mandatory">
            {reviews.map((review, i) => (
              <article
                key={review.id}
                style={{ animationDelay: `${i * 60}ms` }}
                className="snap-start shrink-0 w-[300px] sm:w-[340px] rounded-2xl border border-border/60 bg-card p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated animate-fade-in"
              >
                <div className="mb-4 flex items-center gap-3">
                  <Avatar className="h-14 w-14 ring-2 ring-primary/10">
                    {review.avatarUrl && <AvatarImage src={review.avatarUrl} alt={review.userName} />}
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">{review.userAvatar}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate font-semibold text-foreground">{review.userName}</p>
                      {review.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />}
                    </div>
                    {review.city && (
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {review.city}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mb-3 flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star
                        key={idx}
                        className={`h-4 w-4 ${idx < review.rating ? "fill-accent text-accent" : "fill-muted text-muted-foreground/40"}`}
                      />
                    ))}
                  </div>
                  {review.date && <span className="text-xs text-muted-foreground">· {review.date}</span>}
                </div>

                <p className="mb-4 text-sm leading-relaxed text-card-foreground line-clamp-5">"{review.comment}"</p>

                {review.roomTitle && (
                  <div className="border-t border-border/60 pt-3">
                    <p className="text-xs text-muted-foreground">Hospedou-se em</p>
                    <p className="text-sm font-medium text-foreground line-clamp-1">{review.roomTitle}</p>
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ReviewsSection;
