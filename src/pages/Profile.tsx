import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Camera, Eye, EyeOff, Save, Trash2, User } from "lucide-react";

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    supabase.from("profiles").select("*").eq("user_id", user.id).single()
      .then(({ data }) => {
        if (data) {
          setFullName(data.full_name || "");
          setPhone(data.phone || "");
          setCpf((data as any).cpf || "");
          setAvatarUrl(data.avatar_url);
        }
        setLoading(false);
      });
  }, [user, navigate]);

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const handleSave = async () => {
    if (fullName.trim().length < 3) { toast.error("Nome deve ter pelo menos 3 caracteres"); return; }
    if (fullName.trim().length > 100) { toast.error("Nome deve ter no máximo 100 caracteres"); return; }
    if (/^\d+$/.test(fullName.trim())) { toast.error("Nome não pode conter apenas números"); return; }
    const phoneDigits = phone.replace(/\D/g, "");
    if (phone && phoneDigits.length !== 11) { toast.error("Telefone deve ter 11 dígitos"); return; }

    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: fullName.trim(),
      phone: phoneDigits || null,
    }).eq("user_id", user!.id);
    setSaving(false);

    if (error) toast.error("Erro ao salvar: " + error.message);
    else toast.success("Perfil atualizado com sucesso!");
  };

  const handlePasswordChange = async () => {
    if (!currentPassword) { toast.error("Informe a senha atual"); return; }
    if (newPassword.length < 6) { toast.error("Nova senha deve ter pelo menos 6 caracteres"); return; }
    if (newPassword.length > 50) { toast.error("Nova senha deve ter no máximo 50 caracteres"); return; }
    if (newPassword !== confirmPassword) { toast.error("As senhas não coincidem"); return; }

    setChangingPassword(true);

    // Verify current password by re-signing in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user!.email!,
      password: currentPassword,
    });

    if (signInError) {
      setChangingPassword(false);
      toast.error("Senha atual incorreta");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);

    if (error) toast.error("Erro ao alterar senha: " + error.message);
    else {
      toast.success("Senha alterada com sucesso!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Imagem deve ter no máximo 2MB"); return; }

    setUploading(true);
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${user!.id}/avatar-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("property-images")
      .upload(path, file, { upsert: true, contentType: file.type, cacheControl: "3600" });
    if (uploadError) {
      setUploading(false);
      toast.error("Erro ao enviar imagem: " + uploadError.message);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("property-images").getPublicUrl(path);

    const { error: updateError } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("user_id", user!.id);
    if (updateError) {
      setUploading(false);
      toast.error("Erro ao salvar perfil: " + updateError.message);
      return;
    }
    setAvatarUrl(publicUrl);
    setUploading(false);
    toast.success("Foto atualizada!");
  };

  const handleRemoveAvatar = async () => {
    await supabase.from("profiles").update({ avatar_url: null }).eq("user_id", user!.id);
    setAvatarUrl(null);
    toast.success("Foto removida");
  };

  const PasswordInput = ({ value, onChange, show, onToggle, placeholder }: {
    value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void; placeholder: string;
  }) => (
    <div className="relative">
      <Input type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} maxLength={50} />
      <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" /></div>;

  const initials = fullName ? fullName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "U";

  return (
    <div className="container-page py-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6">Meu Perfil</h1>

      {/* Avatar */}
      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">Foto de Perfil</CardTitle></CardHeader>
        <CardContent className="flex items-center gap-6">
          <div className="relative">
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <label className="absolute bottom-0 right-0 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90">
              <Camera className="h-3.5 w-3.5" />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
            </label>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{uploading ? "Enviando..." : "JPG, PNG até 2MB"}</p>
            {avatarUrl && (
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={handleRemoveAvatar}>
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Remover foto
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Personal info */}
      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">Dados Pessoais</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">E-mail</label>
            <Input value={user?.email || ""} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground mt-1">O e-mail não pode ser alterado</p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">CPF</label>
            <Input value={cpf ? `•••••••••${cpf.slice(-2)}` : "CPF não cadastrado"} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground mt-1">Por segurança, exibimos apenas os últimos 2 dígitos</p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Nome completo</label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={100} minLength={3} placeholder="Seu nome completo" />
            {fullName && fullName.trim().length < 3 && <p className="text-xs text-destructive mt-1">Mínimo de 3 caracteres</p>}
            {fullName && /^\d+$/.test(fullName.trim()) && <p className="text-xs text-destructive mt-1">Nome não pode conter apenas números</p>}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Telefone atual</label>
            <Input value={formatPhone(phone) || "Nenhum telefone cadastrado"} disabled className="bg-muted" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Trocar número de telefone</label>
            <Input value={formatPhone(phone)} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
              placeholder="(11) 99999-9999" maxLength={15} />
            {phone && phone.replace(/\D/g, "").length > 0 && phone.replace(/\D/g, "").length < 11 && (
              <p className="text-xs text-destructive mt-1">Telefone deve ter 11 dígitos</p>
            )}
          </div>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar alterações"}
          </Button>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader><CardTitle className="text-base">Alterar Senha</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Senha atual</label>
            <PasswordInput value={currentPassword} onChange={setCurrentPassword} show={showCurrent} onToggle={() => setShowCurrent(!showCurrent)} placeholder="Senha atual" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Nova senha</label>
            <PasswordInput value={newPassword} onChange={setNewPassword} show={showNew} onToggle={() => setShowNew(!showNew)} placeholder="Mínimo 6 caracteres" />
            {newPassword && newPassword.length < 6 && <p className="text-xs text-destructive mt-1">Mínimo de 6 caracteres</p>}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Confirmar nova senha</label>
            <PasswordInput value={confirmPassword} onChange={setConfirmPassword} show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} placeholder="Repita a nova senha" />
            {confirmPassword && confirmPassword !== newPassword && <p className="text-xs text-destructive mt-1">As senhas não coincidem</p>}
          </div>
          <Button onClick={handlePasswordChange} disabled={changingPassword} variant="outline" className="gap-2">
            {changingPassword ? "Alterando..." : "Alterar senha"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
