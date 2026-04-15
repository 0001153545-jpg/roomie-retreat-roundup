import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { ShieldAlert, DatabaseBackup, Trash2, RotateCcw, AlertTriangle, Bug, Download, Loader2 } from "lucide-react";

interface Backup {
  id: string;
  label: string;
  tables_included: string[];
  created_at: string;
}

const AdminResilience = () => {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const callResilience = async (action: string, extra: Record<string, string> = {}) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Não autenticado");

    const res = await supabase.functions.invoke("resilience-admin", {
      body: { action, ...extra },
    });

    if (res.error) throw new Error(res.error.message);
    if (res.data?.error) throw new Error(res.data.error);
    return res.data;
  };

  const loadBackups = async () => {
    try {
      const data = await callResilience("list_backups");
      setBackups(data.backups || []);
    } catch (err: any) {
      toast({ title: "Erro ao carregar backups", description: err.message, variant: "destructive" });
    }
  };

  useEffect(() => { loadBackups(); }, []);

  const handleAction = async (action: string, label: string, extra: Record<string, string> = {}) => {
    setActionLoading(action);
    try {
      const data = await callResilience(action, extra);
      toast({ title: "Sucesso", description: data.message || `${label} executado com sucesso.` });
      await loadBackups();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteBackup = async (id: string) => {
    setActionLoading("delete_" + id);
    try {
      await callResilience("delete_backup", { backup_id: id });
      setBackups((prev) => prev.filter((b) => b.id !== id));
      toast({ title: "Backup excluído" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShieldAlert className="h-7 w-7 text-destructive" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Testes de Resiliência</h1>
          <p className="text-sm text-muted-foreground">Simulações de falhas reais no backend com backup e restauração</p>
        </div>
      </div>

      <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
        <CardContent className="pt-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-sm text-amber-800 dark:text-amber-300">
            <strong>Atenção:</strong> As ações abaixo executam operações <strong>reais</strong> no banco de dados.
            Backups automáticos são criados antes de cada ação destrutiva. Use com responsabilidade.
          </div>
        </CardContent>
      </Card>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Backup Manual */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DatabaseBackup className="h-4 w-4 text-primary" /> Criar Backup
            </CardTitle>
            <CardDescription>Snapshot completo de todas as tabelas</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              onClick={() => handleAction("backup", "Backup", { label: `Manual - ${new Date().toLocaleString("pt-BR")}` })}
              disabled={!!actionLoading}
            >
              {actionLoading === "backup" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
              Criar Backup
            </Button>
          </CardContent>
        </Card>

        {/* Simular Perda de Dados */}
        <Card className="border-destructive/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-destructive" /> Perda de Dados
            </CardTitle>
            <CardDescription>Remove TODOS os dados reais do banco</CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full" disabled={!!actionLoading}>
                  {actionLoading === "simulate_data_loss" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                  Simular Perda
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-destructive">⚠️ Ação Destrutiva</AlertDialogTitle>
                  <AlertDialogDescription>
                    Isso vai <strong>apagar todos os dados</strong> (perfis, quartos, reservas, avaliações, favoritos) do banco de dados.
                    Um backup automático será criado antes da exclusão. Deseja continuar?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => handleAction("simulate_data_loss", "Perda de dados")}
                  >
                    Confirmar Exclusão
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        {/* Dados Corrompidos */}
        <Card className="border-amber-400/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bug className="h-4 w-4 text-amber-600" /> Corrupção de Dados
            </CardTitle>
            <CardDescription>Insere valores inválidos no banco</CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full border-amber-400 text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/30" disabled={!!actionLoading}>
                  {actionLoading === "simulate_corruption" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Bug className="h-4 w-4 mr-2" />}
                  Simular Corrupção
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-amber-600">⚠️ Dados Corrompidos</AlertDialogTitle>
                  <AlertDialogDescription>
                    Isso vai inserir valores inválidos (preços negativos, nomes corrompidos, campos vazios) diretamente no banco.
                    Um backup automático será criado antes. Deseja continuar?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-amber-600 text-white hover:bg-amber-700"
                    onClick={() => handleAction("simulate_corruption", "Corrupção")}
                  >
                    Confirmar Corrupção
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        {/* Simular Falha no Banco */}
        <Card className="border-orange-400/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" /> Falha no Banco
            </CardTitle>
            <CardDescription>Simula timeout/erro 500 nas requisições</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-2">
              Ativa um modo de falha simulada por 30 segundos nas consultas do painel.
            </p>
            <Button
              variant="outline"
              className="w-full border-orange-400 text-orange-700 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-950/30"
              disabled={!!actionLoading}
              onClick={() => {
                localStorage.setItem("resilience_db_failure", String(Date.now() + 30000));
                toast({
                  title: "Modo de falha ativado",
                  description: "Requisições ao banco retornarão erro por 30 segundos. Navegue pelo painel para ver o efeito.",
                });
              }}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Ativar Falha (30s)
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Backups Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Backups Disponíveis</CardTitle>
              <CardDescription>Restaure qualquer snapshot anterior</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadBackups}>
              <RotateCcw className="h-4 w-4 mr-1" /> Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tabelas</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="w-40">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {backups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Nenhum backup encontrado
                  </TableCell>
                </TableRow>
              ) : (
                backups.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">
                      {b.label}
                      {b.label.startsWith("[Auto]") && (
                        <Badge variant="secondary" className="ml-2 text-xs">Auto</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {b.tables_included.map((t) => (
                          <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{new Date(b.created_at).toLocaleString("pt-BR")}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="default" disabled={!!actionLoading}>
                              <RotateCcw className="h-3 w-3 mr-1" /> Restaurar
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Restaurar backup?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Todos os dados atuais serão substituídos pelo snapshot "{b.label}".
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleAction("restore", "Restauração", { backup_id: b.id })}>
                                Restaurar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          disabled={!!actionLoading}
                          onClick={() => handleDeleteBackup(b.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminResilience;
