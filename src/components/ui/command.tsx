"use client";

import * as React from "react";
import { type DialogProps } from "@radix-ui/react-dialog";
import { Command as CommandPrimitive } from "cmdk";
import { Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      "flex h-full w-full flex-col overflow-hidden rounded-3xl bg-[#0f1012] text-zinc-100",
      className
    )}
    {...props}
  />
));
Command.displayName = CommandPrimitive.displayName;

function CommandDialog({ children, ...props }: DialogProps) {
  return (
    <Dialog {...props}>
      <DialogContent className="overflow-hidden border-white/15 bg-[#0b0c0e]/95 p-0 shadow-2xl backdrop-blur-xl sm:max-w-[760px] [&>button]:hidden">
        <DialogTitle className="sr-only">Global search</DialogTitle>
        <DialogDescription className="sr-only">
          Search users, services, products, wallet addresses, requests, categories, and pages.
        </DialogDescription>
        <Command className="[&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.16em] [&_[cmdk-group-heading]]:text-zinc-500 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-1 [&_[cmdk-input]]:h-12 [&_[cmdk-input]]:w-full [&_[cmdk-input]]:bg-transparent [&_[cmdk-input]]:text-sm [&_[cmdk-input]]:outline-none [&_[cmdk-input]]:placeholder:text-zinc-500 [&_[cmdk-item]]:transition-colors [&_[cmdk-list]]:max-h-[68vh] [&_[cmdk-list]]:overflow-y-auto [&_[cmdk-list]]:overscroll-contain [&_[cmdk-item][data-disabled=true]]:pointer-events-none [&_[cmdk-item][data-selected=true]]:bg-white/10 [&_[cmdk-item][data-selected=true]]:text-white">
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
  <div className="flex items-center border-b border-white/10 px-4" cmdk-input-wrapper="">
    <Search className="mr-3 h-4 w-4 shrink-0 text-zinc-500" />
    <CommandPrimitive.Input ref={ref} className={cn(className)} {...props} />
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
>((props, ref) => <CommandPrimitive.Empty ref={ref} className="py-10 text-center text-sm text-zinc-500" {...props} />);

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
      "relative flex cursor-default items-center rounded-xl px-3 py-2 text-sm text-zinc-200 outline-none aria-disabled:pointer-events-none aria-disabled:opacity-50",
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
  <CommandPrimitive.Separator ref={ref} className={cn("-mx-1 h-px bg-white/10", className)} {...props} />
));
CommandSeparator.displayName = CommandPrimitive.Separator.displayName;

const CommandShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn("ml-auto text-xs tracking-wide text-zinc-500", className)} {...props} />
);
CommandShortcut.displayName = "CommandShortcut";

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
};
