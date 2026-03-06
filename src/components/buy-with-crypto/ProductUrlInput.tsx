"use client";

import { useState } from "react";
import { Squircle } from "@/components/ui/Squircle";
import { ArrowRight, Link as LinkIcon, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

import Image from "next/image";

interface ProductUrlInputProps {
  onUrlSubmit: (url: string, previewData?: any) => void;
  isLoading?: boolean;
}

export function ProductUrlInput({ onUrlSubmit, isLoading: externalLoading }: ProductUrlInputProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [isChecking, setIsChecking] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError("Please enter a product URL");
      return;
    }
    
    // Simple URL validation
    try {
      new URL(url);
      setError("");
      setIsChecking(true);
      
      try {
        const res = await fetch("/api/link-preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        
        const data = await res.json();
        onUrlSubmit(url, data);
      } catch (err) {
        console.error("Link preview failed", err);
        // Fallback: proceed without preview data
        onUrlSubmit(url);
      } finally {
        setIsChecking(false);
      }
    } catch {
      setError("Please enter a valid URL (e.g., https://example.com)");
    }
  };

  const isLoading = externalLoading || isChecking;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Image 
            src="/thinsmooth.svg" 
            alt="Smart Search" 
            width={24} 
            height={24} 
            className="w-6 h-6 brightness-0 invert" 
          />
          <span className="text-sm font-bold text-white uppercase tracking-wider">Buy Anywhere with Crypto</span>
        </div>
        
        <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
          Paste your link
        </h2>
        
        <p className="text-lg text-zinc-400 max-w-lg mx-auto leading-relaxed">
          Paste any product link (Amazon, Nike, E-commerce, etc...) and we'll purchase it for you using crypto — privately and securely.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="relative group max-w-xl mx-auto">
        <Squircle
          radius={24}
          smoothing={1}
          borderWidth={1}
          borderClassName={`transition-colors duration-300 ${
            error ? "stroke-red-500/50" : "stroke-white/10 group-focus-within:stroke-white/20"
          }`}
          innerClassName="bg-[#1C1C1E] p-2 flex items-center gap-3"
        >
          <div className="pl-4 text-zinc-500">
            <LinkIcon className="w-5 h-5" />
          </div>
          
          <input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (error) setError("");
            }}
            placeholder="Paste any product link..."
            className="flex-1 bg-transparent border-none text-white placeholder:text-zinc-600 focus:ring-0 focus:outline-none py-3 text-lg font-medium"
            autoFocus
          />

          <button
            type="submit"
            disabled={isLoading || !url}
            className="bg-white text-black font-bold px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap"
          >
            {isLoading ? (
              <span className="animate-pulse">Checking...</span>
            ) : (
              <>
                Start Proxy Order <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </Squircle>
        
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute -bottom-8 left-4 flex items-center gap-2 text-red-400 text-sm"
          >
            <AlertCircle className="w-4 h-4" />
            {error}
          </motion.div>
        )}
      </form>
    </div>
  );
}
