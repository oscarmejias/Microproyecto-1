import { useQuery } from "@tanstack/react-query";
import { fetchPredictions, PredictionRecord } from "@/services/predictionService";
import { StatCard } from "@/components/StatCard";
import {
  Users,
  AlertTriangle,
  TrendingDown,
  ShieldCheck,
  TrendingUp,
  Loader2,
} from "lucide-react";
import {
  PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

function computeKPIs(predictions: PredictionRecord[]) {
  const total = predictions.length;
  if (total === 0) return null;

  let highRisk = 0, medRisk = 0, lowRisk = 0;
  let totalDropout = 0;

  predictions.forEach((p) => {
    const rl = (p.risk_level ?? "").toLowerCase();
    if (rl === "alto" || rl === "high") highRisk++;
    else if (rl === "medio" || rl === "medium") medRisk++;
    else lowRisk++;
    totalDropout += p.dropout_prob ?? p.risk_score ?? 0;
  });

  return {
    totalStudents: total,
    highRiskCount: highRisk,
    mediumRiskCount: medRisk,
    lowRiskCount: lowRisk,
    avgDropoutProbability: totalDropout / total,
    graduateCount: predictions.filter((p) => p.outcome === "Graduate").length,
    dropoutCount: predictions.filter((p) => p.outcome === "Dropout").length,
    enrolledCount: predictions.filter((p) => p.outcome === "Enrolled" || (!p.outcome)).length,
  };
}

function OverviewPage() {
  const { data: predictions = [], isLoading } = useQuery({
    queryKey: ["predictions"],
    queryFn: () => fetchPredictions(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const kpis = computeKPIs(predictions);

  if (!kpis) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Panel General</h1>
        <div className="stat-card flex flex-col items-center justify-center py-16 text-center">
          <Users className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="text-sm text-muted-foreground">
            No hay predicciones guardadas aún. Evalúa estudiantes desde el Evaluador para ver las estadísticas.
          </p>
        </div>
      </div>
    );
  }

  const highPct = Math.round((kpis.highRiskCount / kpis.totalStudents) * 100);
  const medPct = Math.round((kpis.mediumRiskCount / kpis.totalStudents) * 100);
  const lowPct = Math.round((kpis.lowRiskCount / kpis.totalStudents) * 100);
  const desProyectada = Math.round(kpis.avgDropoutProbability * 100);

  const predictionData = [
    { name: "Graduación", value: kpis.graduateCount, fill: "hsl(152, 60%, 45%)" },
    { name: "Deserción", value: kpis.dropoutCount, fill: "hsl(0, 72%, 56%)" },
    { name: "Matrícula", value: kpis.enrolledCount, fill: "hsl(42, 85%, 55%)" },
  ];

  const trendData = [
    { semester: "2024-1", desercion: 18 },
    { semester: "2024-2", desercion: 16 },
    { semester: "2025-1", desercion: 15 },
    { semester: "2025-2", desercion: 12 },
    { semester: "2026-1", desercion: desProyectada },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground">Panel General</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Total Estudiantes" value={kpis.totalStudents} icon={<Users className="w-5 h-5" />} />
        <StatCard title="Alto Riesgo" value={`${highPct}%`} icon={<AlertTriangle className="w-5 h-5 text-risk-high" />} />
        <StatCard title="Riesgo Medio" value={`${medPct}%`} icon={<TrendingDown className="w-5 h-5 text-risk-medium" />} />
        <StatCard title="Bajo Riesgo" value={`${lowPct}%`} icon={<ShieldCheck className="w-5 h-5 text-risk-low" />} />
        <StatCard title="Deserción Proyectada" value={`${desProyectada}%`} icon={<TrendingUp className="w-5 h-5 text-risk-high" />} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="stat-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Distribución de Predicciones</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={predictionData} cx="50%" cy="50%" innerRadius={65} outerRadius={100} paddingAngle={2} dataKey="value" stroke="none"
                label={({ name, value }) => `${name}: ${value}`} labelLine={true}>
                {predictionData.map((entry, idx) => (<Cell key={idx} fill={entry.fill} />))}
              </Pie>
              <Legend verticalAlign="bottom" iconType="square" iconSize={10} wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="stat-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Tendencia de Deserción por Semestre</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trendData}>
              <XAxis dataKey="semester" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} unit="%" domain={[0, 60]} />
              <Tooltip formatter={(value: number) => [`${value}%`, "Deserción"]}
                contentStyle={{ borderRadius: "8px", fontSize: "12px", border: "1px solid hsl(220,13%,91%)" }} />
              <Line type="monotone" dataKey="desercion" stroke="hsl(252, 56%, 57%)" strokeWidth={2}
                dot={{ r: 4, fill: "hsl(252, 56%, 57%)", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default OverviewPage;
