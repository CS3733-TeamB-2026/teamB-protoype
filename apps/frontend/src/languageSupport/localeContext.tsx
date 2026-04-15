import React, { createContext, useContext, useState } from "react";

type LocaleCode = "en_us" | "sp_sp";

interface LocaleContextType {
    locale: LocaleCode;
    setLocale: (locale: LocaleCode) => void;
}

const LocaleContext = createContext<LocaleContextType>({
    locale: "en_us",
    setLocale: () => {},
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
    const [locale, setLocale] = useState<LocaleCode>("en_us");
    return (
        <LocaleContext.Provider value={{ locale, setLocale }}>
            {children}
        </LocaleContext.Provider>
    );
}

export const useLocale = () => useContext(LocaleContext);