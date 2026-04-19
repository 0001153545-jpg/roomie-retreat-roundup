import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Building2, ChevronDown, ChevronUp, Edit2, Save, X, Users, CreditCard, Percent, Trash2, Upload, Image, FileText } from "lucide-react";
import { toast } from "sonner";

const ALL_AMENITIES = [
  "Wi-Fi", "Ar condicionado", "Estacionamento", "Café da manhã", "Piscina",
  "Aceita animais", "Spa", "Academia", "Lavanderia", "Jacuzzi", "Terraço",
  "Concierge 24h", "Praia privativa",
];

interface Listing {
  id: string; title: string; city: string; state: string; type: string; price: number; guests: number; image_url: string; images: string[]; created_at: string; discount_percent: number; description: string | null; amenities: string[];
}

interface Reservation {
  id: string; room_id: string; room_title: string; check_in: string; check_out: string; guests: number; subtotal: number; fee: number; total: number; status: string; user_id: string; payment_method: string; currency: string; adults: number; children_ages: number[];
}

interface Profile {
  full_name: string | null; user_id: string;
}

const COMMISSION_RATE = 0.20;

const MyRooms = () => {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [fetching, setFetching] = useState(true);
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null);
  const [reservations, setReservations] = useState<Record<string, Reservation[]>>({});
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [editingRoom, setEditingRoom] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editDiscount, setEditDiscount] = useState("");
  const [updatingPhotos, setUpdatingPhotos] = useState<string | null>(null);
  const [newPhotoFiles, setNewPhotoFiles] = useState<File[]>([]);
  const [newPhotoPreviews, setNewPhotoPreviews] = useState<string[]>([]);
  const [editingDetails, setEditingDetails] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editAmenities, setEditAmenities] = useState<string[]>([]);

  useEffect(() => { if (!loading && !user) navigate("/login"); }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from("listings").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => {
        const items = (data || []).map((d: any) => ({ ...d, images: d.images || [], discount_percent: d.discount_percent || 0, amenities: d.amenities || [] })) as Listing[];
        setListings(items);
        setFetching(false);
      });
  }, [user]);

  const loadReservations = async (listingId: string) => {
    const { data } = await supabase.from("reservations").select("*").eq("room_id", listingId).order("created_at", { ascending: false }) as any;
    const res = (data || []) as Reservation[];
    setReservations(prev => ({ ...prev, [listingId]: res }));
    const userIds = [...new Set(res.map(r => r.user_id))];
    if (userIds.length > 0) {
      const { data: profileData } = await supabase.rpc("get_public_profiles", { target_user_ids: userIds });
      if (profileData) {
        const map: Record<string, Profile> = { ...profiles };
        profileData.forEach((p: any) => { map[p.user_id] = { user_id: p.user_id, full_name: p.full_name }; });
        setProfiles(map);
      }
    }
  };

  const toggleExpand = (id: string) => {
    if (expandedRoom === id) { setExpandedRoom(null); return; }
    setExpandedRoom(id);
    if (!reservations[id]) loadReservations(id);
  };

  const startEdit = (l: Listing) => {
    setEditingRoom(l.id);
    setEditPrice(String(l.price));
    setEditDiscount(String(l.discount_percent));
  };

  const saveEdit = async (l: Listing) => {
    const newPrice = Number(editPrice);
    const newDiscount = Math.min(100, Math.max(0, Number(editDiscount) || 0));
    if (isNaN(newPrice) || newPrice <= 0) { toast.error(t("advertise.fillRequired")); return; }
    const { error } = await supabase.from("listings").update({ price: newPrice, discount_percent: newDiscount } as any).eq("id", l.id);
    if (error) { toast.error(error.message); return; }
    setListings(prev => prev.map(x => x.id === l.id ? { ...x, price: newPrice, discount_percent: newDiscount } : x));
    setEditingRoom(null);
    toast.success(t("advertise.success"));
  };

  const handleDelete = async (l: Listing) => {
    const roomRes = reservations[l.id];
    if (!roomRes) {
      // Load reservations first to check
      const { data } = await supabase.from("reservations").select("id").eq("room_id", l.id).limit(1);
      if (data && data.length > 0) {
        toast.error(t("myRooms.cannotDelete"));
        return;
      }
    } else if (roomRes.length > 0) {
      toast.error(t("myRooms.cannotDelete"));
      return;
    }

    const { error } = await supabase.from("listings").delete().eq("id", l.id);
    if (error) { toast.error(error.message); return; }
    setListings(prev => prev.filter(x => x.id !== l.id));
    toast.success(t("myRooms.deleted"));
  };

  const startPhotoUpdate = (l: Listing) => {
    setUpdatingPhotos(l.id);
    setNewPhotoFiles([]);
    setNewPhotoPreviews([]);
  };

  const handleNewPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 3 - newPhotoFiles.length;
    const toAdd = files.slice(0, remaining);
    if (toAdd.length === 0) return;
    setNewPhotoFiles(prev => [...prev, ...toAdd]);
    setNewPhotoPreviews(prev => [...prev, ...toAdd.map(f => URL.createObjectURL(f))]);
  };

  const removeNewPhoto = (i: number) => {
    setNewPhotoFiles(prev => prev.filter((_, idx) => idx !== i));
    setNewPhotoPreviews(prev => prev.filter((_, idx) => idx !== i));
  };

  const savePhotos = async (l: Listing) => {
    if (!user || newPhotoFiles.length === 0) { setUpdatingPhotos(null); return; }
    const uploadedUrls: string[] = [];
    for (const file of newPhotoFiles) {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("property-images").upload(path, file);
      if (uploadError) { toast.error("Upload error: " + uploadError.message); return; }
      const { data: urlData } = supabase.storage.from("property-images").getPublicUrl(path);
      uploadedUrls.push(urlData.publicUrl);
    }
    const { error } = await supabase.from("listings").update({ images: uploadedUrls, image_url: uploadedUrls[0] || l.image_url } as any).eq("id", l.id);
    if (error) { toast.error(error.message); return; }
    setListings(prev => prev.map(x => x.id === l.id ? { ...x, images: uploadedUrls, image_url: uploadedUrls[0] || x.image_url } : x));
    setUpdatingPhotos(null);
    toast.success(t("myRooms.photosUpdated"));
  };

  const startDetailsEdit = (l: Listing) => {
    setEditingDetails(l.id);
    setEditDescription(l.description || "");
    setEditAmenities(l.amenities || []);
  };

  const toggleEditAmenity = (a: string) => {
    setEditAmenities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  };

  const saveDetails = async (l: Listing) => {
    const { error } = await supabase.from("listings").update({ description: editDescription, amenities: editAmenities } as any).eq("id", l.id);
    if (error) { toast.error(error.message); return; }
    setListings(prev => prev.map(x => x.id === l.id ? { ...x, description: editDescription, amenities: editAmenities } : x));
    setEditingDetails(null);
    toast.success(t("myRooms.detailsUpdated"));
  };


  const paymentLabel = (method: string) => {
    if (method === "credit") return t("room.creditCard");
    if (method === "debit") return t("room.debitCard");
    if (method === "pix") return "PIX";
    return method;
  };

  if (loading || fetching) return <div className="container-page flex min-h-[60vh] items-center justify-center"><p className="text-muted-foreground">{t("reservations.loading")}</p></div>;

  return (
    <div className="container-page py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-foreground">{t("advertise.myRooms")}</h1>
        <Link to="/anunciar"><Button>{t("advertise.startNow")}</Button></Link>
      </div>

      {listings.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-12 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-muted-foreground">{t("advertise.noRooms")}</p>
          <Link to="/anunciar"><Button>{t("advertise.startNow")}</Button></Link>
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map((l) => {
            const isExpanded = expandedRoom === l.id;
            const roomRes = reservations[l.id] || [];
            const isEditing = editingRoom === l.id;
            const isUpdatingPhotos = updatingPhotos === l.id;
            const effectivePrice = l.discount_percent > 0 ? l.price * (1 - l.discount_percent / 100) : l.price;

            return (
              <div key={l.id} className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="flex items-center gap-4 p-4">
                  {l.image_url && <img src={l.image_url} alt={l.title} className="h-20 w-32 rounded-lg object-cover" />}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading text-base font-semibold text-foreground">{l.title}</h3>
                    <p className="text-sm text-muted-foreground">{l.city}, {l.state} · {l.type}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {l.discount_percent > 0 ? (
                        <>
                          <span className="text-sm text-muted-foreground line-through">{formatPrice(l.price)}</span>
                          <span className="text-sm font-medium text-foreground">{formatPrice(effectivePrice)}</span>
                          <Badge className="bg-primary text-primary-foreground border-0 text-xs">{l.discount_percent}% OFF</Badge>
                        </>
                      ) : (
                        <span className="text-sm font-medium text-foreground">{formatPrice(l.price)} {t("room.perNight")}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {!isEditing ? (
                      <Button variant="ghost" size="sm" onClick={() => startEdit(l)}><Edit2 className="h-4 w-4" /></Button>
                    ) : (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => saveEdit(l)}><Save className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => setEditingRoom(null)}><X className="h-4 w-4" /></Button>
                      </div>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => startPhotoUpdate(l)} title={t("myRooms.updatePhotos")}>
                      <Image className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => startDetailsEdit(l)} title={t("myRooms.editDetails")}>
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(l)} className="text-destructive hover:text-destructive" title={t("myRooms.delete")}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => toggleExpand(l.id)}>
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {isEditing && (
                  <div className="border-t border-border bg-muted/30 p-4">
                    <div className="grid grid-cols-2 gap-4 max-w-md">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("advertise.pricePerNight")}</label>
                        <input type="text" inputMode="decimal" value={editPrice} onChange={(e) => {
                          const clean = e.target.value.replace(/[^0-9.]/g, "");
                          const parts = clean.split(".");
                          let intPart = parts[0].slice(0, 4);
                          let decPart = parts[1] ? parts[1].slice(0, 2) : "";
                          setEditPrice(decPart ? `${intPart}.${decPart}` : parts.length > 1 ? `${intPart}.` : intPart);
                        }}
                          className="w-full rounded-lg border border-input bg-background p-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("myRooms.discount")} (%)</label>
                        <input type="number" min="0" max="100" value={editDiscount} onChange={(e) => setEditDiscount(e.target.value)}
                          className="w-full rounded-lg border border-input bg-background p-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
                      </div>
                    </div>
                  </div>
                )}

                {isUpdatingPhotos && (
                  <div className="border-t border-border bg-muted/30 p-4">
                    <p className="mb-2 text-sm font-medium text-foreground">{t("myRooms.updatePhotos")}</p>
                    {l.images.length > 0 && (
                      <div className="mb-3">
                        <p className="mb-1 text-xs text-muted-foreground">{t("myRooms.currentPhotos")}</p>
                        <div className="flex gap-2">
                          {l.images.map((img, i) => (
                            <img key={i} src={img} alt="" className="h-16 w-24 rounded-lg object-cover" />
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-3">
                      {newPhotoPreviews.map((src, i) => (
                        <div key={i} className="relative">
                          <img src={src} alt="" className="h-16 w-24 rounded-lg object-cover" />
                          <button type="button" onClick={() => removeNewPhoto(i)} className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      {newPhotoFiles.length < 3 && (
                        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-input bg-background px-3 py-2 text-xs text-muted-foreground hover:border-primary transition-colors">
                          <Upload className="h-3 w-3" />
                          {t("advertise.selectPhoto")}
                          <input type="file" accept="image/*" multiple onChange={handleNewPhotoChange} className="hidden" />
                        </label>
                      )}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" onClick={() => savePhotos(l)}>{t("myRooms.savePhotos")}</Button>
                      <Button size="sm" variant="outline" onClick={() => setUpdatingPhotos(null)}>{t("common.cancel")}</Button>
                    </div>
                  </div>
                )}

                {isExpanded && (
                  <div className="border-t border-border p-4">
                    <h4 className="mb-3 font-heading text-sm font-semibold text-foreground">{t("myRooms.reservations")}</h4>
                    {roomRes.length === 0 ? (
                      <p className="text-sm text-muted-foreground">{t("myRooms.noReservations")}</p>
                    ) : (
                      <div className="space-y-3">
                        {roomRes.map((r) => {
                          const guest = profiles[r.user_id];
                          const commission = r.total * COMMISSION_RATE;
                          const netAmount = r.total - commission;
                          return (
                            <div key={r.id} className="rounded-lg border border-border bg-background p-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-sm font-medium text-foreground">{guest?.full_name || t("myRooms.anonymousGuest")}</span>
                                    <Badge variant={r.status === "confirmed" ? "default" : r.status === "cancelled" ? "destructive" : "secondary"} className="text-xs">
                                      {t(`reservations.${r.status}`)}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {t("room.checkIn")}: {r.check_in} · {t("room.checkOut")}: {r.check_out}
                                  </p>
                                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                                    <span>{r.adults || 1} {t("room.adults")}</span>
                                    {(r.children_ages?.length || 0) > 0 && (
                                      <span>{r.children_ages.length} {t("room.children")} ({r.children_ages.join(", ")} {t("room.years")})</span>
                                    )}
                                    <span className="flex items-center gap-1"><CreditCard className="h-3 w-3" /> {paymentLabel(r.payment_method || "credit")}</span>
                                    <span>{r.currency || "BRL"}</span>
                                  </div>
                                </div>
                                <div className="text-right space-y-0.5">
                                  <p className="text-sm font-semibold text-foreground">{formatPrice(r.total)}</p>
                                  <p className="text-xs text-destructive">-{t("myRooms.commission")} (20%): {formatPrice(commission)}</p>
                                  <p className="text-xs font-medium text-primary">{t("myRooms.netAmount")}: {formatPrice(netAmount)}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyRooms;
