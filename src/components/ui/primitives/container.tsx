import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const containerVariants = cva(
  "mx-auto w-full px-4 md:px-6",
  {
    variants: {
      size: {
        default: "max-w-[1400px]",
        sm: "max-w-[1000px]",
        md: "max-w-[1200px]",
        lg: "max-w-[1600px]",
        full: "max-w-full",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

export interface ContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerVariants> {}

export function Container({ className, size, ...props }: ContainerProps) {
  return (
    <div className={cn(containerVariants({ size }), className)} {...props} />
  );
}
