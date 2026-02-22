import { mockClusters } from "@/data/mockData";
import { RiskBadge } from "@/components/RiskBadge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Network, Users, Lightbulb } from "lucide-react";

function GroupsPage() {
  const chartData = mockClusters.map((c) => ({
    name: c.name.length > 20 ? c.name.slice(0, 20) + "…" : c.name,
    estudiantes: c.studentCount,
    probDesercion: Math.round(c.avgDropoutProbability * 100),
  }));

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Análisis de Grupos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Clusters de estudiantes con perfiles similares y recomendaciones de intervención
        </p>
      </div>

      {/* Chart */}
      <div className="stat-card">
        <h3 className="text-sm font-semibold text-foreground mb-4">Comparación de Clusters</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData} margin={{ bottom: 60 }}>
            <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" interval={0} />
            <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} unit="%" />
            <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "12px", border: "1px solid hsl(210,18%,89%)" }} />
            <Bar yAxisId="left" dataKey="estudiantes" fill="hsl(207, 65%, 17%)" radius={[4, 4, 0, 0]} name="Estudiantes" />
            <Bar yAxisId="right" dataKey="probDesercion" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} name="% Deserción" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Cluster Cards */}
      <div className="space-y-4">
        {mockClusters.map((cluster, idx) => (
          <div
            key={cluster.id}
            className={`stat-card border-l-4 ${
              cluster.riskLevel === "alto"
                ? "border-l-risk-high"
                : cluster.riskLevel === "medio"
                ? "border-l-risk-medium"
                : "border-l-risk-low"
            }`}
            style={{ animationDelay: `${idx * 80}ms` }}
          >
            <div className="flex flex-col lg:flex-row lg:items-start gap-4">
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Network className="w-4 h-4 text-accent shrink-0" />
                  <h3 className="text-sm font-semibold text-foreground truncate">{cluster.name}</h3>
                  <RiskBadge level={cluster.riskLevel} />
                </div>
                <p className="text-xs text-muted-foreground mb-3">{cluster.description}</p>

                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> {cluster.studentCount} estudiantes
                  </span>
                  <span className="font-mono">
                    Prob. deserción: {Math.round(cluster.avgDropoutProbability * 100)}%
                  </span>
                </div>

                {/* Characteristics */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {cluster.keyCharacteristics.map((c, i) => (
                    <span key={i} className="text-[11px] px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div className="lg:w-[320px] shrink-0 bg-muted/50 rounded-lg p-3">
                <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-2">
                  <Lightbulb className="w-3.5 h-3.5 text-accent" /> Intervenciones Recomendadas
                </h4>
                <ul className="space-y-1.5">
                  {cluster.recommendedActions.map((a, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-accent mt-1.5 shrink-0" />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default GroupsPage;
