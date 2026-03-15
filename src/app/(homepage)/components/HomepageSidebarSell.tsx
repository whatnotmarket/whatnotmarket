"use client";

import { motion } from "framer-motion";

export function HomepageSidebarSell({
  renderSellSections,
  closeMobileOnClick = false,
}: {
  renderSellSections: (closeMobileOnClick?: boolean) => React.ReactNode;
  closeMobileOnClick?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -18 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
    >
      {renderSellSections(closeMobileOnClick)}
    </motion.div>
  );
}
