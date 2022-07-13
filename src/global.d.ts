import Picket from "./picket";

export declare global {
  interface Window {
    Picket: typeof Picket;
    picket: InstanceType<typeof Picket>;
    PicketProvider: any;
  }
}
