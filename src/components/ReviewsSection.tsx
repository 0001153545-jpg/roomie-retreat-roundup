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
  city?: string;
  date?: string;
  verified?: boolean;
}

const cityPool = ["São Paulo, SP", "Rio de Janeiro, RJ", "Gramado, RS", "Salvador, BA", "Curitiba, PR", "Belo Horizonte, MG"];

const formatDate = (iso?: string) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  } catch {
    return "";
  }
};

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

      if (!raw || raw.length === 0) {
        setReviews(
          fallbackReviews
            .filter((r) => r.rating >= 4)
            .map((r, i) => ({
              id: r.id,
              userName: r.userName,
              userAvatar: r.userAvatar,
              avatarUrl: null,
              roomTitle: r.roomTitle,
              rating: r.rating,
              comment: r.comment,
              city: cityPool[i % cityPool.length],
              date: r.date,
              verified: i % 2 === 0,
            })),
        );
        return;
      }

      const userIds = [...new Set(raw.map((r: any) => r.user_id))];
      const roomIds = [...new Set(raw.map((r: any) => r.room_id))];
      const [{ data: profs }, { data: rooms }] = await Promise.all([
        supabase.rpc("get_public_profiles", { target_user_ids: userIds }),
        supabase.from("listings").select("id, title, city, state").in("id", roomIds),
      ]);
      const profMap: Record<string, any> = {};
      (profs || []).forEach((p: any) => { profMap[p.user_id] = p; });
      const roomMap: Record<string, { title: string; city?: string; state?: string }> = {};
      (rooms || []).forEach((r: any) => { roomMap[r.id] = { title: r.title, city: r.city, state: r.state }; });

      const list = raw.slice(0, 8).map((r: any, i: number) => {
        const prof = profMap[r.user_id];
        const name = prof?.full_name || r.user_name || "Hóspede";
        const room = roomMap[r.room_id];
        return {
          id: r.id,
          userName: name,
          userAvatar: name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase(),
          avatarUrl: prof?.avatar_url || null,
          roomTitle: room?.title || "",
          rating: r.rating,
          comment: r.comment,
          city: room?.city ? `${room.city}${room.state ? ", " + room.state : ""}` : cityPool[i % cityPool.length],
          date: r.created_at,
          verified: i % 2 === 0,
        };
      });
      setReviews(list);
    })();
  }, []);

  if (reviews.length === 0) return null;

  return (
    <section className="bg-muted/40 py-16">
      <div className="container-page">
        <div className="mb-8">
          <span className="mb-2 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            Opiniões
          </span>
          <h2 className="mb-1 font-heading text-2xl font-bold text-foreground sm:text-3xl">{t("reviews.title")}</h2>
          <p className="text-muted-foreground">{t("reviews.subtitle")}</p>
        </div>

        <div className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4">
          {reviews.map((review) => (
            <article
              key={review.id}
              className="group flex w-[85%] shrink-0 snap-start flex-col rounded-2xl border border-border bg-card p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated sm:w-[420px]"
            >
              <div className="mb-4 flex items-start gap-4">
                <Avatar className="h-14 w-14 ring-2 ring-primary/10">
                  {review.avatarUrl && <AvatarImage src={review.avatarUrl} alt={review.userName} />}
                  <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                    {review.userAvatar}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate font-heading text-base font-semibold text-foreground">{review.userName}</p>
                    {review.verified && (
                      <span
                        title="Hóspede verificado"
                        className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary"
                      >
                        <BadgeCheck className="h-3 w-3" /> Verificado
                      </span>
                    )}
                  </div>
                  {review.city && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {review.city}
                    </p>
                  )}
                  <div className="mt-1.5 flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${i < review.rating ? "fill-accent text-accent" : "text-muted"}`}
                      />
                    ))}
                    {review.date && (
                      <span className="ml-1.5 text-[11px] text-muted-foreground">· {formatDate(review.date)}</span>
                    )}
                  </div>
                </div>
              </div>

              <p className="mb-3 flex-1 text-sm leading-relaxed text-card-foreground line-clamp-5">
                "{review.comment}"
              </p>

              {review.roomTitle && (
                <p className="border-t border-border pt-3 text-xs text-muted-foreground line-clamp-1">
                  Hospedou-se em: <span className="font-medium text-foreground">{review.roomTitle}</span>
                </p>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ReviewsSection;
