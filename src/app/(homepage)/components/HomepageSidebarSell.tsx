"use client";

export function HomepageSidebarSell({
  renderSellSections,
  closeMobileOnClick = false,
}: {
  renderSellSections: (closeMobileOnClick?: boolean) => React.ReactNode;
  closeMobileOnClick?: boolean;
}) {
  return <>{renderSellSections(closeMobileOnClick)}</>;
}
