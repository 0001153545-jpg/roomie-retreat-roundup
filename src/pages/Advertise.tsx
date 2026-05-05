import { useState, useEffect } from "react";
import { Building2, Camera, DollarSign, BarChart3, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { translateText } from "@/lib/chat";
import { useIBGEStates, useIBGECities } from "@/hooks/useIBGE";

const ALL_AMENITIES = [
  "Wi-Fi", "Ar condicionado", "Estacionamento", "Café da manhã", "Piscina",
  "Aceita animais", "Spa", "Academia", "Lavanderia", "Jacuzzi", "Terraço",
  "Concierge 24h", "Praia privativa",
];

const Advertise = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { symbol } = useCurrency();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [accountType, setAccountType] = useState("guest");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [form, setForm] = useState({
    title: "", city: "", state: "", type: "Hotel", price: "", guests: "2", description: "",
  });

  const { states, loading: statesLoading, error: statesError } = useIBGEStates();
  const { cities, loading: citiesLoading, error: citiesError } = useIBGECities(form.state);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("account_type").eq("user_id", user.id).single()
      .then(async ({ data }) => {
        const profileType = data?.account_type || "guest";
        const metaType = user.user_metadata?.account_type || "guest";
        if (metaType === "owner" && profileType !== "owner") {
          await supabase.from("profiles").update({ account_type: "owner" } as any).eq("user_id", user.id);
          setAccountType("owner");
        } else {
          setAccountType(profileType);
        }
      });
  }, [user]);

  const steps = [
    { icon: Building2, title: t("advertise.step1"), desc: t("advertise.step1Desc") },
    { icon: Camera, title: t("advertise.step2"), desc: t("advertise.step2Desc") },
    { icon: DollarSign, title: t("advertise.step3"), desc: t("advertise.step3Desc") },
    { icon: BarChart3, title: t("advertise.step4"), desc: t("advertise.step4Desc") },
  ];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 3 - imageFiles.length;
    const toAdd = files.slice(0, remaining);
    if (toAdd.length === 0) return;
    setImageFiles(prev => [...prev, ...toAdd]);
    setImagePreviews(prev => [...prev, ...toAdd.map(f => URL.createObjectURL(f))]);
  };

  const removeImage = (i: number) => {
    setImageFiles(prev => prev.filter((_, idx) => idx !== i));
    setImagePreviews(prev => prev.filter((_, idx) => idx !== i));
  };

  const handlePriceChange = (value: string) => {
    const clean = value.replace(/[^0-9.]/g, "");
    const parts = clean.split(".");
    let intPart = parts[0].slice(0, 4);
    let decPart = parts[1] ? parts[1].slice(0, 2) : "";
    const final = decPart ? `${intPart}.${decPart}` : parts.length > 1 ? `${intPart}.` : intPart;
    setForm({ ...form, price: final });
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error(t("advertise.loginRequired")); navigate("/login"); return; }
    if (accountType !== "owner") { toast.error(t("advertise.ownerOnly")); return; }
    if (!form.title || !form.city || !form.price) { toast.error(t("advertise.fillRequired")); return; }

    setSubmitting(true);
    const uploadedUrls: string[] = [];

    for (const file of imageFiles) {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("property-images").upload(path, file);
      if (uploadError) {
        toast.error("Erro no upload: " + uploadError.message);
        setSubmitting(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("property-images").getPublicUrl(path);
      uploadedUrls.push(urlData.publicUrl);
    }

    // Pre-translate description (PT -> EN/ES) and amenities for cache
    let description_en: string | null = null;
    let description_es: string | null = null;
    if (form.description.trim()) {
      const tr = await translateText(form.description, "pt", ["en", "es"]);
      description_en = tr.en || null;
      description_es = tr.es || null;
    }
    const amenities_translations: Record<string, { en: string; es: string }> = {};
    for (const a of selectedAmenities) {
      const tr = await translateText(a, "pt", ["en", "es"]);
      amenities_translations[a] = { en: tr.en || a, es: tr.es || a };
    }

    const { error } = await supabase.from("listings").insert({
      user_id: user.id,
      title: form.title,
      city: form.city,
      state: form.state || "",
      type: form.type,
      price: Number(form.price),
      guests: Number(form.guests),
      description: form.description,
      description_en,
      description_es,
      amenities: selectedAmenities,
      amenities_translations,
      image_url: uploadedUrls[0] || "",
      images: uploadedUrls,
    } as any);

    setSubmitting(false);

    if (error) {
      toast.error("Erro ao cadastrar: " + error.message);
    } else {
      toast.success(t("advertise.success"), {
        description: `${form.title} — ${form.city}, ${form.state}`,
      });
      setShowForm(false);
      setForm({ title: "", city: "", state: "", type: "Hotel", price: "", guests: "2", description: "" });
      setImageFiles([]);
      setImagePreviews([]);
      setSelectedAmenities([]);
      navigate("/meus-quartos");
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
          <Button size="lg" variant="outline" onClick={() => navigate("/meus-quartos")}>
            {t("advertise.viewMyRooms")}
          </Button>
        )}
      </div>

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
                <label className="mb-1 block text-sm font-medium text-foreground">Estado *</label>
                {statesError ? (
                  <p className="text-xs text-destructive">{statesError}</p>
                ) : (
                  <select
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value, city: "" })}
                    disabled={statesLoading}
                    className="w-full rounded-lg border border-input bg-background p-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">{statesLoading ? "Carregando..." : "Selecione o estado"}</option>
                    {states.map((s) => (
                      <option key={s.sigla} value={s.sigla}>{s.nome}</option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Cidade *</label>
                {citiesError ? (
                  <p className="text-xs text-destructive">{citiesError}</p>
                ) : (
                  <select
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    disabled={!form.state || citiesLoading}
                    className="w-full rounded-lg border border-input bg-background p-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">
                      {!form.state ? "Selecione o estado primeiro" : citiesLoading ? "Carregando..." : "Selecione a cidade"}
                    </option>
                    {cities.map((c) => (
                      <option key={c.id} value={c.nome}>{c.nome}</option>
                    ))}
                  </select>
                )}
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

            {/* Amenities selector */}
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Comodidades</label>
              <div className="flex flex-wrap gap-2">
                {ALL_AMENITIES.map((amenity) => (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleAmenity(amenity)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
                      selectedAmenities.includes(amenity)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-input text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {amenity}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">{t("advertise.photo")} ({imageFiles.length}/3)</label>
              <div className="flex flex-wrap items-center gap-3">
                {imagePreviews.map((src, i) => (
                  <div key={i} className="relative">
                    <img src={src} alt={`Preview ${i + 1}`} className="h-20 w-28 rounded-lg object-cover" />
                    <button type="button" onClick={() => removeImage(i)} className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {imageFiles.length < 3 && (
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-input bg-background px-4 py-3 text-sm text-muted-foreground hover:border-primary transition-colors">
                    <Upload className="h-4 w-4" />
                    {t("advertise.selectPhoto")}
                    <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                  </label>
                )}
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
