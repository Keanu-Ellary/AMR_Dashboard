"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import type { SiteData } from "@/types/site_types";

interface UIContextType {
  isAddDataOpen: boolean;
  setIsAddDataOpen: (open: boolean) => void;
  isAddImagesOpen: boolean;
  setIsAddImagesOpen: (open: boolean) => void;
  globalSelectedSite: SiteData | null;
  setGlobalSelectedSite: (site: SiteData | null) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [isAddDataOpen, setIsAddDataOpen] = useState(false);
  const [isAddImagesOpen, setIsAddImagesOpen] = useState(false);
  const [globalSelectedSite, setGlobalSelectedSite] = useState<SiteData | null>(
    null,
  );

  return (
    <UIContext.Provider
      value={{
        isAddDataOpen,
        setIsAddDataOpen,
        isAddImagesOpen,
        setIsAddImagesOpen,
        globalSelectedSite,
        setGlobalSelectedSite,
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
