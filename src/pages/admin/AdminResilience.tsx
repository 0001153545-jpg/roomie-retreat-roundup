import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  AlertTriangle, Database, Download, HardDrive, RefreshCw, ServerCrash,
  Shield, Trash2, CheckCircle2, XCircle, Clock, FileWarning, GraduationCap,
} from "lucide-react";
import { toast } from "sonner";

interface BackupEntry {
  id: string;
  timestamp: string;
  profiles: any[];
  listings: any[];
  reservations: any[];
  label: string;
}

type SimulationState = "normal" | "data_loss" | "db_failure" | "corrupted";

const AdminResilience = () => {
  const [simulationState, setSimulationState] = useState<SimulationState>("normal");
  const [backups, setBackups] = useState<BackupEntry[]>(() => {
    const saved = localStorage.getItem("rf_backups");
    return saved ? JSON.parse(saved) : [];
  });
  const [hiddenData, setHiddenData] = useState<{ profiles: any[]; listings: any[]; reservations: any[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<{ type: "success" | "error" | "warning"; message: string; time: string }[]>([]);

  const addLog = (type: "success" | "error" | "warning", message: string) => {
    setLogs((prev) => [{ type, message, time: new Date().toLocaleTimeString("pt-BR") }, ...prev].slice(0, 50));
  };

  useEffect(() => {
    localStorage.setItem("rf_backups", JSON.stringify(backups));
  }, [backups]);

  const createBackup = async (label: string) => {
    setLoading(true);
    try {
      const [p, l, r] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("listings").select("*"),
        supabase.from("reservations").select("*"),
      ]);
      const entry: BackupEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        profiles: p.data || [],
        listings: l.data || [],
        reservations: r.data || [],
        label,
      };
      setBackups((prev) => [entry, ...prev]);
      addLog("success", `Backup "${label}" criado com ${(p.data?.length || 0)} perfis, ${(l.data?.length || 0)} quartos, ${(r.data?.length || 0)} reservas.`);
      toast.success("Backup criado com sucesso!");
    } catch {
      addLog("error", "Falha ao criar backup.");
      toast.error("Erro ao criar backup.");
    }
    setLoading(false);
  };

  const simulateDataLoss = async () => {
    setLoading(true);
    // First create auto-backup
    await createBackup("Auto-backup (antes da simulação de perda)");

    // Fetch current data and hide it in state
    const [p, l, r] = await Promise.all([
      supabase.from("profiles").select("*"),
      supabase.from("listings").select("*"),
      supabase.from("reservations").select("*"),
    ]);
    setHiddenData({
      profiles: p.data || [],
      listings: l.data || [],
      reservations: r.data || [],
    });
    setSimulationState("data_loss");
    addLog("warning", "⚠️ SIMULAÇÃO: Perda de dados ativada. Os dados estão ocultos na interface (NÃO foram apagados do banco).");
    toast("Simulação de perda de dados ativada", { icon: "⚠️" });
    setLoading(false);
  };

  const simulateDbFailure = () => {
    setSimulationState("db_failure");
    addLog("error", "🔴 SIMULAÇÃO: Falha no banco de dados. O sistema está simulando indisponibilidade.");
    toast.error("Simulação: Banco de dados indisponível!");
  };

  const simulateCorruptedData = async () => {
    setLoading(true);
    await createBackup("Auto-backup (antes da simulação de corrupção)");

    const [p, l, r] = await Promise.all([
      supabase.from("profiles").select("*"),
      supabase.from("listings").select("*"),
      supabase.from("reservations").select("*"),
    ]);

    // Corrupt data in memory only
    const corruptedProfiles = (p.data || []).map((prof: any, i: number) =>
      i % 3 === 0 ? { ...prof, full_name: null, email: "CORROMPIDO@error" } : prof
    );
    const corruptedListings = (l.data || []).map((lst: any, i: number) =>
      i % 2 === 0 ? { ...lst, price: -999, title: "██ DADO CORROMPIDO ██" } : lst
    );

    setHiddenData({
      profiles: corruptedProfiles,
      listings: corruptedListings,
      reservations: r.data || [],
    });
    setSimulationState("corrupted");
    addLog("warning", "⚠️ SIMULAÇÃO: Dados corrompidos detectados. Valores negativos e campos nulos introduzidos.");
    toast("Simulação de dados corrompidos ativada", { icon: "⚠️" });
    setLoading(false);
  };

  const restoreFromBackup = (backup: BackupEntry) => {
    setSimulationState("normal");
    setHiddenData(null);
    addLog("success", `✅ Dados restaurados a partir do backup "${backup.label}" (${new Date(backup.timestamp).toLocaleString("pt-BR")}).`);
    toast.success("Dados restaurados com sucesso! Sistema voltou ao normal.");
  };

  const resetSimulation = () => {
    setSimulationState("normal");
    setHiddenData(null);
    addLog("success", "✅ Simulação encerrada. Sistema restaurado ao estado normal.");
    toast.success("Sistema restaurado ao estado normal.");
  };

  const deleteBackup = (id: string) => {
    setBackups((prev) => prev.filter((b) => b.id !== id));
    addLog("warning", "Backup removido.");
    toast("Backup removido");
  };

  const stateConfig: Record<SimulationState, { label: string; color: string; icon: React.ElementType; bg: string }> = {
    normal: { label: "Normal", color: "text-green-600", icon: CheckCircle2, bg: "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800" },
    data_loss: { label: "Perda de Dados", color: "text-red-600", icon: XCircle, bg: "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800" },
    db_failure: { label: "Falha no Banco", color: "text-red-600", icon: ServerCrash, bg: "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800" },
    corrupted: { label: "Dados Corrompidos", color: "text-amber-600", icon: FileWarning, bg: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800" },
  };
  const currentState = stateConfig[simulationState];
  const StateIcon = currentState.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Simulação de Falhas & Recuperação</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Módulo acadêmico para teste de resiliência do sistema. Nenhum dado real é permanentemente afetado.
          </p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${currentState.bg}`}>
          <StateIcon className={`h-5 w-5 ${currentState.color}`} />
          <span className={`font-semibold ${currentState.color}`}>Estado: {currentState.label}</span>
        </div>
      </div>

      {/* Active simulation alert */}
      {simulationState !== "normal" && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Simulação ativa</AlertTitle>
          <AlertDescription className="flex items-center justify-between flex-wrap gap-2">
            <span>
              {simulationState === "data_loss" && "Os dados estão ocultos para simular uma perda. Restaure via backup para recuperá-los."}
              {simulationState === "db_failure" && "O sistema está simulando uma falha no banco de dados. Funcionalidades de leitura estão bloqueadas."}
              {simulationState === "corrupted" && "Dados corrompidos detectados: valores negativos e campos nulos. Restaure via backup."}
            </span>
            <Button size="sm" variant="outline" onClick={resetSimulation}>
              <RefreshCw className="mr-2 h-4 w-4" /> Encerrar Simulação
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* DB Failure view */}
      {simulationState === "db_failure" && (
        <Card className="border-red-300 dark:border-red-800">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ServerCrash className="h-16 w-16 text-red-500 mb-4" />
            <h2 className="text-xl font-bold text-red-600 mb-2">Serviço Temporariamente Indisponível</h2>
            <p className="text-muted-foreground max-w-md">
              Não foi possível conectar ao banco de dados. Por favor, tente novamente mais tarde ou restaure a partir de um backup.
            </p>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={resetSimulation}>
                <RefreshCw className="mr-2 h-4 w-4" /> Reconectar
              </Button>
              {backups.length > 0 && (
                <Button onClick={() => restoreFromBackup(backups[0])}>
                  <HardDrive className="mr-2 h-4 w-4" /> Restaurar último backup
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {simulationState !== "db_failure" && (
        <>
          {/* Simulation Buttons */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-l-4 border-l-red-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><Trash2 className="h-4 w-4 text-red-500" /> Perda de Dados</CardTitle>
                <CardDescription>Simula a perda temporária de reservas, usuários e quartos.</CardDescription>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="w-full" disabled={simulationState !== "normal" || loading}>
                      Simular perda de dados
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Simular perda de dados?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Um backup automático será criado antes da simulação. Nenhum dado real será apagado do banco.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={simulateDataLoss} className="bg-destructive text-destructive-foreground">Iniciar Simulação</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><ServerCrash className="h-4 w-4 text-red-500" /> Falha no Banco</CardTitle>
                <CardDescription>Simula indisponibilidade do banco de dados.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" size="sm" className="w-full" disabled={simulationState !== "normal"} onClick={simulateDbFailure}>
                  Simular falha no banco
                </Button>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><FileWarning className="h-4 w-4 text-amber-500" /> Dados Corrompidos</CardTitle>
                <CardDescription>Introduz valores inválidos e campos nulos na exibição.</CardDescription>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30" disabled={simulationState !== "normal" || loading}>
                      Simular dados corrompidos
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Simular dados corrompidos?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Um backup será criado. Valores negativos e campos vazios aparecerão na visualização (sem alterar o banco).
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={simulateCorruptedData}>Iniciar Simulação</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>

          {/* Corrupted/Lost Data Preview */}
          {(simulationState === "corrupted" || simulationState === "data_loss") && hiddenData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {simulationState === "data_loss" ? "📭 Dados Perdidos (vazios)" : "🔴 Dados Corrompidos Detectados"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {simulationState === "data_loss" ? (
                  <div className="grid gap-4 sm:grid-cols-3 text-center">
                    <div className="p-6 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                      <p className="text-3xl font-bold text-red-600">0</p>
                      <p className="text-sm text-muted-foreground">Perfis encontrados</p>
                    </div>
                    <div className="p-6 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                      <p className="text-3xl font-bold text-red-600">0</p>
                      <p className="text-sm text-muted-foreground">Quartos encontrados</p>
                    </div>
                    <div className="p-6 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                      <p className="text-3xl font-bold text-red-600">0</p>
                      <p className="text-sm text-muted-foreground">Reservas encontradas</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">Exemplos de dados corrompidos detectados:</p>
                    <div className="rounded border overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Campo</TableHead>
                            <TableHead>Valor Corrompido</TableHead>
                            <TableHead>Problema</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {hiddenData.listings.filter((l: any) => l.price < 0).slice(0, 3).map((l: any, i: number) => (
                            <TableRow key={`l-${i}`} className="bg-amber-50/50 dark:bg-amber-950/20">
                              <TableCell><Badge variant="outline">Quarto</Badge></TableCell>
                              <TableCell>price</TableCell>
                              <TableCell className="text-red-600 font-mono">R$ {l.price}</TableCell>
                              <TableCell className="text-amber-600">Valor negativo</TableCell>
                            </TableRow>
                          ))}
                          {hiddenData.profiles.filter((p: any) => p.email === "CORROMPIDO@error").slice(0, 3).map((p: any, i: number) => (
                            <TableRow key={`p-${i}`} className="bg-amber-50/50 dark:bg-amber-950/20">
                              <TableCell><Badge variant="outline">Perfil</Badge></TableCell>
                              <TableCell>full_name / email</TableCell>
                              <TableCell className="text-red-600 font-mono">{p.full_name ?? "NULL"} / {p.email}</TableCell>
                              <TableCell className="text-amber-600">Campo nulo / inválido</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Backup Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-base flex items-center gap-2"><HardDrive className="h-4 w-4" /> Sistema de Backup</CardTitle>
                <CardDescription>Crie e gerencie backups dos dados do sistema.</CardDescription>
              </div>
              <Button onClick={() => createBackup("Backup manual")} disabled={loading} size="sm">
                <Download className="mr-2 h-4 w-4" /> {loading ? "Gerando..." : "Gerar backup agora"}
              </Button>
            </CardHeader>
            <CardContent>
              {backups.length === 0 ? (
                <p className="text-center text-muted-foreground py-6">Nenhum backup criado ainda.</p>
              ) : (
                <div className="rounded border overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Perfis</TableHead>
                        <TableHead>Quartos</TableHead>
                        <TableHead>Reservas</TableHead>
                        <TableHead className="w-32">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {backups.map((b) => (
                        <TableRow key={b.id}>
                          <TableCell className="font-medium">{b.label}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            <Clock className="inline h-3 w-3 mr-1" />
                            {new Date(b.timestamp).toLocaleString("pt-BR")}
                          </TableCell>
                          <TableCell>{b.profiles.length}</TableCell>
                          <TableCell>{b.listings.length}</TableCell>
                          <TableCell>{b.reservations.length}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" onClick={() => restoreFromBackup(b)} disabled={simulationState === "normal"}>
                                <RefreshCw className="h-3 w-3 mr-1" /> Restaurar
                              </Button>
                              <Button size="icon" variant="ghost" className="text-destructive h-8 w-8" onClick={() => deleteBackup(b.id)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Database className="h-4 w-4" /> Log de Atividades</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">Nenhuma atividade registrada.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-auto">
              {logs.map((log, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2 text-sm px-3 py-2 rounded-lg border ${
                    log.type === "success" ? "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800" :
                    log.type === "error" ? "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800" :
                    "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800"
                  }`}
                >
                  {log.type === "success" ? <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" /> :
                   log.type === "error" ? <XCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" /> :
                   <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />}
                  <div className="flex-1">
                    <p className="text-foreground">{log.message}</p>
                    <p className="text-xs text-muted-foreground">{log.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Academic Info */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex items-start gap-3 pt-6">
          <Shield className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div className="text-sm space-y-1">
            <p className="font-semibold text-foreground">🎓 Nota Acadêmica</p>
            <p className="text-muted-foreground">
              Este módulo é uma <strong>simulação controlada</strong> para fins de teste de resiliência. 
              Nenhum dado real é permanentemente modificado ou excluído do banco de dados. 
              As simulações ocorrem em memória (client-side) e os backups são armazenados localmente no navegador.
            </p>
            <ul className="text-muted-foreground list-disc pl-5 space-y-0.5 mt-2">
              <li><strong>Perda de dados</strong>: Oculta os dados na interface sem deletá-los do banco.</li>
              <li><strong>Falha no banco</strong>: Simula indisponibilidade mostrando mensagens de erro.</li>
              <li><strong>Dados corrompidos</strong>: Exibe valores alterados (negativos, nulos) sem alterar o banco.</li>
              <li><strong>Backup/Restauração</strong>: Salva snapshots no localStorage e restaura o estado visual.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminResilience;
