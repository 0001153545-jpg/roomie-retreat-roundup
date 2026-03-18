import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { useLanguage } from "./LanguageContext";

export type Currency = "BRL" | "USD" | "EUR";

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  formatPrice: (price: number) => string;
  symbol: string;
  rate: number;
}

const rates: Record<Currency, number> = { BRL: 1, USD: 0.18, EUR: 0.17 };
const symbols: Record<Currency, string> = { BRL: "R$", USD: "$", EUR: "€" };

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
};

const langToCurrency: Record<string, Currency> = { pt: "BRL", en: "USD", es: "EUR" };

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const { language } = useLanguage();
  const [currency, setCurrencyState] = useState<Currency>(() => {
    const saved = localStorage.getItem("currency") as Currency;
    return saved && rates[saved] ? saved : "BRL";
  });

  // Currency is now independent from language

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem("currency", c);
  }, []);

  const formatPrice = useCallback((price: number) => {
    const converted = price * rates[currency];
    return `${symbols[currency]} ${converted.toFixed(currency === "BRL" ? 0 : 2)}`;
  }, [currency]);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice, symbol: symbols[currency], rate: rates[currency] }}>
      {children}
    </CurrencyContext.Provider>
  );
};
