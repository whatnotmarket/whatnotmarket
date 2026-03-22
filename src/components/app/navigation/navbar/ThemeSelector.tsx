"use client";

import { cn } from "@/lib/core/utils/utils";
import { Monitor,Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useState,useSyncExternalStore } from "react";
import { NavPopup } from "./NavPopup";

const CustomMoon = ({ className }: { className?: string }) => (
    <svg 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={className} 
        xmlns="http://www.w3.org/2000/svg"
    >
        <path d="M4.38958 3.18942L3.90215 4.50136C3.78422 4.81878 3.53363 5.06938 3.21621 5.18731L1.90426 5.67474C1.6517 5.76908 1.6517 6.12679 1.90426 6.22015L3.21621 6.70759C3.53363 6.82551 3.78422 7.07611 3.90215 7.39353L4.38958 8.70547C4.48393 8.95803 4.84164 8.95803 4.935 8.70547L5.42243 7.39353C5.54036 7.07611 5.79095 6.82551 6.10838 6.70759L7.42032 6.22015C7.67288 6.12581 7.67288 5.7681 7.42032 5.67474L6.10936 5.18731C5.79194 5.06938 5.54134 4.81878 5.42341 4.50136L4.93598 3.18942C4.84164 2.93686 4.48393 2.93686 4.38958 3.18942ZM21.2866 12.8211C21.8792 12.827 22.3588 13.3282 22.2772 13.9149C22.0492 15.5482 21.3082 17.1255 20.0533 18.3893C16.9773 21.4554 12.0047 21.4554 8.9288 18.3893C5.86269 15.3133 5.86269 10.3407 8.9288 7.26479C10.1916 6.00985 11.7699 5.26789 13.4032 5.04088C13.9889 4.95833 14.4901 5.4379 14.496 6.03049C14.5127 7.765 15.1839 9.49067 16.5047 10.8124C17.8254 12.1332 19.5521 12.8044 21.2866 12.8211Z" fill="currentColor"></path>
    </svg>
);

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  if (!mounted) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-sm font-bold text-zinc-300 hover:text-white transition-all px-4 py-2 rounded-lg hover:bg-white/5 cursor-pointer"
      >
        {theme === 'dark' ? <CustomMoon className="h-4 w-4" /> : theme === 'light' ? <Sun className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
      </button>

      <NavPopup isOpen={isOpen} onClose={() => setIsOpen(false)} align="center" className="w-[380px]" title="Appearance">
        <div className="bg-[#222222] rounded-[16px] p-2">
            <div className="space-y-1">
                {[
                    { value: "light", label: "Light", icon: Sun },
                    { value: "dark", label: "Dark", icon: CustomMoon },
                    { value: "system", label: "System", icon: Monitor },
                ].map((item) => (
                    <button
                        key={item.value}
                        onClick={() => {
                            setTheme(item.value);
                            setIsOpen(false);
                        }}
                        className={cn(
                            "w-full flex items-center justify-between px-3 h-[50px] rounded-lg transition-all group hover:bg-white/5",
                            theme === item.value ? "text-white" : "text-zinc-300 hover:text-white"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <item.icon className="h-5 w-5" />
                            <span className="text-[15px] font-medium">{item.label}</span>
                        </div>
                        <div className={cn(
                            "h-5 w-5 rounded-full border flex items-center justify-center transition-all",
                            theme === item.value 
                                ? "bg-[#FF8A00] border-[#FF8A00]" 
                                : "bg-[#2A2A2A] border-zinc-700 group-hover:border-zinc-500"
                        )}>
                            {theme === item.value && <div className="h-2 w-2 bg-white rounded-full" />}
                        </div>
                    </button>
                ))}
            </div>
        </div>
      </NavPopup>
    </div>
  );
}

