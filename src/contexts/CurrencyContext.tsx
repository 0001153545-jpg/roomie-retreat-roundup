import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type Currency = "BRL" | "USD" | "EUR";

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  formatPrice: (price: number) => string;
  symbol: string;
  rate: number;
}

// Conversion rates from BRL base
const rates: Record<Currency, number> = { BRL: 1, USD: 0.18, EUR: 0.17 };
const symbols: Record<Currency, string> = { BRL: "R$", USD: "$", EUR: "€" };
// Always format numbers in en-US style ($317,141.67) regardless of currency,
// per design decision to standardize across the app. Symbol still varies.
const NUMBER_LOCALE = "en-US";

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
};

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    const saved = localStorage.getItem("currency") as Currency;
    return saved && rates[saved] ? saved : "BRL";
  });

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem("currency", c);
  }, []);

  const formatPrice = useCallback((price: number) => {
    const safe = typeof price === "number" && isFinite(price) ? price : 0;
    const converted = safe * rates[currency];
    try {
      // Format using en-US to always get $317,141.67 style; manually prefix the currency symbol.
      const formatted = converted.toLocaleString(NUMBER_LOCALE, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return `${symbols[currency]}${formatted}`;
    } catch {
      return `${symbols[currency]} ${converted.toFixed(2)}`;
    }
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    } catch {
      return `${symbols[currency]} ${converted.toFixed(2)}`;
    }
  }, [currency]);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice, symbol: symbols[currency], rate: rates[currency] }}>
      {children}
    </CurrencyContext.Provider>
  );
};
