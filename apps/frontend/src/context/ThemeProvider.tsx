import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

type ThemeProviderState = {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    resolvedTheme: "light" | "dark";
}

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(
    undefined
);

const STORAGE_KEY = "hanover-cma-theme";

type ThemeProviderProps = {
    children: React.ReactNode;
    defaultTheme?: Theme;
};

export function ThemeProvider({
  children,
  defaultTheme = "system"
}: ThemeProviderProps) {

    const [theme, setThemeState] = useState<Theme>(() => {
        if (typeof window === "undefined") return defaultTheme;
        const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
        return stored ?? defaultTheme;
    });

    const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

    useEffect(() => {
        const root = document.documentElement;
        const media = window.matchMedia("(prefers-color-scheme: dark)");

        const apply = () => {
            const effective = theme === "system" ? (media.matches ? "dark" : "light") : theme;

            root.classList.remove("light","dark");
            root.classList.add(effective);
            setResolvedTheme(effective);
        };

        apply();

        //React to OS changes
        if (theme === "system") {
            media.addEventListener("change", apply);
            return () => media.removeEventListener("change", apply);
        }
    }, [theme]);

    const setTheme = (newTheme: Theme) => {
        localStorage.setItem(STORAGE_KEY, newTheme);
        setThemeState(newTheme);
    };

    return (
        <ThemeProviderContext.Provider value={{ theme, setTheme, resolvedTheme }}>
            {children}
        </ThemeProviderContext.Provider>
    )

}

export function useTheme() {
    const ctx = useContext(ThemeProviderContext);
    if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
    return ctx;
}