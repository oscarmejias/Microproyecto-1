import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const variableImportance = [
  { variable: "Curricular units 2nd sem (approved)", importance: 0.18 },
  { variable: "Curricular units 2nd sem (grade)", importance: 0.15 },
  { variable: "Curricular units 1st sem (approved)", importance: 0.14 },
  { variable: "Curricular units 1st sem (grade)", importance: 0.12 },
  { variable: "Tuition fees up to date", importance: 0.09 },
  { variable: "Scholarship holder", importance: 0.07 },
  { variable: "Debtor", importance: 0.06 },
  { variable: "Age at enrollment", importance: 0.05 },
  { variable: "Admission grade", importance: 0.04 },
  { variable: "Curricular units 1st sem (enrolled)", importance: 0.03 },
  { variable: "Previous qualification (grade)", importance: 0.025 },
  { variable: "Gender", importance: 0.02 },
  { variable: "Displaced", importance: 0.015 },
  { variable: "Unemployment rate", importance: 0.01 },
];

function VariablesPage() {
  const chartData = variableImportance.map((v) => ({
    name: v.variable.length > 30 ? v.variable.slice(0, 30) + "…" : v.variable,
    fullName: v.variable,
    importance: Math.round(v.importance * 100),
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Importancia de Variables</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Contribución relativa de cada variable en la predicción del modelo (Feature Importance)
        </p>
      </div>

      <div className="stat-card">
        <h3 className="text-sm font-semibold text-foreground mb-4">Feature Importance — Top 14 Variables</h3>
        <ResponsiveContainer width="100%" height={480}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
            <XAxis type="number" tick={{ fontSize: 11 }} unit="%" />
            <YAxis type="category" dataKey="name" width={230} tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(value: number) => [`${value}%`, "Importancia"]}
              contentStyle={{ borderRadius: "8px", fontSize: "12px", border: "1px solid hsl(220,13%,91%)" }}
            />
            <Bar dataKey="importance" fill="hsl(252, 56%, 57%)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="stat-card">
        <h3 className="text-sm font-semibold text-foreground mb-3">Interpretación</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Las variables de <strong>rendimiento académico</strong> (materias aprobadas y calificaciones en ambos semestres) dominan la predicción, representando más del 50% de la importancia total del modelo.</p>
          <p>Los factores <strong>financieros</strong> (matrícula al día, becas, deuda) son el segundo grupo más influyente, lo que sugiere que las intervenciones económicas pueden tener alto impacto en la retención.</p>
          <p>Variables <strong>demográficas</strong> como edad y género tienen menor peso individual pero contribuyen al perfil de riesgo compuesto en los análisis de clusters.</p>
        </div>
      </div>
    </div>
  );
}

export default VariablesPage;
