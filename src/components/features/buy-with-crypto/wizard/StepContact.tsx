"use client";

import { Squircle } from "@/components/shared/ui/Squircle";
import { Button } from "@/components/shared/ui/button";
import { useEffect,useState } from "react";
import { TelegramProfilePreview } from "./TelegramProfilePreview";
import { StepProps } from "./types";

export function StepContact({ data, updateData, onNext, onBack }: StepProps) {
  const [telegramUsername, setTelegramUsername] = useState(data.telegramUsername || "");
  const [profileData, setProfileData] = useState<{ photoUrl?: string } | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!telegramUsername || telegramUsername.length < 2) {
        setProfileData(null);
        setProfileError(null);
        return;
      }

      setIsLoadingProfile(true);
      setProfileError(null);

      try {
        const res = await fetch("/api/telegram-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: telegramUsername }),
        });

        if (!res.ok) {
          throw new Error("Profile not found");
        }

        const data = await res.json();
        setProfileData({ photoUrl: data.photoUrl });
      } catch {
        setProfileData(null);
        setProfileError("Profile not found");
      } finally {
        setIsLoadingProfile(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [telegramUsername]);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    // Remove all existing @ signs
    value = value.replace(/@/g, "");
    
    // Add @ at the start if there's any text
    if (value.length > 0) {
      setTelegramUsername("@" + value);
    } else {
      setTelegramUsername("");
    }
  };

  const handleContinue = () => {
    updateData({ telegramUsername });
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white">Contact Info</h3>
        <p className="text-sm text-zinc-400">
          Enter your Telegram username for real-time updates and communication.
        </p>
      </div>

      <div className="space-y-4">
        <Squircle
          radius={20}
          smoothing={1}
          innerClassName="bg-[#1C1C1E] p-6"
        >
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#229ED9]">
              Telegram Username
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 z-10">
                <svg viewBox="0 0 100 100" version="1.1" xmlSpace="preserve" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" fill="#ffffff" stroke="#ffffff">
                  <g>
                    <path fill="#ffffff" d="M88.723,12.142C76.419,17.238,23.661,39.091,9.084,45.047c-9.776,3.815-4.053,7.392-4.053,7.392 s8.345,2.861,15.499,5.007c7.153,2.146,10.968-0.238,10.968-0.238l33.62-22.652c11.922-8.107,9.061-1.431,6.199,1.431 c-6.199,6.2-16.452,15.975-25.036,23.844c-3.815,3.338-1.908,6.199-0.238,7.63c6.199,5.246,23.129,15.976,24.082,16.691 c5.037,3.566,14.945,8.699,16.452-2.146c0,0,5.961-37.435,5.961-37.435c1.908-12.637,3.815-24.321,4.053-27.659 C97.307,8.804,88.723,12.142,88.723,12.142z"></path>
                  </g>
                </svg>
              </div>
              <input
                type="text"
                value={telegramUsername}
                onChange={handleUsernameChange}
                placeholder="@username"
                className="w-full bg-[#229ED9] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-white/70 focus:outline-none focus:ring-1 focus:ring-white/50 transition-all font-bold"
                autoFocus
              />
            </div>
          </div>
        </Squircle>

        {(telegramUsername.length > 1 || isLoadingProfile) && (
          <TelegramProfilePreview
            username={telegramUsername}
            photoUrl={profileData?.photoUrl}
            isLoading={isLoadingProfile}
            error={profileError}
          />
        )}
      </div>

      <div className="flex gap-3 pt-4">
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="text-zinc-400 hover:text-white bg-transparent hover:bg-zinc-800 transition-colors"
        >
          Back
        </Button>
        <Button 
          onClick={handleContinue} 
          disabled={!telegramUsername.trim()}
          className="flex-1 py-4 text-lg font-bold bg-white text-black hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Review Order
        </Button>
      </div>
    </div>
  );
}

