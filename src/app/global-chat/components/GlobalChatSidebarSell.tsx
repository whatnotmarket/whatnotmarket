"use client";

export function GlobalChatSidebarSell({
  renderSellSections,
  closeMobileOnClick = false,
}: {
  renderSellSections: (closeMobileOnClick?: boolean) => React.ReactNode;
  closeMobileOnClick?: boolean;
}) {
  return <>{renderSellSections(closeMobileOnClick)}</>;
}

