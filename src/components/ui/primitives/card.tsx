import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Squircle } from "@/components/ui/Squircle";

const cardVariants = cva(
  "relative w-full transition-all duration-300",
  {
    variants: {
      variant: {
        default: "bg-[#1C1C1E]",
        hover: "group hover:bg-[#222224]",
        transparent: "bg-transparent",
        gradient: "bg-gradient-to-br from-[#1C1C1E] to-[#161618]",
      },
      padding: {
        none: "p-0",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
      },
      border: {
        default: "border-white/10",
        subtle: "border-white/5",
        none: "border-0",
      }
    },
    defaultVariants: {
      variant: "default",
      padding: "md",
      border: "default",
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  radius?: number;
  smoothing?: number;
  innerClassName?: string;
  as?: any;
}

export function Card({ 
  className, 
  variant, 
  padding, 
  border,
  radius = 20,
  smoothing = 1,
  innerClassName,
  children,
  as = "div",
  ...props 
}: CardProps) {
  return (
    <Squircle
      as={as}
      radius={radius}
      smoothing={smoothing}
      borderWidth={border === "none" ? 0 : 1}
      borderClassName={cn(
        border === "default" && "stroke-white/10",
        border === "subtle" && "stroke-white/5",
      )}
      className={className}
      innerClassName={cn(
        cardVariants({ variant, padding }),
        innerClassName
      )}
      {...props}
    >
      {children}
    </Squircle>
  );
}
