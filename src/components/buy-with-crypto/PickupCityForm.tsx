"use client";

import { MapPin, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";

// Expanded list of major world cities for autocomplete
const CITIES = [
  // Europe
  "London, UK", "Paris, France", "Berlin, Germany", "Madrid, Spain", "Rome, Italy", 
  "Amsterdam, Netherlands", "Vienna, Austria", "Prague, Czech Republic", "Lisbon, Portugal", 
  "Dublin, Ireland", "Brussels, Belgium", "Stockholm, Sweden", "Oslo, Norway", 
  "Copenhagen, Denmark", "Zurich, Switzerland", "Geneva, Switzerland", "Athens, Greece", 
  "Warsaw, Poland", "Budapest, Hungary", "Istanbul, Turkey", "Milan, Italy", "Barcelona, Spain",
  "Munich, Germany", "Frankfurt, Germany", "Lyon, France", "Manchester, UK",
  
  // North America
  "New York, USA", "Los Angeles, USA", "Chicago, USA", "Houston, USA", "Miami, USA", 
  "San Francisco, USA", "Seattle, USA", "Toronto, Canada", "Vancouver, Canada", 
  "Montreal, Canada", "Mexico City, Mexico", "Boston, USA", "Las Vegas, USA",
  
  // South America
  "Sao Paulo, Brazil", "Buenos Aires, Argentina", "Rio de Janeiro, Brazil", 
  "Bogota, Colombia", "Lima, Peru", "Santiago, Chile", "Caracas, Venezuela",
  
  // Asia
  "Tokyo, Japan", "Seoul, South Korea", "Beijing, China", "Shanghai, China", 
  "Hong Kong", "Singapore", "Bangkok, Thailand", "Mumbai, India", "New Delhi, India", 
  "Jakarta, Indonesia", "Manila, Philippines", "Kuala Lumpur, Malaysia", "Ho Chi Minh City, Vietnam",
  "Dubai, UAE", "Abu Dhabi, UAE", "Riyadh, Saudi Arabia", "Tel Aviv, Israel", "Doha, Qatar",
  
  // Oceania
  "Sydney, Australia", "Melbourne, Australia", "Brisbane, Australia", "Auckland, New Zealand",
  
  // Africa
  "Cairo, Egypt", "Johannesburg, South Africa", "Cape Town, South Africa", 
  "Lagos, Nigeria", "Nairobi, Kenya", "Casablanca, Morocco"
].sort();

interface PickupCityFormProps {
  city: string;
  setCity: (value: string) => void;
  country: string;
  setCountry: (value: string) => void;
  region: string;
  setRegion: (value: string) => void;
}

export function PickupCityForm({
  city,
  setCity,
  country,
  setCountry,
  region,
  setRegion,
}: PickupCityFormProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCity(value);
    
    if (value.length > 1) {
      const filtered = CITIES.filter(c => 
        c.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectCity = (selected: string) => {
    const [cityName, countryName] = selected.split(", ");
    setCity(cityName);
    if (countryName) setCountry(countryName);
    setShowSuggestions(false);
  };

  return (
    <div className="space-y-4 bg-zinc-900/50 p-5 rounded-xl border border-white/5">
      <div className="flex items-start gap-3 mb-2">
        <div className="shrink-0 mt-0.5">
          <svg fill="#FFFFFF" height="24px" width="24px" version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" enableBackground="new 0 0 512 512">
            <path d="M434.068,46.758L314.607,9.034C295.648,3.047,275.883,0,256,0s-39.648,3.047-58.607,9.034L77.932,46.758 C52.97,54.641,36,77.796,36,103.973v207.39c0,38.129,18.12,73.989,48.816,96.607l117.032,86.234 C217.537,505.764,236.513,512,256,512s38.463-6.236,54.152-17.796l117.032-86.234C457.88,385.352,476,349.492,476,311.363v-207.39 C476,77.796,459.03,54.641,434.068,46.758z M347.924,227.716l-98.995,98.995c-11.716,11.716-30.711,11.716-42.426,0l-42.427-42.426 c-11.716-11.716-11.716-30.711,0-42.426l0,0c11.716-11.716,30.711-11.716,42.426,0l21.213,21.213l77.782-77.782 c11.716-11.716,30.711-11.716,42.426,0h0C359.64,197.005,359.64,216,347.924,227.716z"></path>
          </svg>
        </div>
        <div>
          <h4 className="text-white font-medium">Privacy-First Delivery</h4>
          <p className="text-sm text-zinc-400 mt-1">
            For your privacy, we don't ask for a home address. We will assign a secure pickup locker in your city.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2" ref={wrapperRef}>
          <label className="text-sm font-medium text-zinc-300">
            City <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={city}
              onChange={handleCityChange}
              onFocus={() => city.length > 1 && setShowSuggestions(true)}
              placeholder="e.g. New York"
              className="w-full bg-black border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/50 transition-all font-bold"
              required
              autoFocus
              autoComplete="off"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-white/10 rounded-xl overflow-hidden z-50 shadow-xl max-h-60 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => selectCity(suggestion)}
                    className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors flex items-center justify-between group"
                  >
                    <span>{suggestion}</span>
                    <Check className="w-4 h-4 opacity-0 group-hover:opacity-100 text-emerald-400 transition-opacity" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">
            Country <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="e.g. USA"
            className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/50 transition-all font-bold"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">
          Preferred Region / Area <span className="text-zinc-500">(Optional)</span>
        </label>
        <input
          type="text"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          placeholder="e.g. Downtown or near Central Station"
          className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/50 transition-all font-bold"
        />
      </div>
    </div>
  );
}
