import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Search, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  account_type: string;
  created_at: string;
  phone: string | null;
}

const AdminUsers = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "guest" | "owner">("all");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setProfiles(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return profiles.filter((p) => {
      const matchSearch = !search || (p.full_name?.toLowerCase().includes(search.toLowerCase()) || p.email?.toLowerCase().includes(search.toLowerCase()) || p.user_id.includes(search));
      const matchType = filterType === "all" || p.account_type === filterType;
      return matchSearch && matchType;
    });
  }, [profiles, search, filterType]);

  const handleDelete = async (profile: Profile) => {
    // Use cascade delete function to remove all user data
    const { error } = await supabase.rpc("cascade_delete_user_data", { target_user_id: profile.user_id });
    if (error) {
      toast({ title: "Erro", description: "Não foi possível excluir o usuário e seus dados: " + error.message, variant: "destructive" });
    } else {
      toast({ title: "Usuário excluído com sucesso", description: "Todos os dados relacionados (quartos, reservas, favoritos, avaliações) foram removidos." });
      setProfiles((prev) => prev.filter((p) => p.id !== profile.id));
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Gestão de Usuários</h1>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, email ou ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2">
          {(["all", "guest", "owner"] as const).map((t) => (
            <Button key={t} size="sm" variant={filterType === t ? "default" : "outline"} onClick={() => setFilterType(t)}>
              {t === "all" ? "Todos" : t === "guest" ? "Hóspedes" : "Proprietários"}
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>User ID</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Data de Cadastro</TableHead>
              <TableHead className="w-16">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum usuário encontrado</TableCell></TableRow>
            ) : (
              filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.full_name || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.email || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">{p.user_id.slice(0, 8)}...</TableCell>
                  <TableCell>
                    <Badge variant={p.account_type === "owner" ? "default" : "secondary"}>
                      {p.account_type === "owner" ? "Proprietário" : "Hóspede"}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(p.created_at).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir usuário e todos os dados?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Essa ação não pode ser desfeita. Todos os dados de "{p.full_name || "usuário"}" serão removidos: quartos anunciados, reservas, favoritos e avaliações.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(p)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Excluir tudo
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <p className="text-sm text-muted-foreground">{filtered.length} usuário(s) encontrado(s)</p>
    </div>
  );
};

export default AdminUsers;
