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
      className={tw`p-2.5 w-full bg-white dark:bg-[#26293B] dark:hover:bg-[#181B2E] dark:text-white rounded-lg shadow text-center font-semibold text-sm sm:text-base hover:bg-gray-100`}
    >
      New Wallet
    </a>
  );
};

export default NewWalletButton;
