"use client";

import { useState } from "react";
import { Squircle } from "@/components/shared/ui/Squircle";
import { ArrowRight, Link as LinkIcon, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

type ProductPreviewData = {
  title?: string;
  image?: string;
  price?: number;
  currency?: string;
  error?: string;
};

interface ProductUrlInputProps {
  onUrlSubmit: (url: string, previewData?: ProductPreviewData) => void;
  isLoading?: boolean;
  placeholderText?: string;
  buttonText?: string;
}

export function ProductUrlInput({
  onUrlSubmit,
  isLoading: externalLoading,
  placeholderText,
  buttonText,
}: ProductUrlInputProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [isChecking, setIsChecking] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!url.trim()) {
      setError("Please enter a product URL");
      return;
    }

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

        const data = (await res.json()) as ProductPreviewData;
        onUrlSubmit(url, data);
      } catch (err) {
        console.error("Link preview failed", err);
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
    <div className="mx-auto w-full max-w-2xl space-y-8">
      <div className="space-y-4 text-center">
        <div className="mb-2 flex items-center justify-center gap-2">
          <Image
            src="/images/svg/openly-thinsmooth.svg"
            alt="Smart Search"
            width={24}
            height={24}
            className="h-6 w-6 brightness-0 invert"
          />
          <span className="text-sm font-bold uppercase tracking-wider text-white">
            Buy Anywhere with Crypto
          </span>
        </div>

        <h2 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
          Paste your link
        </h2>

        <p className="mx-auto max-w-lg text-lg leading-relaxed text-zinc-400">
          Paste any product link (Amazon, Nike, E-commerce, etc...) and we&apos;ll purchase
          it for you using crypto, privately and securely.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="group relative mx-auto max-w-xl">
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
            <LinkIcon className="h-5 w-5" />
          </div>

          <input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (error) setError("");
            }}
            placeholder={placeholderText || "Paste any product link..."}
            className="flex-1 border-none bg-transparent py-3 text-lg font-medium text-white placeholder:text-zinc-600 focus:outline-none focus:ring-0"
            autoFocus
          />

          <button
            type="submit"
            disabled={isLoading || !url}
            className="flex items-center gap-2 whitespace-nowrap rounded-xl bg-white px-6 py-3 font-bold text-black transition-all hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <span className="animate-pulse">Checking...</span>
            ) : (
              <>
                {buttonText || "Start Proxy Order"} <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </Squircle>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute -bottom-8 left-4 flex items-center gap-2 text-sm text-red-400"
          >
            <AlertCircle className="h-4 w-4" />
            {error}
          </motion.div>
        )}
      </form>
    </div>
  );
}

