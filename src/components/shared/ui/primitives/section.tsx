import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/core/utils/utils";

const sectionVariants = cva(
  "relative w-full",
  {
    variants: {
      spacing: {
        none: "py-0",
        sm: "py-8 md:py-12",
        md: "py-12 md:py-16",
        lg: "py-16 md:py-24",
      },
      background: {
        transparent: "bg-transparent",
        dark: "bg-black",
        zinc: "bg-[#0A0A0A]",
      }
    },
    defaultVariants: {
      spacing: "md",
      background: "transparent",
    },
  }
);

export interface SectionProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof sectionVariants> {}

export function Section({ className, spacing, background, ...props }: SectionProps) {
  return (
    <section className={cn(sectionVariants({ spacing, background }), className)} {...props} />
  );
}

