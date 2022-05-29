import Picket from "./picket";

export declare global {
  interface Window {
    Picket: typeof Picket;
  }
}
