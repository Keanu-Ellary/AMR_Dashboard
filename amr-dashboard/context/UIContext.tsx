"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface UIContextType {
  isAddDataOpen: boolean;
  setIsAddDataOpen: (open: boolean) => void;
  isAddImagesOpen: boolean;
  setIsAddImagesOpen: (open: boolean) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [isAddDataOpen, setIsAddDataOpen] = useState(false);
  const [isAddImagesOpen, setIsAddImagesOpen] = useState(false);

  return (
    <UIContext.Provider
      value={{
        isAddDataOpen,
        setIsAddDataOpen,
        isAddImagesOpen,
        setIsAddImagesOpen,
      }}
    >
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error("useUI must be used within a UIProvider");
  }
  return context;
}
