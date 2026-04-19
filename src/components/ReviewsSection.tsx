import { reviews as fallbackReviews } from "@/data/mockData";
import { Star, Quote } from "lucide-react";
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
}

const ReviewsSection = () => {
  const { t } = useLanguage();
  const [reviews, setReviews] = useState<DisplayReview[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("reviews")
        .select("id, user_id, user_name, rating, comment, room_id")
        .order("created_at", { ascending: false })
        .limit(8);

      if (!data || data.length === 0) {
        // Fallback to mock if DB empty
        setReviews(fallbackReviews.slice(0, 4).map((r) => ({
          id: r.id, userName: r.userName, userAvatar: r.userAvatar, avatarUrl: null, roomTitle: r.roomTitle, rating: r.rating, comment: r.comment,
        })));
        return;
      }

      // Fetch profiles + room titles
      const userIds = [...new Set(data.map((r: any) => r.user_id))];
      const roomIds = [...new Set(data.map((r: any) => r.room_id))];
      const [{ data: profs }, { data: rooms }] = await Promise.all([
        supabase.rpc("get_public_profiles", { target_user_ids: userIds }),
        supabase.from("listings").select("id, title").in("id", roomIds),
      ]);
      const profMap: Record<string, any> = {};
      (profs || []).forEach((p: any) => { profMap[p.user_id] = p; });
      const roomMap: Record<string, string> = {};
      (rooms || []).forEach((r: any) => { roomMap[r.id] = r.title; });

      const top4 = data.slice(0, 4).map((r: any) => {
        const prof = profMap[r.user_id];
        const name = prof?.full_name || r.user_name || "Hóspede";
        return {
          id: r.id,
          userName: name,
          userAvatar: name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase(),
          avatarUrl: prof?.avatar_url || null,
          roomTitle: roomMap[r.room_id] || "",
          rating: r.rating,
          comment: r.comment,
        };
      });
      setReviews(top4);
    })();
  }, []);

  if (reviews.length === 0) return null;

  return (
    <section className="bg-muted/50 py-16">
      <div className="container-page">
        <h2 className="mb-2 font-heading text-2xl font-bold text-foreground sm:text-3xl">{t("reviews.title")}</h2>
        <p className="mb-8 text-muted-foreground">{t("reviews.subtitle")}</p>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-xl border border-border bg-card p-5 shadow-card">
              <Quote className="mb-3 h-6 w-6 text-primary/30" />
              <p className="mb-4 text-sm leading-relaxed text-card-foreground line-clamp-4">"{review.comment}"</p>
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: review.rating }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-accent text-accent" />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  {review.avatarUrl && <AvatarImage src={review.avatarUrl} alt={review.userName} />}
                  <AvatarFallback className="bg-primary/10 text-xs text-primary font-medium">{review.userAvatar}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-card-foreground">{review.userName}</p>
                  {review.roomTitle && <p className="text-xs text-muted-foreground line-clamp-1">{review.roomTitle}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ReviewsSection;
