"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { Squircle } from "@/components/ui/Squircle";
import { useUser } from "@/contexts/UserContext";
import { 
  ShieldCheck, 
  MapPin, 
  Calendar, 
  TrendingUp,
  Clock,
  Package,
  Edit2,
  Camera,
  X,
  Save,
  Move
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase";

// Mock Data
const MOCK_PROFILE = {
  name: "CryptoKing_99",
  handle: "@cryptoking",
  avatar: "https://ui-avatars.com/api/?name=Crypto+King&background=10b981&color=fff",
  banner: "/framehero.svg", 
  level: 42,
  memberSince: "Nov 2023",
  followers: 1240,
  following: 85,
  description: "Professional seller of premium accounts and development services. Fast delivery, 24/7 support, and 100% warranty on all products. DM for custom orders.",
  location: "Online",
  languages: ["English", "Spanish"],
  isOnline: true,
  // Seller Stats
  successfulDeliveries: 4582,
  sellerRanking: "Top Rated Seller",
  sellerProtection: "100% Covered",
  avgResponseTime: "5 mins",
  // Buyer Stats
  buyerRanking: "Diamond Buyer",
  buyerProtection: "Escrow Protected",
  totalPurchases: 156
};

// Mock Listings
const MOCK_LISTINGS = [
  { id: 1, title: "Netflix 4K UHD Lifetime", price: 15.00, image: "🍿", sold: 120 },
  { id: 2, title: "Spotify Premium Upgrade", price: 8.50, image: "🎵", sold: 450 },
  { id: 3, title: "NordVPN 2 Year Account", price: 12.00, image: "🔒", sold: 85 },
];

const MOCK_REQUESTS = [
  { id: 1, title: "Looking for aged Twitter accounts", budget: "$50-100", image: "🐦" },
  { id: 2, title: "Need custom Telegram bot dev", budget: "$200-500", image: "🤖" },
];

type EditableImageType = "avatar" | "banner";

type StoredProfile = {
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  banner_url: string | null;
};

function getRoleDefaults(isSeller: boolean) {
  return {
    name: isSeller ? "CryptoKing_99" : "SilentBuyer_01",
    handle: isSeller ? "@cryptoking" : "@silentbuyer",
    avatar: isSeller
      ? "https://ui-avatars.com/api/?name=Crypto+King&background=10b981&color=fff"
      : "https://ui-avatars.com/api/?name=Silent+Buyer&background=3b82f6&color=fff",
    banner: "/framehero.svg",
  };
}

export default function ProfilePage() {
  const supabase = useMemo(() => createClient(), []);
  const { role } = useUser();
  const isSeller = role === "seller";
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<"listings" | "reviews">("listings");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    avatar: "",
    banner: "",
    description: "",
    bannerPosition: 50, // 0-100% Y position
    avatarPosition: 50  // 0-100% X/Y (simplified to just one axis for now or could be complex)
  });
  const [pendingImages, setPendingImages] = useState<Record<EditableImageType, File | null>>({
    avatar: null,
    banner: null,
  });

  const [isDraggingBanner, setIsDraggingBanner] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const startPos = useRef(0);
  
  // Use mock data but adapt based on role
  const [profile, setProfile] = useState({
    ...MOCK_PROFILE,
    ...getRoleDefaults(isSeller),
    bannerPosition: 50
  });

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      const defaults = getRoleDefaults(isSeller);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active) return;

      setCurrentUserId(user?.id || null);

      if (!user) {
        setProfile((prev) => ({
          ...prev,
          ...defaults,
        }));
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("full_name,username,avatar_url,banner_url")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Load profile error:", error);
        return;
      }

      const dbProfile = (data || null) as StoredProfile | null;
      const handle = dbProfile?.username
        ? `@${dbProfile.username.replace(/^@/, "")}`
        : defaults.handle;

      setProfile((prev) => ({
        ...prev,
        name: dbProfile?.full_name || defaults.name,
        handle,
        avatar: dbProfile?.avatar_url || defaults.avatar,
        banner: dbProfile?.banner_url || defaults.banner,
      }));
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [isSeller, supabase]);

  const handleEditClick = () => {
    setEditForm({
      avatar: profile.avatar,
      banner: profile.banner,
      description: profile.description,
      bannerPosition: profile.bannerPosition,
      avatarPosition: 50
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setPendingImages({ avatar: null, banner: null });
  };

  const uploadProfileImage = async (file: File, type: EditableImageType) => {
    if (!currentUserId) {
      throw new Error("Not authenticated");
    }

    const extension = file.name.includes(".")
      ? file.name.split(".").pop()?.toLowerCase() || "jpg"
      : "jpg";
    const bucket = type === "avatar" ? "avatars" : "profile-banners";
    const roleSegment = isSeller ? "seller" : "buyer";
    const filePath = `${currentUserId}/${roleSegment}/${type}-${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      throw uploadError;
    }

    return supabase.storage.from(bucket).getPublicUrl(filePath).data.publicUrl;
  };

  const handleSave = async () => {
    if (isSaving) return;

    if ((pendingImages.avatar || pendingImages.banner) && !currentUserId) {
      toast.error("Sign in to save avatar and banner permanently.");
      return;
    }

    setIsSaving(true);

    try {
      let nextAvatar = editForm.avatar || profile.avatar;
      let nextBanner = editForm.banner || profile.banner;

      if (pendingImages.avatar) {
        nextAvatar = await uploadProfileImage(pendingImages.avatar, "avatar");
      }

      if (pendingImages.banner) {
        nextBanner = await uploadProfileImage(pendingImages.banner, "banner");
      }

      if (currentUserId) {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            avatar_url: nextAvatar,
            banner_url: nextBanner,
          })
          .eq("id", currentUserId);

        if (updateError) {
          throw updateError;
        }
      }

      setProfile((prev) => ({
        ...prev,
        avatar: nextAvatar,
        banner: nextBanner,
        description: editForm.description,
        bannerPosition: editForm.bannerPosition
      }));
      setPendingImages({ avatar: null, banner: null });
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Save profile error:", error);
      toast.error("Failed to save profile changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: EditableImageType) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPendingImages((prev) => ({ ...prev, [type]: file }));

    const reader = new FileReader();
    reader.onloadend = () => {
      setEditForm(prev => ({
        ...prev,
        [type]: reader.result as string
      }));
      toast.success(`${type === 'avatar' ? 'Avatar' : 'Banner'} updated!`);
    };
    reader.readAsDataURL(file);
  };

  // Banner Dragging Logic
  const handleBannerMouseDown = (e: React.MouseEvent) => {
    if (!isEditing) return;
    setIsDraggingBanner(true);
    startY.current = e.clientY;
    startPos.current = editForm.bannerPosition;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingBanner) return;
      
      const deltaY = e.clientY - startY.current;
      // Convert pixels to percentage based on container height (approx 320px)
      // Sensitivity factor 0.2 to make it smoother
      const deltaPercent = (deltaY / 320) * 100 * -1; 
      
      let newPos = startPos.current + deltaPercent;
      newPos = Math.max(0, Math.min(100, newPos)); // Clamp between 0-100%

      setEditForm(prev => ({ ...prev, bannerPosition: newPos }));
    };

    const handleMouseUp = () => {
      setIsDraggingBanner(false);
    };

    if (isDraggingBanner) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingBanner]);

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-zinc-800 selection:text-white pb-20">
      <Navbar />

      {/* Banner */}
      <div 
        ref={bannerRef}
        className={cn(
          "relative h-64 md:h-80 w-full overflow-hidden group select-none",
          isEditing && "cursor-move"
        )}
        onMouseDown={handleBannerMouseDown}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 z-10 pointer-events-none" />
        <Image
          src={isEditing ? (editForm.banner || profile.banner) : profile.banner}
          alt="Banner"
          fill
          className="object-cover opacity-60 transition-all duration-75 ease-out"
          style={{ 
            objectPosition: `center ${isEditing ? editForm.bannerPosition : profile.bannerPosition}%` 
          }}
          priority
          draggable={false}
        />
        
        {/* Edit Banner Controls */}
        {isEditing && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center gap-3 w-full max-w-md px-4 pointer-events-auto">
              <div className="flex items-center gap-2">
                 <label className="cursor-pointer text-sm font-bold text-white flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-md border border-white/10 shadow-lg">
                  <Camera className="w-4 h-4" /> 
                  Change
                  <input 
                    type="file" 
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, 'banner')}
                  />
                </label>
                <div className="px-4 py-2 bg-black/50 text-white text-xs font-bold rounded-full border border-white/10 backdrop-blur-md flex items-center gap-2">
                  <Move className="w-3 h-3" /> Drag to reposition
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <main className="container mx-auto px-4 sm:px-6 relative z-20 -mt-24">
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8">
          
          {/* Left Column: Profile Card */}
          <div className="space-y-6">
            <Squircle 
              radius={32} 
              smoothing={1} 
              className="w-full drop-shadow-2xl"
              innerClassName="bg-[#1C1C1E] border border-white/10 overflow-hidden p-6"
            >
              <div className="flex flex-col items-center text-center relative">
                
                {/* Edit Button (Top Right of Card) */}
                {!isEditing ? (
                  <button 
                    onClick={handleEditClick}
                    className="absolute top-0 right-0 p-2 text-zinc-500 hover:text-white transition-colors"
                    title="Edit Profile"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="absolute top-0 right-0 flex gap-2">
                    <button 
                      onClick={handleCancelEdit}
                      className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
                      title="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={handleSave}
                      disabled={isSaving}
                      className="p-2 text-emerald-500 hover:text-emerald-400 transition-colors"
                      title="Save"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Avatar */}
                <div className="relative mb-4 group">
                  <div className="w-32 h-32 rounded-full border-4 border-[#1C1C1E] overflow-hidden relative z-10 bg-zinc-800">
                    <Image
                      src={isEditing ? (editForm.avatar || profile.avatar) : profile.avatar}
                      alt={profile.name}
                      fill
                      className="object-cover"
                    />
                    
                    {/* Edit Avatar Overlay */}
                    {isEditing && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center cursor-pointer hover:bg-black/70 transition-colors z-20">
                        <label className="cursor-pointer w-full h-full flex items-center justify-center">
                          <Camera className="w-8 h-8 text-white/80" />
                          <input 
                            type="file" 
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageUpload(e, 'avatar')}
                          />
                        </label>
                      </div>
                    )}
                  </div>

                  {!isEditing && profile.isOnline && (
                    <div className="absolute bottom-2 right-2 w-6 h-6 bg-emerald-500 border-4 border-[#1C1C1E] rounded-full z-20" title="Online" />
                  )}
                  
                  {/* Level Badge */}
                  {!isEditing && (
                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-400 to-orange-500 text-black text-xs font-bold px-2 py-1 rounded-full border-2 border-[#1C1C1E] z-20 shadow-lg">
                      Lvl {profile.level}
                    </div>
                  )}
                </div>

                <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2 mt-2">
                  {profile.name}
                  {isSeller && <ShieldCheck className="w-5 h-5 text-emerald-400" />}
                </h1>
                <p className="text-zinc-500 text-sm mb-6">{profile.handle}</p>

                {/* Main Stats Grid */}
                <div className="grid grid-cols-2 gap-3 w-full mb-6">
                   <div className="bg-[#2C2C2E] rounded-xl p-3 flex flex-col items-center justify-center border border-white/5">
                      <span className="text-lg font-bold text-white">{profile.followers}</span>
                      <span className="text-xs text-zinc-500">Followers</span>
                   </div>
                   <div className="bg-[#2C2C2E] rounded-xl p-3 flex flex-col items-center justify-center border border-white/5">
                      <span className="text-lg font-bold text-white">{profile.following}</span>
                      <span className="text-xs text-zinc-500">Following</span>
                   </div>
                </div>

                {/* Follow Button (Only show if not editing) */}
                {!isEditing && (
                  <Button 
                    className={cn(
                      "w-full h-10 rounded-xl font-bold mb-6 transition-all",
                      isFollowing 
                        ? "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white" 
                        : "bg-white text-black hover:bg-zinc-200"
                    )}
                    onClick={() => setIsFollowing(!isFollowing)}
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </Button>
                )}

                <div className="w-full h-px bg-white/5 mb-6" />

                {/* Details List */}
                <div className="w-full space-y-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> Member Since
                    </span>
                    <span className="text-zinc-300 font-medium">{profile.memberSince}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 flex items-center gap-2">
                      <MapPin className="w-4 h-4" /> Location
                    </span>
                    <span className="text-zinc-300 font-medium">{profile.location}</span>
                  </div>

                  {isSeller && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500 flex items-center gap-2">
                          <Package className="w-4 h-4" /> Deliveries
                        </span>
                        <span className="text-emerald-400 font-bold">{profile.successfulDeliveries.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500 flex items-center gap-2">
                          <Clock className="w-4 h-4" /> Response Time
                        </span>
                        <span className="text-zinc-300 font-medium">{profile.avgResponseTime}</span>
                      </div>
                    </>
                  )}

                  {!isSeller && (
                    <div className="flex items-center justify-between">
                        <span className="text-zinc-500 flex items-center gap-2">
                          <Package className="w-4 h-4" /> Purchases
                        </span>
                        <span className="text-zinc-300 font-bold">{profile.totalPurchases}</span>
                    </div>
                  )}
                </div>
              </div>
            </Squircle>

            {/* Badges Card */}
            <Squircle 
              radius={24} 
              smoothing={1} 
              className="w-full"
              innerClassName="bg-[#1C1C1E] border border-white/10 p-5"
            >
              <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">
                {isSeller ? "Seller Status" : "Buyer Status"}
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br", isSeller ? "from-emerald-500/20 to-teal-500/20 text-emerald-400" : "from-blue-500/20 to-indigo-500/20 text-blue-400")}>
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">
                      {isSeller ? profile.sellerRanking : profile.buyerRanking}
                    </div>
                    <div className="text-xs text-zinc-500">Ranking</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br", isSeller ? "from-amber-500/20 to-yellow-500/20 text-amber-400" : "from-purple-500/20 to-pink-500/20 text-purple-400")}>
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">
                      {isSeller ? profile.sellerProtection : profile.buyerProtection}
                    </div>
                    <div className="text-xs text-zinc-500">Protection Level</div>
                  </div>
                </div>
              </div>
            </Squircle>
          </div>

          {/* Right Column: Content */}
          <div className="space-y-8">
            
            {/* About Section */}
            <div className="space-y-4">
               <div className="flex items-center justify-between">
                 <h2 className="text-xl font-bold text-white">About</h2>
                 {isEditing && <span className="text-xs text-emerald-400 font-medium animate-pulse">Editing mode active</span>}
               </div>
               
               {isEditing ? (
                 <div className="bg-[#1C1C1E] p-6 rounded-3xl border border-emerald-500/30 ring-1 ring-emerald-500/20">
                   <textarea 
                      value={editForm.description}
                      onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                      className="w-full min-h-[120px] bg-transparent border-none text-white placeholder:text-zinc-500 focus:ring-0 resize-none text-sm md:text-base leading-relaxed"
                      placeholder="Write something about yourself..."
                   />
                 </div>
               ) : (
                 <p className="text-zinc-400 leading-relaxed text-sm md:text-base bg-[#1C1C1E] p-6 rounded-3xl border border-white/5 whitespace-pre-wrap">
                   {profile.description}
                 </p>
               )}
            </div>

            {/* Content Tabs */}
            <div className="space-y-6">
              <div className="flex items-center gap-6 border-b border-white/10 pb-1">
                <button 
                  onClick={() => setActiveTab("listings")}
                  className={cn("text-sm font-bold pb-3 border-b-2 transition-colors", activeTab === "listings" ? "text-white border-white" : "text-zinc-500 border-transparent hover:text-zinc-300")}
                >
                  {isSeller ? "My Offers" : "What I Buy"}
                </button>
                <button 
                  onClick={() => setActiveTab("reviews")}
                  className={cn("text-sm font-bold pb-3 border-b-2 transition-colors", activeTab === "reviews" ? "text-white border-white" : "text-zinc-500 border-transparent hover:text-zinc-300")}
                >
                  Reviews <span className="text-xs bg-zinc-800 px-1.5 py-0.5 rounded ml-1 text-zinc-400">128</span>
                </button>
              </div>

              {/* Tab Content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeTab === "listings" && isSeller && MOCK_LISTINGS.map(item => (
                   <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group relative bg-[#1C1C1E] hover:bg-[#252527] border border-white/5 rounded-2xl p-4 transition-all cursor-pointer"
                   >
                     <div className="flex items-start gap-4">
                       <div className="w-16 h-16 bg-[#2C2C2E] rounded-xl flex items-center justify-center text-3xl">
                         {item.image}
                       </div>
                       <div>
                         <h3 className="text-white font-bold text-sm mb-1 group-hover:text-emerald-400 transition-colors">{item.title}</h3>
                         <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
                           <span>{item.sold} sold</span>
                           <span>•</span>
                           <span className="text-emerald-400 font-medium">Instant Delivery</span>
                         </div>
                         <div className="text-white font-bold">${item.price.toFixed(2)}</div>
                       </div>
                     </div>
                   </motion.div>
                ))}

                {activeTab === "listings" && !isSeller && MOCK_REQUESTS.map(item => (
                   <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group relative bg-[#1C1C1E] hover:bg-[#252527] border border-white/5 rounded-2xl p-4 transition-all cursor-pointer"
                   >
                     <div className="flex items-start gap-4">
                       <div className="w-16 h-16 bg-[#2C2C2E] rounded-xl flex items-center justify-center text-3xl">
                         {item.image}
                       </div>
                       <div>
                         <h3 className="text-white font-bold text-sm mb-1 group-hover:text-blue-400 transition-colors">{item.title}</h3>
                         <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
                           <span className="bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">Request</span>
                         </div>
                         <div className="text-white font-bold">Budget: {item.budget}</div>
                       </div>
                     </div>
                   </motion.div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}
