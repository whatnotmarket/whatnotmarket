import type { GlobalChatRoom } from "@/lib/chat/global-chat-config";

export type ProfileRef = {
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string | null;
  role_preference: "buyer" | "seller" | "both" | null;
  seller_status: string | null;
};

export type GlobalChatRow = {
  id: string;
  user_id: string;
  room: string;
  message: string;
  created_at: string;
  reply_to_id?: string | null;
  mentioned_handles?: string[] | null;
  profiles: ProfileRef | ProfileRef[] | null;
};

export type GlobalChatMessage = {
  id: string;
  userId: string;
  room: string;
  text: string;
  createdAt: string;
  displayName: string;
  handle: string;
  avatarUrl: string | null;
  memberSince: string | null;
  isSeller: boolean;
  isBuyer: boolean;
  replyToId: string | null;
  mentionedHandles: string[];
};

export type PostChatResponse =
  | {
      ok: true;
      data: {
        id: string;
        user_id: string;
        room: string;
        message: string;
        created_at: string;
        reply_to_id: string | null;
        mentioned_handles: string[] | null;
      };
    }
  | { ok: false; code: string; message: string };

export type MentionContext = {
  query: string;
  start: number;
  end: number;
};

export type MentionableUser = {
  userId: string;
  displayName: string;
  handle: string;
  avatarUrl: string | null;
  memberSince: string | null;
  isSeller: boolean;
  isBuyer: boolean;
};

export type PresencePayload = {
  userId?: string;
  username?: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
  memberSince?: string | null;
  rolePreference?: "buyer" | "seller" | "both" | null;
  sellerStatus?: string | null;
  isSeller?: boolean;
  isBuyer?: boolean;
};

export type SidebarMode = "buy" | "sell";

export type SellSidebarSection = {
  key:
    | "seller-hub"
    | "inventory"
    | "orders"
    | "payouts"
    | "growth"
    | "reputation-compliance"
    | "analytics";
  label: string;
  tabs: readonly string[];
};

export type SellSidebarSectionKey = SellSidebarSection["key"];

export type RoomListItem = {
  slug: GlobalChatRoom;
  label: string;
};
