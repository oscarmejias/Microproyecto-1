import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  UserSearch,
  Users,
  Network,
  BarChart3,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { path: "/", label: "Panel General", icon: LayoutDashboard, soon: false },
  { path: "/evaluador", label: "Evaluación Individual", icon: UserSearch, soon: false },
  { path: "/cohorte", label: "Vista de Cohorte", icon: Users, soon: false },
  { path: "/clusters", label: "Análisis de Clusters", icon: Network, soon: true },
  { path: "/variables", label: "Importancia de Variables", icon: BarChart3, soon: true },
];

function DashboardLayout({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-56 bg-sidebar text-sidebar-foreground flex flex-col shrink-0 min-h-screen">
        <nav className="flex-1 p-3 pt-5 space-y-0.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-all ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/40 hover:text-sidebar-accent-foreground"
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="flex-1">{item.label}</span>
                {item.soon && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 leading-4">
                    Pronto
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 lg:p-8 max-w-[1440px]">{children}</div>
      </main>
    </div>
  );
}

export default DashboardLayout;
