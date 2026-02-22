import { Construction } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface UnderConstructionPageProps {
  sectionName: string;
}

function UnderConstructionPage({ sectionName }: UnderConstructionPageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in text-center">
      <div className="rounded-full bg-muted p-5 mb-6">
        <Construction className="w-10 h-10 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Sección en Desarrollo</h1>
      <p className="text-sm text-muted-foreground max-w-md mb-1">
        <strong>"{sectionName}"</strong> estará disponible próximamente.
      </p>
      <p className="text-sm text-muted-foreground mb-8">
        Estamos trabajando para ti.
      </p>
      <Button asChild>
        <Link to="/">Volver al Panel General</Link>
      </Button>
    </div>
  );
}

export default UnderConstructionPage;
