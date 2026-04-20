import { FallingPattern } from "@/components/ui/falling-pattern";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const FallingPatternDemo = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full relative min-h-screen">
      <FallingPattern className="absolute inset-0 h-full [mask-image:radial-gradient(ellipse_at_center,transparent_20%,hsl(var(--background)))]" />
      
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-8 p-4">
        <h1 className="font-mono text-4xl md:text-7xl font-extrabold tracking-tighter text-foreground text-center">
          Falling Pattern
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl text-center max-w-md">
          A mesmerizing animated background effect with customizable colors and density
        </p>
        <Button 
          variant="outline" 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </Button>
      </div>
    </div>
  );
};

export default FallingPatternDemo;
