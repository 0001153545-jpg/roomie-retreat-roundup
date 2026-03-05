import { reviews } from "@/data/mockData";
import { Star, Quote } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const ReviewsSection = () => {
  return (
    <section className="bg-muted/50 py-16">
      <div className="container-page">
        <h2 className="mb-2 font-heading text-2xl font-bold text-foreground sm:text-3xl">
          O que nossos hóspedes dizem
        </h2>
        <p className="mb-8 text-muted-foreground">
          Avaliações reais de quem já se hospedou
        </p>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-xl border border-border bg-card p-5 shadow-card"
            >
              <Quote className="mb-3 h-6 w-6 text-primary/30" />
              <p className="mb-4 text-sm leading-relaxed text-card-foreground line-clamp-4">
                "{review.comment}"
              </p>
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: review.rating }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-accent text-accent" />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-xs text-primary font-medium">
                    {review.userAvatar}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-card-foreground">{review.userName}</p>
                  <p className="text-xs text-muted-foreground">{review.roomTitle}</p>
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
