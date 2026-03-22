"use client";

import { type DialogProps } from "@radix-ui/react-dialog";
import { Command as CommandPrimitive } from "cmdk";
import { Search } from "lucide-react";
import * as React from "react";

import { Dialog,DialogContent,DialogDescription,DialogTitle } from "@/components/shared/ui/dialog";
import { cn } from "@/lib/core/utils/utils";

const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, style, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      "flex h-full w-full flex-col overflow-hidden",
      className
    )}
    style={{
      backgroundColor: "var(--cmdk-popup-bg, var(--gc-surface))",
      color: "var(--cmdk-item-selected-text-color, var(--gc-text-primary))",
      borderRadius: "var(--cmdk-popup-radius, 24px)",
      ...style,
    }}
    {...props}
  />
));
Command.displayName = CommandPrimitive.displayName;

function CommandDialog({ children, ...props }: DialogProps) {
  return (
    <Dialog {...props}>
      <DialogContent
        className="overflow-hidden p-0 backdrop-blur-xl sm:max-w-[760px] [&>button]:hidden"
        style={{
          backgroundColor: "var(--cmdk-popup-bg, var(--gc-surface))",
          borderColor: "var(--cmdk-popup-border-color, var(--gc-border))",
          borderWidth: "var(--cmdk-popup-border-width, 2px)",
          borderStyle: "solid",
          borderRadius: "var(--cmdk-popup-radius, 24px)",
          boxShadow: "var(--cmdk-popup-shadow, none)",
          opacity: 1,
        }}
      >
        <DialogTitle className="sr-only">Global search</DialogTitle>
        <DialogDescription className="sr-only">
          Search users, services, products, wallet addresses, requests, categories, and pages.
        </DialogDescription>
        <Command className="[&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.16em] [&_[cmdk-group-heading]]:text-[var(--cmdk-group-heading-color,var(--gc-text-secondary))] [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-1 [&_[cmdk-item]]:transition-colors [&_[cmdk-list]]:max-h-[68vh] [&_[cmdk-list]]:overflow-y-auto [&_[cmdk-list]]:overscroll-contain [&_[cmdk-item][data-disabled=true]]:pointer-events-none [&_[cmdk-item][data-selected=true]]:bg-[var(--cmdk-item-selected-bg,var(--gc-surface))] [&_[cmdk-item][data-selected=true]]:text-[var(--cmdk-item-selected-text-color,var(--gc-text-primary))]">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  );
}

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div
    className="flex items-center px-4"
    cmdk-input-wrapper=""
    style={{
      backgroundColor: "var(--cmdk-input-bg, var(--gc-surface))",
      borderBottomColor: "var(--cmdk-input-border-color, var(--gc-border))",
      borderBottomWidth: "var(--cmdk-input-border-width, 2px)",
      borderBottomStyle: "solid",
      opacity: 1,
    }}
  >
    <Search className="mr-3 h-4 w-4 shrink-0" style={{ color: "var(--cmdk-input-icon-color, var(--gc-text-secondary))" }} />
    <CommandPrimitive.Input
      ref={ref}
      className={cn("h-12 w-full bg-transparent text-sm outline-none placeholder:text-[var(--cmdk-input-placeholder-color,var(--gc-text-tertiary))]", className)}
      style={{ color: "var(--cmdk-input-text-color, var(--gc-text-primary))" }}
      {...props}
    />
  </div>
));

CommandInput.displayName = CommandPrimitive.Input.displayName;

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List ref={ref} className={cn(className)} {...props} />
));

CommandList.displayName = CommandPrimitive.List.displayName;

const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
  <CommandPrimitive.Empty ref={ref} className="py-10 text-center text-sm text-[var(--cmdk-item-action-color,var(--gc-text-secondary))]" {...props} />
));

CommandEmpty.displayName = CommandPrimitive.Empty.displayName;

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group ref={ref} className={cn("overflow-hidden p-1", className)} {...props} />
));

CommandGroup.displayName = CommandPrimitive.Group.displayName;

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default items-center rounded-xl px-3 py-2 text-sm text-[var(--cmdk-item-action-color,var(--gc-text-secondary))] outline-none aria-disabled:pointer-events-none aria-disabled:opacity-50",
      className
    )}
    {...props}
  />
));

CommandItem.displayName = CommandPrimitive.Item.displayName;

const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator ref={ref} className={cn("-mx-1 h-px bg-[var(--cmdk-footer-border-color,var(--gc-border))]", className)} {...props} />
));
CommandSeparator.displayName = CommandPrimitive.Separator.displayName;

const CommandShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn("ml-auto text-xs tracking-wide text-[var(--cmdk-item-action-color,var(--gc-text-secondary))]", className)} {...props} />
);
CommandShortcut.displayName = "CommandShortcut";

export {
Command,
CommandDialog,CommandEmpty,
CommandGroup,CommandInput,CommandItem,CommandList,CommandSeparator,
CommandShortcut
};






