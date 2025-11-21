"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, Sparkles, Terminal, Zap, Waves, Sunset } from "lucide-react";

export function ThemeSwitcher() {
    const { setTheme, theme } = useTheme();
    const [mounted, setMounted] = React.useState(false);
    const [isOpen, setIsOpen] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return null;
    }

    const themes = [
        { name: "light", label: "Light", icon: Sun },
        { name: "dark", label: "Dark", icon: Moon },
        { name: "aurora", label: "Aurora Borealis", icon: Sparkles },
        { name: "matrix", label: "Matrix Green", icon: Terminal },
        { name: "cyberpunk", label: "Cyberpunk Neon", icon: Zap },
        { name: "ocean", label: "Ocean Depths", icon: Waves },
        { name: "sunset", label: "Sunset Horizon", icon: Sunset },
    ];

    const currentTheme = themes.find((t) => t.name === theme) || themes[0];
    const CurrentIcon = currentTheme.icon;

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-gray-200 dark:border-gray-700"
                aria-label="Toggle theme"
            >
                <CurrentIcon className="h-5 w-5" />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                    {themes.map((t) => {
                        const Icon = t.icon;
                        return (
                            <button
                                key={t.name}
                                onClick={() => {
                                    setTheme(t.name);
                                    setIsOpen(false);
                                }}
                                className={`flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${theme === t.name ? "text-blue-600 font-medium" : "text-gray-700 dark:text-gray-200"
                                    }`}
                            >
                                <Icon className="mr-2 h-4 w-4" />
                                {t.label}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
