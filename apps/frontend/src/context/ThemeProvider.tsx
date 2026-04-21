import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

// resolvedTheme is always a concrete value ("light" or "dark"), never "system"
type ThemeProviderState = {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    resolvedTheme: "light" | "dark";
}

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(
    undefined
);

// localStorage key for persisting the user's theme preference across sessions
const STORAGE_KEY = "hanover-cma-theme";

type ThemeProviderProps = {
    children: React.ReactNode;
    defaultTheme?: Theme;
};

export function ThemeProvider({
  children,
  defaultTheme = "system"
}: ThemeProviderProps) {

    // Initialize from localStorage so the stored preference survives page reloads
    const [theme, setThemeState] = useState<Theme>(() => {
        if (typeof window === "undefined") return defaultTheme;
        const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
        return stored ?? defaultTheme;
    });

    // Tracks the actual applied theme so consumers can read it without resolving "system" themselves
    const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

    useEffect(() => {
        const root = document.documentElement;
        const media = window.matchMedia("(prefers-color-scheme: dark)");

        const apply = () => {
            // When "system", defer to the OS preference; otherwise use the explicit choice
            const effective = theme === "system" ? (media.matches ? "dark" : "light") : theme;

            root.classList.remove("light","dark");
            root.classList.add(effective);
            setResolvedTheme(effective);
        };

        apply();

        // Only listen for OS-level changes when the user has chosen "system"
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

// Throws outside of ThemeProvider so missing wrappers surface immediately rather than silently returning undefined
export function useTheme() {
    const ctx = useContext(ThemeProviderContext);
    if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
    return ctx;
}