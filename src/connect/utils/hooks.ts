import { useState, useEffect } from "react";

import * as device from "./device";

// simple hook to check for mobile user agents on load
export const useIsMobile = () => {
  const [isMobile, setMobile] = useState(false);

  useEffect(() => {
    setMobile(device.isMobile());
  }, []);

  return isMobile;
};
