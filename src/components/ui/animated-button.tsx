import { cn } from "@/lib/utils";

interface AnimatedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  hoverClassName?: string;
}

export const AnimatedButton = ({ 
  children, 
  onClick, 
  className,
  hoverClassName = "bg-primary"
}: AnimatedButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative cursor-pointer p-2 px-6 border border-green-200 bg-green-50 rounded-full overflow-hidden text-black text-center font-semibold transition-all hover:border-green-300",
        className
      )}
    >
      <span className="translate-y-0 group-hover:-translate-y-12 group-hover:opacity-0 transition-all duration-300 inline-block">
        {children}
      </span>
      <div 
        className={cn(
          "flex gap-2 text-white z-10 items-center absolute left-0 top-0 h-full w-full justify-center translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 rounded-full group-hover:rounded-none",
          hoverClassName
        )}
      >
        <span>{children}</span>
      </div>
    </button>
  );
};
