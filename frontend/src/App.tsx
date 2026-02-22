import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import OverviewPage from "@/pages/OverviewPage";
import StudentsPage from "@/pages/StudentsPage";
import EvaluatorPage from "@/pages/EvaluatorPage";
import UnderConstructionPage from "@/pages/UnderConstructionPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <DashboardLayout>
          <Routes>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/evaluador" element={<EvaluatorPage />} />
            <Route path="/cohorte" element={<StudentsPage />} />
            <Route path="/clusters" element={<UnderConstructionPage sectionName="Análisis de Clusters" />} />
            <Route path="/variables" element={<UnderConstructionPage sectionName="Importancia de Variables" />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </DashboardLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
