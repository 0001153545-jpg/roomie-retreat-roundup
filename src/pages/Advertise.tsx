import { useState, useEffect } from "react";
import { Building2, Camera, DollarSign, BarChart3, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Listing {
  id: string; title: string; city: string; state: string; type: string; price: number; guests: number; image_url: string; created_at: string; description: string | null;
}

const Advertise = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { formatPrice, symbol } = useCurrency();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [showMyRooms, setShowMyRooms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [accountType, setAccountType] = useState("guest");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [form, setForm] = useState({
    title: "", city: "", state: "", type: "Hotel", price: "", guests: "2", description: "",
  });

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("account_type").eq("user_id", user.id).single()
      .then(({ data }) => {
        if (data) setAccountType(data.account_type);
      });
  }, [user]);

  const loadMyListings = async () => {
    if (!user) return;
    const { data } = await supabase.from("listings").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (data) setMyListings(data as Listing[]);
  };

  useEffect(() => {
    if (!user || !showMyRooms) return;
    loadMyListings();
  }, [user, showMyRooms]);

  const steps = [
    { icon: Building2, title: t("advertise.step1"), desc: t("advertise.step1Desc") },
    { icon: Camera, title: t("advertise.step2"), desc: t("advertise.step2Desc") },
    { icon: DollarSign, title: t("advertise.step3"), desc: t("advertise.step3Desc") },
    { icon: BarChart3, title: t("advertise.step4"), desc: t("advertise.step4Desc") },
  ];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); }
  };

  const handlePriceChange = (value: string) => {
    const clean = value.replace(/[^0-9.]/g, "");
    const parts = clean.split(".");
    let intPart = parts[0].slice(0, 4);
    let decPart = parts[1] ? parts[1].slice(0, 2) : "";
    const final = decPart ? `${intPart}.${decPart}` : parts.length > 1 ? `${intPart}.` : intPart;
    setForm({ ...form, price: final });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error(t("advertise.loginRequired")); navigate("/login"); return; }
    if (accountType !== "owner") { toast.error(t("advertise.ownerOnly")); return; }
    if (!form.title || !form.city || !form.price) { toast.error(t("advertise.fillRequired")); return; }

    setSubmitting(true);
    let imageUrl = "";

    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("property-images").upload(path, imageFile);
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from("property-images").getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      } else {
        toast.error("Erro no upload: " + uploadError.message);
        setSubmitting(false);
        return;
      }
    }

    const { error } = await supabase.from("listings").insert({
      user_id: user.id,
      title: form.title,
      city: form.city,
      state: form.state || "",
      type: form.type,
      price: Number(form.price),
      guests: Number(form.guests),
      description: form.description || "",
      image_url: imageUrl,
    });

    setSubmitting(false);

    if (error) {
      toast.error("Erro ao cadastrar: " + error.message);
    } else {
      toast.success(t("advertise.success"), {
        description: `${form.title} — ${form.city}, ${form.state}`,
      });
      setShowForm(false);
      setShowMyRooms(true);
      setForm({ title: "", city: "", state: "", type: "Hotel", price: "", guests: "2", description: "" });
      setImageFile(null);
      setImagePreview("");
      loadMyListings();
    }
  };

  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="mb-3 font-heading text-3xl font-bold text-foreground sm:text-4xl">{t("advertise.title")}</h1>
        <p className="mb-10 text-lg text-muted-foreground">{t("advertise.subtitle")}</p>
      </div>

      <div className="mx-auto mb-12 grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
        {steps.map((step, i) => (
          <div key={step.title} className="flex gap-4 rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <step.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">{t("advertise.stepLabel")} {i + 1}</p>
              <h3 className="font-heading text-base font-semibold text-foreground">{step.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center flex gap-3 justify-center flex-wrap">
        {!showForm && (
          <Button size="lg" className="shadow-hero" onClick={() => {
            if (!user) { toast.error(t("advertise.loginRequired")); navigate("/login"); return; }
            if (accountType !== "owner") { toast.error(t("advertise.ownerOnly")); return; }
            setShowForm(true);
          }}>
            {t("advertise.startNow")}
          </Button>
        )}
        {user && accountType === "owner" && (
          <Button size="lg" variant="outline" onClick={() => setShowMyRooms(!showMyRooms)}>
            {t("advertise.viewMyRooms")}
          </Button>
        )}
      </div>

      {showMyRooms && (
        <div className="mx-auto mt-8 max-w-3xl">
          <h2 className="mb-4 font-heading text-xl font-bold text-foreground">{t("advertise.myRooms")}</h2>
          {myListings.length === 0 ? (
            <p className="text-muted-foreground">{t("advertise.noRooms")}</p>
          ) : (
            <div className="space-y-3">
              {myListings.map((l) => (
                <div key={l.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
                  {l.image_url && <img src={l.image_url} alt={l.title} className="h-16 w-24 rounded-lg object-cover" />}
                  <div className="flex-1">
                    <h3 className="font-heading text-base font-semibold text-foreground">{l.title}</h3>
                    <p className="text-xs text-muted-foreground">{l.city}, {l.state} · {l.type} · {formatPrice(l.price)}/{t("room.perNight")}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="mx-auto mt-8 max-w-xl rounded-xl border border-border bg-card p-6 shadow-elevated">
          <h2 className="mb-6 font-heading text-xl font-bold text-foreground">{t("advertise.formTitle")}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">{t("advertise.propertyName")} *</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-lg border border-input bg-background p-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">{t("advertise.city")} *</label>
                <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background p-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">{t("advertise.state")}</label>
                <input type="text" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background p-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">{t("advertise.propertyType")}</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="styled-select w-full appearance-none rounded-lg border border-input bg-background p-2.5 text-sm outline-none focus:ring-2 focus:ring-ring">
                  <option>Hotel</option><option>Pousada</option><option>Resort</option><option>Suíte</option><option>Hostel</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">{t("advertise.pricePerNight")} ({symbol}) *</label>
                <input type="text" inputMode="decimal" value={form.price} onChange={(e) => handlePriceChange(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-input bg-background p-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">{t("advertise.maxGuests")}</label>
                <select value={form.guests} onChange={(e) => setForm({ ...form, guests: e.target.value })}
                  className="styled-select w-full appearance-none rounded-lg border border-input bg-background p-2.5 text-sm outline-none focus:ring-2 focus:ring-ring">
                  {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">{t("advertise.photo")}</label>
              <div className="flex items-center gap-4">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-input bg-background px-4 py-3 text-sm text-muted-foreground hover:border-primary transition-colors">
                  <Upload className="h-4 w-4" />
                  {imageFile ? imageFile.name : t("advertise.selectPhoto")}
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
                {imagePreview && <img src={imagePreview} alt="Preview" className="h-16 w-24 rounded-lg object-cover" />}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">{t("advertise.descriptionLabel")}</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4} className="w-full rounded-lg border border-input bg-background p-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <Button type="submit" className="w-full shadow-hero" disabled={submitting}>
              {submitting ? t("advertise.submitting") : t("advertise.submit")}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Advertise;
