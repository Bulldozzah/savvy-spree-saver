import { Component } from "@/components/ui/fluid-dropdown";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const FluidDropdownDemo = () => {
  const navigate = useNavigate();

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-8 gap-8"
      style={{ background: 'linear-gradient(to bottom, #ede8ea, #dbe2f2)' }}
    >
      <h1 className="font-mono text-4xl md:text-5xl font-extrabold tracking-tighter text-foreground text-center">
        Fluid Dropdown
      </h1>
      <p className="text-muted-foreground text-lg text-center max-w-md">
        An animated dropdown with smooth transitions and hover effects
      </p>
      
      <div className="w-full max-w-md">
        <Component />
      </div>

      <Button 
        variant="outline" 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 mt-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Go Back
      </Button>
    </div>
  );
};

export default FluidDropdownDemo;
