import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { formatCurrency } from "../utils/format";

interface ValueVisibilityContextValue {
  isValueVisible: boolean;
  toggleValueVisibility: () => void;
  formatCurrencyValue: (value: number) => string;
  maskCurrencyValue: () => string;
}

const STORAGE_KEY = "riquinho.value-visibility";

const ValueVisibilityContext = createContext<ValueVisibilityContextValue | null>(null);

export function ValueVisibilityProvider({ children }: { children: ReactNode }) {
  const [isValueVisible, setIsValueVisible] = useState(true);

  useEffect(() => {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);

    if (storedValue === "hidden") {
      setIsValueVisible(false);
    }
  }, []);

  const value = useMemo<ValueVisibilityContextValue>(
    () => ({
      isValueVisible,
      toggleValueVisibility: () => {
        setIsValueVisible((current) => {
          const nextValue = !current;
          window.localStorage.setItem(STORAGE_KEY, nextValue ? "visible" : "hidden");
          return nextValue;
        });
      },
      formatCurrencyValue: (amount: number) => (isValueVisible ? formatCurrency(amount) : "R$ •••••"),
      maskCurrencyValue: () => "R$ •••••"
    }),
    [isValueVisible]
  );

  return <ValueVisibilityContext.Provider value={value}>{children}</ValueVisibilityContext.Provider>;
}

export function useValueVisibility() {
  const context = useContext(ValueVisibilityContext);

  if (!context) {
    throw new Error("useValueVisibility must be used within ValueVisibilityProvider");
  }

  return context;
}
