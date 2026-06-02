import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { isAdminEmail } from "@/components/admin/AdminGuard";
import { ADMIN_MODULES, AdminModule } from "@/hooks/useAdminPermissions";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { ShieldCheck, Search, UserPlus, Trash2 } from "lucide-react";

interface AdminRow {
  user_id: string;
  email: string;
  perms: Partial<Record<AdminModule, boolean>>;
}

interface ProfileRow {
  user_id: string;
  full_name: string | null;
  email: string | null;
}

const AdminPermissions = () => {
  const { user } = useAuth();
  const isSuper = isAdminEmail(user?.email);
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileRow>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchProfiles, setSearchProfiles] = useState<ProfileRow[]>([]);
  const [searching, setSearching] = useState(false);
  const [toRemove, setToRemove] = useState<AdminRow | null>(null);

  const loadAdmins = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("admin_permissions" as any).select("*").order("created_at", { ascending: true });
    if (error) {
      toast.error("Erro ao carregar administradores: " + error.message);
      setAdmins([]);
    } else {
      const rows = (data || []) as any as AdminRow[];
      setAdmins(rows);
      const ids = rows.map((r) => r.user_id);
      if (ids.length > 0) {
        const { data: profs } = await supabase.rpc("get_public_profiles", { target_user_ids: ids });
        if (profs) {
          const map: Record<string, ProfileRow> = {};
          (profs as any[]).forEach((p) => { map[p.user_id] = { user_id: p.user_id, full_name: p.full_name, email: null }; });
          setProfiles(map);
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => { if (isSuper) loadAdmins(); }, [isSuper]);

  const togglePerm = async (admin: AdminRow, module: AdminModule, value: boolean) => {
    const nextPerms = { ...admin.perms, [module]: value };
    setAdmins((prev) => prev.map((a) => (a.user_id === admin.user_id ? { ...a, perms: nextPerms } : a)));
    const { error } = await supabase
      .from("admin_permissions" as any)
      .update({ perms: nextPerms } as any)
      .eq("user_id", admin.user_id);
    if (error) {
      toast.error("Erro ao salvar: " + error.message);
      loadAdmins();
    } else {
      toast.success("Permissão atualizada");
    }
  };

  const confirmRemove = async () => {
    if (!toRemove) return;
    const admin = toRemove;
    setToRemove(null);
    const { error } = await supabase.from("admin_permissions" as any).delete().eq("user_id", admin.user_id);
    if (error) toast.error("Erro: " + error.message);
    else { toast.success("Administrador removido"); loadAdmins(); }
  };

  const searchUsers = async () => {
    if (!search.trim()) { setSearchProfiles([]); return; }
    setSearching(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("user_id, full_name, email")
      .or(`email.ilike.%${search}%,full_name.ilike.%${search}%`)
      .limit(10);
    setSearching(false);
    if (error) toast.error("Erro ao buscar: " + error.message);
    else setSearchProfiles((data || []) as ProfileRow[]);
  };

  const addAdmin = async (profile: ProfileRow) => {
    if (admins.some((a) => a.user_id === profile.user_id)) {
      toast.info("Este usuário já é administrador");
      return;
    }
    const { error } = await supabase.from("admin_permissions" as any).insert({
      user_id: profile.user_id,
      email: profile.email || profile.full_name || profile.user_id,
      perms: {},
    } as any);
    if (error) toast.error("Erro: " + error.message);
    else {
      toast.success("Administrador adicionado");
      setSearch("");
      setSearchProfiles([]);
      loadAdmins();
    }
  };

  if (!isSuper) {
    // Defensive: page is also gated by AdminGuard requireModule="permissions"
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-destructive mb-2">Acesso Negado</h1>
        <p className="text-muted-foreground">Apenas o Super Administrador pode gerenciar permissões.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Permissões de Administradores</h1>
          <p className="text-sm text-muted-foreground">Defina o que cada administrador pode visualizar, editar ou excluir.</p>
        </div>
      </div>

      <Card className="p-5 space-y-3">
        <h2 className="font-semibold text-foreground flex items-center gap-2"><UserPlus className="h-4 w-4" /> Adicionar administrador</h2>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") searchUsers(); }}
              placeholder="Buscar usuário por email ou nome..."
              className="pl-9"
            />
          </div>
          <Button onClick={searchUsers} disabled={searching}>Buscar</Button>
        </div>
        {searchProfiles.length > 0 && (
          <div className="space-y-2 pt-2">
            {searchProfiles.map((p) => (
              <div key={p.user_id} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{p.full_name || "(sem nome)"}</p>
                  <p className="text-xs text-muted-foreground">{p.email || p.user_id}</p>
                </div>
                <Button size="sm" onClick={() => addAdmin(p)}>Adicionar como admin</Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Administradores cadastrados</h2>
          <Badge variant="secondary">{admins.length}</Badge>
        </div>
        {loading ? (
          <p className="text-muted-foreground text-sm">Carregando...</p>
        ) : admins.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhum administrador adicional. Apenas o Super Administrador tem acesso ao painel.</p>
        ) : (
          <div className="space-y-4">
            {admins.map((admin) => {
              const prof = profiles[admin.user_id];
              return (
                <div key={admin.user_id} className="rounded-lg border border-border p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{prof?.full_name || admin.email}</p>
                      <p className="text-xs text-muted-foreground">{admin.email}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setToRemove(admin)} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {ADMIN_MODULES.filter((m) => m.key !== "permissions").map((m) => (
                      <label key={m.key} className="flex items-center justify-between gap-3 rounded-md bg-muted/30 px-3 py-2">
                        <span className="text-sm text-foreground">{m.label}</span>
                        <Switch
                          checked={!!admin.perms[m.key]}
                          onCheckedChange={(v) => togglePerm(admin, m.key, v)}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <p className="text-xs text-muted-foreground">
        Observação: o módulo "Gerenciar Permissões" só pode ser usado pelo Super Administrador (e-mail principal do sistema).
        Administradores comuns não podem alterar suas próprias permissões nem as de outros.
      </p>

      <AlertDialog open={!!toRemove} onOpenChange={(open) => !open && setToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover administrador?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <span className="font-semibold text-foreground">{toRemove?.email}</span> como administrador?
              Esta ação revoga todas as permissões concedidas e pode ser desfeita adicionando-o novamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPermissions;
