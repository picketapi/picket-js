import "./global.d";
export * from "./types";
export * from "./picket";
export * from "./providers";
export * from "./pkce";

import Picket from "./picket";

// make available to browser
if (typeof window !== "undefined") {
  window.Picket = Picket;
}

export default Picket;
