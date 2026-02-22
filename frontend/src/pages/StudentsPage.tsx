import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchPredictions, PredictionRecord } from "@/services/predictionService";
import { RiskBadge } from "@/components/RiskBadge";
import { RiskLevel } from "@/data/types";
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

const PAGE_SIZE = 15;

function StudentsPage() {
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<RiskLevel | "all">("all");
  const [page, setPage] = useState(0);

  const { data: predictions = [], isLoading } = useQuery({
    queryKey: ["predictions"],
    queryFn: () => fetchPredictions(),
  });

  const filtered = useMemo(() => {
    return predictions.filter((s) => {
      const matchesSearch =
        (s.student_id ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (s.student_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (s.course ?? "").toLowerCase().includes(search.toLowerCase());
      const riskLevelNorm = (s.risk_level ?? "").toLowerCase() as RiskLevel;
      const matchesRisk = riskFilter === "all" || riskLevelNorm === riskFilter;
      return matchesSearch && matchesRisk;
    });
  }, [predictions, search, riskFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Estudiantes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {filtered.length} estudiantes · Datos reales de predicciones
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ID, nombre o programa…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5">
          {(["all", "alto", "medio", "bajo"] as const).map((level) => (
            <button
              key={level}
              onClick={() => { setRiskFilter(level); setPage(0); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                riskFilter === level
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              {level === "all" ? "Todos" : level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {predictions.length === 0 ? (
        <div className="stat-card flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-muted-foreground">
            No hay predicciones guardadas aún. Evalúa estudiantes desde el Evaluador para verlos aquí.
          </p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="stat-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["ID", "Nombre", "Programa", "Edad", "Género", "Beca", "Deudor", "Nota 1er Sem", "Nota 2do Sem", "Prob. Deserción", "Riesgo"].map(
                    (h) => (
                      <th key={h} className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {paginated.map((s) => {
                  const riskLevel = (s.risk_level ?? "medio").toLowerCase() as RiskLevel;
                  const dropoutProb = s.dropout_prob ?? s.risk_score ?? 0;
                  return (
                    <tr key={s.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-xs font-medium">{s.student_id}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap">{s.student_name ?? "—"}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap">{s.course ?? "—"}</td>
                      <td className="py-2.5 px-3">{s.age_at_enrollment ?? "—"}</td>
                      <td className="py-2.5 px-3">{s.gender === 1 ? "M" : s.gender === 0 ? "F" : "—"}</td>
                      <td className="py-2.5 px-3">{s.scholarship_holder === 1 ? "Sí" : s.scholarship_holder === 0 ? "No" : "—"}</td>
                      <td className="py-2.5 px-3">{s.debtor === 1 ? "Sí" : s.debtor === 0 ? "No" : "—"}</td>
                      <td className="py-2.5 px-3 font-mono text-xs">{s.cu_1st_sem_grade ?? "—"}</td>
                      <td className="py-2.5 px-3 font-mono text-xs">{s.cu_2nd_sem_grade ?? "—"}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${(dropoutProb) * 100}%`,
                                backgroundColor:
                                  riskLevel === "alto" ? "hsl(0,72%,51%)" :
                                  riskLevel === "medio" ? "hsl(38,92%,50%)" : "hsl(142,64%,40%)",
                              }}
                            />
                          </div>
                          <span className="font-mono text-xs">{Math.round(dropoutProb * 100)}%</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <RiskBadge level={riskLevel} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Página {page + 1} de {totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
                  className="p-1.5 rounded-md border border-border hover:bg-muted disabled:opacity-30">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}
                  className="p-1.5 rounded-md border border-border hover:bg-muted disabled:opacity-30">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default StudentsPage;
