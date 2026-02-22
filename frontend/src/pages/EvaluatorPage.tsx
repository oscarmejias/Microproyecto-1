import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { PredictionResponse, SimplePredictionInput, DEFAULT_SIMPLE_INPUT, predictStudentSimple, predictBatchCSV, BatchPredictionResult } from "@/services/predictionService";
import { parseSimpleStudentCSV } from "@/utils/csvParser";
import { RiskBadge } from "@/components/RiskBadge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserSearch, Zap, AlertTriangle, CheckCircle, Upload, FileText, Users, ArrowRight } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { toast } from "sonner";
import { RiskLevel } from "@/data/types";

/* ─── Helpers ─── */

function NumberField({ label, value, onChange, min, max, step = 1 }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input type="number" className="h-9 text-xs" value={value} min={min} max={max} step={step}
        onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

function TextField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input type="text" className="h-9 text-xs" value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function BoolField({ label, value, onChange }: {
  label: string; value: number; onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Switch checked={value === 1} onCheckedChange={(c) => onChange(c ? 1 : 0)} />
      <Label className="text-xs">{label}</Label>
    </div>
  );
}

/* ─── Results Panel ─── */

function ResultPanel({ result }: { result: PredictionResponse }) {
  const probData = [
    { name: "Deserción", value: result.dropoutProbability, fill: "hsl(0, 72%, 51%)" },
    { name: "Graduación", value: result.graduateProbability, fill: "hsl(142, 64%, 40%)" },
    { name: "Matriculado", value: result.enrolledProbability, fill: "hsl(38, 92%, 50%)" },
  ];

  const actions = result.riskLevel === "alto"
    ? ["Asignar tutor académico semanal", "Evaluar beca de emergencia", "Contacto con bienestar estudiantil", "Plan de financiamiento"]
    : result.riskLevel === "medio"
    ? ["Mentoría entre pares", "Seguimiento quincenal", "Talleres de refuerzo"]
    : ["Monitoreo pasivo", "Incluir en programa de liderazgo"];

  return (
    <div className="space-y-4">
      <div className={`stat-card border-l-4 ${
        result.riskLevel === "alto" ? "border-l-risk-high" :
        result.riskLevel === "medio" ? "border-l-risk-medium" : "border-l-risk-low"
      }`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Resultado de Predicción</h3>
          <RiskBadge level={result.riskLevel} />
        </div>
        <div className="text-center py-3">
          <p className="text-4xl font-bold" style={{
            color: result.riskLevel === "alto" ? "hsl(0,72%,51%)" :
                   result.riskLevel === "medio" ? "hsl(38,92%,50%)" : "hsl(142,64%,40%)"
          }}>
            {Math.round(result.dropoutProbability * 100)}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">Probabilidad de deserción</p>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie data={probData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value" stroke="none">
              {probData.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
            </Pie>
            <Tooltip formatter={(v: number) => [`${Math.round(v * 100)}%`]} contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-risk-high inline-block" /> Deserción</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-risk-low inline-block" /> Graduación</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-risk-medium inline-block" /> Matriculado</span>
        </div>
      </div>

      <div className="stat-card">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-risk-medium" /> Factores de Riesgo
        </h3>
        <ul className="space-y-2">
          {result.topRiskFactors.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-risk-high mt-1.5 shrink-0" />
              {f}
            </li>
          ))}
        </ul>
      </div>

      <div className="stat-card">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-accent" /> Acciones Recomendadas
        </h3>
        <ul className="space-y-2">
          {actions.map((a, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
              {a}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ─── CSV Preview Table ─── */

function CsvPreviewTable({ rows, fileName }: { rows: SimplePredictionInput[]; fileName: string }) {
  const maxVisible = 10;
  const visibleRows = rows.slice(0, maxVisible);

  return (
    <div className="stat-card overflow-x-auto">
      <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
        <FileText className="w-4 h-4 text-primary" /> {fileName}
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        {rows.length} estudiante{rows.length !== 1 ? "s" : ""} encontrado{rows.length !== 1 ? "s" : ""}
      </p>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {["ID", "Nombre", "Curso", "Sem.", "Edad", "Género", "Becado"].map((h) => (
              <th key={h} className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visibleRows.map((r, i) => (
            <tr key={i} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
              <td className="py-2.5 px-3 font-mono text-xs font-medium">{r.student_id || "—"}</td>
              <td className="py-2.5 px-3 text-xs">{r.name || "—"}</td>
              <td className="py-2.5 px-3 text-xs max-w-[150px] truncate">{r.course || "—"}</td>
              <td className="py-2.5 px-3 text-xs">{r.semester}</td>
              <td className="py-2.5 px-3 text-xs">{r.age_at_enrollment}</td>
              <td className="py-2.5 px-3 text-xs">{r.gender === 1 ? "M" : "F"}</td>
              <td className="py-2.5 px-3 text-xs">{r.scholarship_holder === 1 ? "Sí" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > maxVisible && (
        <p className="text-xs text-muted-foreground mt-2 text-center">
          … y {rows.length - maxVisible} estudiante{rows.length - maxVisible !== 1 ? "s" : ""} más
        </p>
      )}
    </div>
  );
}

/* ─── Batch Results Table ─── */

function BatchResultsTable({ results }: { results: BatchPredictionResult[] }) {
  const riskMap: Record<string, RiskLevel> = { Alto: "alto", Medio: "medio", Bajo: "bajo", High: "alto", Medium: "medio", Low: "bajo" };

  return (
    <div className="stat-card overflow-x-auto">
      <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        <Users className="w-4 h-4" /> Resultados — {results.length} estudiantes evaluados
      </h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {["ID", "Resultado", "Riesgo", "Score", "Recomendación"].map((h) => (
              <th key={h} className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {results.map((r, i) => (
            <tr key={i} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
              <td className="py-2.5 px-3 font-mono text-xs font-medium">{r.student_id}</td>
              <td className="py-2.5 px-3">{r.outcome}</td>
              <td className="py-2.5 px-3"><RiskBadge level={riskMap[r.risk_level] ?? "medio"} /></td>
              <td className="py-2.5 px-3 font-mono text-xs">{Math.round((r.risk_score ?? 0) * 100)}%</td>
              <td className="py-2.5 px-3 text-xs max-w-[300px] truncate">{r.recommendation}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Main Page ─── */

function EvaluatorPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<SimplePredictionInput>({ ...DEFAULT_SIMPLE_INPUT });
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [csvFileName, setCsvFileName] = useState<string | null>(null);

  // Batch state
  const [batchResults, setBatchResults] = useState<BatchPredictionResult[]>([]);
  const [isBatchEvaluating, setIsBatchEvaluating] = useState(false);
  const [batchCsvFileName, setBatchCsvFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<SimplePredictionInput[]>([]);
  const [batchFile, setBatchFile] = useState<File | null>(null);

  const updateField = useCallback(<K extends keyof SimplePredictionInput>(key: K, value: SimplePredictionInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleCSV = useCallback(async (file: File) => {
    try {
      const parsed = await parseSimpleStudentCSV(file);
      if (parsed.length > 0) {
        setForm(parsed[0]);
        setCsvFileName(file.name);
        toast.success(`CSV cargado: ${file.name}. ${parsed.length} fila(s) encontrada(s). Se cargó la primera fila.`);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al parsear CSV");
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".csv")) handleCSV(file);
    else toast.error("Solo se aceptan archivos CSV.");
  }, [handleCSV]);

  const handleEvaluate = useCallback(async () => {
    setIsEvaluating(true);
    try {
      const res = await predictStudentSimple(form);
      setResult(res);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error en la predicción");
    } finally {
      setIsEvaluating(false);
    }
  }, [form]);

  // Batch: load & preview CSV (no API call yet)
  const handleBatchLoad = useCallback(async (file: File) => {
    try {
      const parsed = await parseSimpleStudentCSV(file);
      setParsedRows(parsed);
      setBatchFile(file);
      setBatchCsvFileName(file.name);
      setBatchResults([]);
      toast.success(`${parsed.length} estudiante(s) encontrado(s) en ${file.name}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al parsear CSV");
    }
  }, []);

  // Batch: send to API
  const handleBatchEvaluate = useCallback(async () => {
    if (!batchFile) return;
    setIsBatchEvaluating(true);
    try {
      const batchId = `BATCH-${Date.now()}`;
      const results = await predictBatchCSV(batchFile, batchId);
      setBatchResults(results);
      toast.success(`${results.length} estudiantes evaluados y guardados.`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error en evaluación masiva");
    } finally {
      setIsBatchEvaluating(false);
    }
  }, [batchFile]);

  const handleBatchDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".csv")) handleBatchLoad(file);
    else toast.error("Solo se aceptan archivos CSV.");
  }, [handleBatchLoad]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Evaluador de Estudiantes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Evaluación individual o masiva mediante CSV
        </p>
      </div>

      <Tabs defaultValue="individual" className="w-full">
        <TabsList>
          <TabsTrigger value="individual" className="flex items-center gap-2">
            <UserSearch className="w-4 h-4" /> Individual
          </TabsTrigger>
          <TabsTrigger value="batch" className="flex items-center gap-2">
            <Users className="w-4 h-4" /> Evaluación Masiva
          </TabsTrigger>
        </TabsList>

        {/* ─── Individual Tab ─── */}
        <TabsContent value="individual" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              {/* CSV Upload Zone */}
              <div
                className="stat-card border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors cursor-pointer"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => document.getElementById("csv-input")?.click()}
              >
                <input id="csv-input" type="file" accept=".csv" className="hidden"
                  onChange={(e) => { if (e.target.files?.[0]) handleCSV(e.target.files[0]); }} />
                <div className="flex flex-col items-center py-4 gap-2 text-center">
                  {csvFileName ? (
                    <>
                      <FileText className="w-8 h-8 text-primary" />
                      <p className="text-sm font-medium text-foreground">{csvFileName}</p>
                      <p className="text-xs text-muted-foreground">Archivo cargado — campos rellenados automáticamente</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">Arrastra un CSV aquí o haz clic para seleccionar</p>
                      <p className="text-xs text-muted-foreground/70">Se extraerán las variables y se llenarán los campos</p>
                    </>
                  )}
                </div>
              </div>

              {/* Form */}
              <div className="stat-card p-6">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <UserSearch className="w-4 h-4" /> Datos del Estudiante
                </h3>

                <Tabs defaultValue="student" className="w-full">
                  <TabsList className="w-full flex justify-start gap-1 h-auto flex-wrap">
                    <TabsTrigger value="student" className="text-xs">Estudiante</TabsTrigger>
                    <TabsTrigger value="profile" className="text-xs">Perfil</TabsTrigger>
                    <TabsTrigger value="performance" className="text-xs">Rendimiento</TabsTrigger>
                  </TabsList>

                  <TabsContent value="student" className="mt-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <TextField label="ID Estudiante" value={form.student_id} onChange={(v) => updateField("student_id", v)} placeholder="ST-2024-001" />
                      <TextField label="Nombre" value={form.name} onChange={(v) => updateField("name", v)} placeholder="John Doe" />
                      <NumberField label="Semestre" value={form.semester} onChange={(v) => updateField("semester", v)} min={1} max={12} />
                      <TextField label="Batch ID" value={form.batch_id} onChange={(v) => updateField("batch_id", v)} placeholder="2026-01-MAIA" />
                      <div className="col-span-2">
                        <TextField label="Curso" value={form.course} onChange={(v) => updateField("course", v)} placeholder="Computer Science" />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="profile" className="mt-4 space-y-4">
                    <NumberField label="Edad al matricularse" value={form.age_at_enrollment} onChange={(v) => updateField("age_at_enrollment", v)} min={16} max={70} />
                    <div className="flex flex-wrap gap-4">
                      <BoolField label="Masculino" value={form.gender} onChange={(v) => updateField("gender", v)} />
                      <BoolField label="Desplazado" value={form.displaced} onChange={(v) => updateField("displaced", v)} />
                      <BoolField label="Deudor" value={form.debtor} onChange={(v) => updateField("debtor", v)} />
                      <BoolField label="Matrícula al día" value={form.tuition_fees_up_to_date} onChange={(v) => updateField("tuition_fees_up_to_date", v)} />
                      <BoolField label="Becado" value={form.scholarship_holder} onChange={(v) => updateField("scholarship_holder", v)} />
                    </div>
                  </TabsContent>

                  <TabsContent value="performance" className="mt-4">
                    <div className="space-y-4">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">1er Semestre</h4>
                      <div className="grid grid-cols-3 gap-3">
                        <NumberField label="Inscritas" value={form.curricular_units_1st_sem_enrolled} onChange={(v) => updateField("curricular_units_1st_sem_enrolled", v)} min={0} max={30} />
                        <NumberField label="Aprobadas" value={form.curricular_units_1st_sem_approved} onChange={(v) => updateField("curricular_units_1st_sem_approved", v)} min={0} max={30} />
                        <NumberField label="Nota" value={form.curricular_units_1st_sem_grade} onChange={(v) => updateField("curricular_units_1st_sem_grade", v)} min={0} max={20} step={0.1} />
                      </div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">2do Semestre</h4>
                      <div className="grid grid-cols-3 gap-3">
                        <NumberField label="Inscritas" value={form.curricular_units_2nd_sem_enrolled} onChange={(v) => updateField("curricular_units_2nd_sem_enrolled", v)} min={0} max={30} />
                        <NumberField label="Aprobadas" value={form.curricular_units_2nd_sem_approved} onChange={(v) => updateField("curricular_units_2nd_sem_approved", v)} min={0} max={30} />
                        <NumberField label="Nota" value={form.curricular_units_2nd_sem_grade} onChange={(v) => updateField("curricular_units_2nd_sem_grade", v)} min={0} max={20} step={0.1} />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <Button className="w-full mt-4" disabled={isEvaluating} onClick={handleEvaluate}>
                  {isEvaluating ? (
                    <span className="flex items-center gap-2"><Zap className="w-4 h-4 animate-pulse" /> Evaluando…</span>
                  ) : (
                    <span className="flex items-center gap-2"><Zap className="w-4 h-4" /> Evaluar Estudiante</span>
                  )}
                </Button>
              </div>
            </div>

            <div>
              {result ? (
                <ResultPanel result={result} />
              ) : (
                <div className="stat-card flex flex-col items-center justify-center py-16 text-center">
                  <UserSearch className="w-12 h-12 text-muted-foreground/30 mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Completa el formulario y presiona "Evaluar" para obtener la predicción del modelo
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ─── Batch Tab ─── */}
        <TabsContent value="batch" className="mt-6 space-y-6">
          {/* Upload zone */}
          <div
            className="stat-card border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors cursor-pointer"
            onDrop={handleBatchDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => document.getElementById("batch-csv-input")?.click()}
          >
            <input id="batch-csv-input" type="file" accept=".csv" className="hidden"
              onChange={(e) => { if (e.target.files?.[0]) handleBatchLoad(e.target.files[0]); }} />
            <div className="flex flex-col items-center py-8 gap-3 text-center">
              {batchCsvFileName ? (
                <>
                  <FileText className="w-10 h-10 text-primary" />
                  <p className="text-sm font-medium text-foreground">{batchCsvFileName}</p>
                  <p className="text-xs text-muted-foreground">Arrastra otro archivo para reemplazar</p>
                </>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-muted-foreground/50" />
                  <p className="text-sm font-medium text-muted-foreground">Arrastra un CSV con múltiples estudiantes</p>
                  <p className="text-xs text-muted-foreground/70">
                    Se previsualizarán los datos antes de enviarlos al modelo
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Preview table + evaluate button */}
          {parsedRows.length > 0 && batchResults.length === 0 && (
            <>
              <CsvPreviewTable rows={parsedRows} fileName={batchCsvFileName!} />
              <Button className="w-full" size="lg" disabled={isBatchEvaluating} onClick={handleBatchEvaluate}>
                {isBatchEvaluating ? (
                  <span className="flex items-center gap-2"><Zap className="w-4 h-4 animate-pulse" /> Evaluando {parsedRows.length} estudiantes…</span>
                ) : (
                  <span className="flex items-center gap-2"><Zap className="w-4 h-4" /> Evaluar {parsedRows.length} Estudiantes</span>
                )}
              </Button>
            </>
          )}

          {/* Results */}
          {batchResults.length > 0 && (
            <>
              <BatchResultsTable results={batchResults} />
              <div className="stat-card border-l-4 border-l-accent flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-accent shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Evaluación completada — {batchResults.length} estudiantes evaluados y guardados
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Puedes ver todos los resultados detallados en la vista de cohorte
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate("/cohorte")} className="shrink-0">
                  Ir a Vista de Cohorte <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default EvaluatorPage;
