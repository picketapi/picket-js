import React from "react";
import { tw } from "twind";

import { useIsMobile } from "./utils/hooks";

interface NewWalletButtonProps {
  mobilePreferredWalletLink: string;
  desktopPreferredWalletLink: string;
}
const NewWalletButton = ({
  mobilePreferredWalletLink,
  desktopPreferredWalletLink,
}: NewWalletButtonProps) => {
  const isMobile = useIsMobile();
  return (
    <a
      href={isMobile ? mobilePreferredWalletLink : desktopPreferredWalletLink}
      target="_blank"
      rel="noreferrer"
      style={{
        outlineOffset: "4px",
      }}
      className={tw`w-full rounded-lg bg-white p-2.5 text-center text-sm font-semibold shadow hover:bg-gray-100 dark:bg-[#26293B] dark:text-white dark:hover:bg-[#181B2E] sm:text-base`}
    >
      New Wallet
    </a>
  );
};

export default NewWalletButton;
