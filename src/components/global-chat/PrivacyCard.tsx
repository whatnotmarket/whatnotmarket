"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, X } from "lucide-react";

type CookiePreferences = {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
};

const DEFAULT_PREFERENCES: CookiePreferences = {
  essential: true, // Always required
  analytics: false,
  marketing: false,
  personalization: false,
};

const PrivacyIcon = ({ className }: { className?: string }) => (
  <svg 
    width="24px" 
    height="24px" 
    viewBox="0 0 24.00 24.00" 
    version="1.1" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
  >
    <g strokeWidth="0"></g>
    <g strokeLinecap="round" strokeLinejoin="round" stroke="#CCCCCC" strokeWidth="0.528"></g>
    <g> 
      <g strokeWidth="0.00024" fill="none" fillRule="evenodd"> 
        <g transform="translate(-432.000000, -336.000000)"> 
          <g transform="translate(432.000000, 336.000000)"> 
            <path d="M24,0 L24,24 L0,24 L0,0 L24,0 Z M12.5934901,23.257841 L12.5819402,23.2595131 L12.5108777,23.2950439 L12.4918791,23.2987469 L12.4918791,23.2987469 L12.4767152,23.2950439 L12.4056548,23.2595131 C12.3958229,23.2563662 12.3870493,23.2590235 12.3821421,23.2649074 L12.3780323,23.275831 L12.360941,23.7031097 L12.3658947,23.7234994 L12.3769048,23.7357139 L12.4804777,23.8096931 L12.4953491,23.8136134 L12.4953491,23.8136134 L12.5071152,23.8096931 L12.6106902,23.7357139 L12.6232938,23.7196733 L12.6232938,23.7196733 L12.6266527,23.7031097 L12.609561,23.275831 C12.6075724,23.2657013 12.6010112,23.2592993 12.5934901,23.257841 L12.5934901,23.257841 Z M12.8583906,23.1452862 L12.8445485,23.1473072 L12.6598443,23.2396597 L12.6498822,23.2499052 L12.6498822,23.2499052 L12.6471943,23.2611114 L12.6650943,23.6906389 L12.6699349,23.7034178 L12.6699349,23.7034178 L12.678386,23.7104931 L12.8793402,23.8032389 C12.8914285,23.8068999 12.9022333,23.8029875 12.9078286,23.7952264 L12.9118235,23.7811639 L12.8776777,23.1665331 C12.8752882,23.1545897 12.8674102,23.1470016 12.8583906,23.1452862 L12.8583906,23.1452862 Z M12.1430473,23.1473072 C12.1332178,23.1423925 12.1221763,23.1452606 12.1156365,23.1525954 L12.1099173,23.1665331 L12.0757714,23.7811639 C12.0751323,23.7926639 12.0828099,23.8018602 12.0926481,23.8045676 L12.108256,23.8032389 L12.3092106,23.7104931 L12.3186497,23.7024347 L12.3186497,23.7024347 L12.3225043,23.6906389 L12.340401,23.2611114 L12.337245,23.2485176 L12.337245,23.2485176 L12.3277531,23.2396597 L12.1430473,23.1473072 Z" fillRule="nonzero"> </path> 
            <path d="M11.2978,2.19546 C11.7505,2.02567 12.2495,2.02567 12.7022,2.19546 L19.7022,4.82046 C20.4829,5.11318 21,5.85943 21,6.69312 L21,12.0558 C21,15.4648 19.074,18.5812 16.0249,20.1057 L12.6708,21.7827 C12.2485,21.9939 11.7515,21.9939 11.3292,21.7827 L7.97508,20.1057 C4.92602,18.5812 3,15.4648 3,12.0558 L3,6.69312 C3,5.85943 3.51715,5.11318 4.29775,4.82046 L11.2978,2.19546 Z M12,4.06812 L5,6.69312 L5,12.0558 C5,14.7072 6.49802,17.1311 8.8695,18.3168 L12,19.8821 L12,4.06812 Z" fill="#ffffff"> </path> 
          </g> 
        </g> 
      </g> 
    </g>
  </svg>
);

export function PrivacyCard() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return !localStorage.getItem("cookie-consent");
    } catch {
      return false;
    }
  });
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES);

  const [expandedCategory, setExpandedCategory] = useState<keyof CookiePreferences | null>("essential");

  const categories = [
    {
      id: "essential" as const,
      title: "Strictly Necessary",
      subtitle: "Required for authentication & security",
      description: "These cookies are essential for the website to function properly. They enable basic functions like page navigation, secure areas access, and authentication. The website cannot function properly without these cookies.",
      disabled: true,
      forcedValue: true
    },
    {
      id: "analytics" as const,
      title: "Performance & Analytics",
      subtitle: "Anonymous usage data",
      description: "These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us to know which pages are the most and least popular and see how visitors move around the site. All information these cookies collect is aggregated and therefore anonymous.",
      disabled: false
    },
    {
      id: "marketing" as const,
      title: "Marketing & Targeting",
      subtitle: "No ad trackers used",
      description: "We currently do not use marketing or targeting cookies. These would normally be used to build a profile of your interests and show you relevant adverts on other sites.",
      disabled: true,
      forcedValue: false
    }
  ];

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      essential: true,
      analytics: true,
      marketing: true,
      personalization: true,
    };
    savePreferences(allAccepted);
  };

  const handleRejectAll = () => {
    const allRejected: CookiePreferences = {
      essential: true,
      analytics: false,
      marketing: false,
      personalization: false,
    };
    savePreferences(allRejected);
  };

  const handleSavePreferences = () => {
    savePreferences(preferences);
  };

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem("cookie-consent", JSON.stringify(prefs));
    setPreferences(prefs);
    setIsVisible(false);
    window.dispatchEvent(new Event("cookie-consent-updated"));
  };

  const togglePreference = (key: keyof CookiePreferences) => {
    if (key === "essential") return; // Cannot toggle essential
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (pathname === "/install" || pathname.startsWith("/install/")) {
    return null;
  }

  if (!isVisible) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-md" />
      <div className="fixed bottom-4 right-4 z-50 w-[400px] overflow-hidden rounded-3xl border border-white/10 bg-[#000000]/95 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-4 duration-500">
        <div className="p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <PrivacyIcon className="w-6 h-6" />
                  We value your privacy
                </h3>
                {isCustomizing && (
                  <button 
                    onClick={() => setIsCustomizing(false)}
                    className="text-zinc-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              <p className="text-[15px] leading-relaxed text-zinc-400">
                We use essential cookies for authentication and anonymous analytics to improve the platform. No personal data is sold to third parties.
              </p>
            </div>

            {isCustomizing && (
              <div className="space-y-3 py-2 animate-in fade-in zoom-in-95 duration-300">
                {categories.map((category) => {
                  const isExpanded = expandedCategory === category.id;
                  const isChecked = category.forcedValue !== undefined ? category.forcedValue : preferences[category.id as keyof CookiePreferences];

                  return (
                    <div 
                      key={category.id}
                      className={cn(
                        "rounded-xl bg-[#101010] border border-white/5 overflow-hidden transition-all duration-300",
                        isExpanded ? "bg-[#151515] border-white/10" : "hover:bg-[#151515]"
                      )}
                    >
                      <div className="flex items-center justify-between p-3">
                        <button 
                          onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                          className="flex items-center gap-3 flex-1 text-left"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-zinc-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-zinc-400" />
                          )}
                          <div className="space-y-0.5">
                            <div className="text-sm font-medium text-white">{category.title}</div>
                            {!isExpanded && (
                              <div className="text-xs text-zinc-500 animate-in fade-in">{category.subtitle}</div>
                            )}
                          </div>
                        </button>
                        <Switch 
                          checked={isChecked} 
                          disabled={category.disabled}
                          onCheckedChange={() => !category.disabled && togglePreference(category.id)} 
                        />
                      </div>
                      
                      {isExpanded && (
                        <div className="px-3 pb-3 pt-0 animate-in slide-in-from-top-2">
                          <div className="h-px w-full bg-white/5 mb-3" />
                          <p className="text-xs leading-relaxed text-zinc-400">
                            {category.description}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              {!isCustomizing ? (
                <>
                  <Button
                    variant="outline"
                    onClick={handleRejectAll}
                    className="flex-1 border-white/5 bg-[#101010] text-zinc-400 hover:bg-[#101010] hover:text-red-500 hover:border-red-500/50 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all duration-300"
                  >
                    Reject all
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsCustomizing(true)}
                    className="flex-1 border-white/10 bg-[#101010] text-zinc-300 hover:bg-[#151515] hover:text-white hover:border-white/20"
                  >
                    Customize
                  </Button>
                  <Button 
                    onClick={handleAcceptAll}
                    className="flex-1 bg-white text-black hover:bg-zinc-200 font-bold shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                  >
                    Accept all
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={handleSavePreferences}
                  className="w-full bg-white text-black hover:bg-zinc-200 font-bold"
                >
                  Save Preferences
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
