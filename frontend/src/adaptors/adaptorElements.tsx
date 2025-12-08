import { ReactElement } from "react";
import GamepadAdaptor from "./gamepadAdaptor";

export const adaptorElements: Record<string, ReactElement> = {
  gamepad: <GamepadAdaptor />,
};
