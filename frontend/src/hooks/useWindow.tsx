import React, { createContext, useContext, useState, useCallback } from "react";
import FloatingWindow from "../components/floatingWindow";

type WindowContext = {
  openWindow: (element: React.ReactElement) => void;
  closeWindow: () => void;
  windowOpened: boolean;
};

const WindowContext = createContext<WindowContext | null>(null);

export const WindowProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [window, setWindow] = useState<React.ReactElement | null>(null);

  const closeWindow = useCallback(() => setWindow(null), []);
  const openWindow = useCallback(
    (element: React.ReactElement) =>
      setWindow(
        <FloatingWindow onClose={closeWindow}>{element}</FloatingWindow>
      ),
    [closeWindow]
  );

  return (
    <WindowContext.Provider
      value={{ openWindow, closeWindow, windowOpened: window !== null }}
    >
      {children}
      {window}
    </WindowContext.Provider>
  );
};

export function useWindow(): WindowContext {
  const ctx = useContext(WindowContext);
  if (!ctx) throw new Error("useWindow must be used within WindowProvider");
  return ctx;
}
