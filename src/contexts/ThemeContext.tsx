import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

export interface ColorTheme {
  name: string;
  color: string;
  hsl: string;
}

export const COLOR_THEMES: ColorTheme[] = [
  { name: 'Ocean Blue', color: '#3B82F6', hsl: '217 91% 60%' },
  { name: 'Emerald', color: '#10B981', hsl: '160 84% 39%' },
  { name: 'Sunset Orange', color: '#F97316', hsl: '25 95% 53%' },
  { name: 'Ruby Red', color: '#EF4444', hsl: '0 84% 60%' },
  { name: 'Violet', color: '#8B5CF6', hsl: '258 90% 66%' },
  { name: 'Fuchsia', color: '#D946EF', hsl: '292 84% 61%' },
  { name: 'Rose', color: '#F43F5E', hsl: '347 77% 60%' },
  { name: 'Amber', color: '#F59E0B', hsl: '38 92% 50%' },
  { name: 'Teal', color: '#14B8A6', hsl: '173 80% 40%' },
  { name: 'Indigo', color: '#6366F1', hsl: '239 84% 67%' },
  { name: 'Lime', color: '#84CC16', hsl: '84 81% 44%' },
  { name: 'Cyan', color: '#06B6D4', hsl: '189 94% 43%' },
  { name: 'Sky', color: '#0EA5E9', hsl: '199 89% 48%' },
  { name: 'Pink', color: '#EC4899', hsl: '330 81% 60%' },
  { name: 'Slate', color: '#64748B', hsl: '215 16% 47%' },
  { name: 'Gold', color: '#EAB308', hsl: '48 96% 47%' },
  { name: 'Coral', color: '#FF6B6B', hsl: '0 100% 71%' },
  { name: 'Mint', color: '#00D4AA', hsl: '168 100% 42%' },
  { name: 'Lavender', color: '#A78BFA', hsl: '258 90% 76%' },
  { name: 'Peach', color: '#FDBA74', hsl: '27 98% 72%' },
  { name: 'Electric', color: '#7C3AED', hsl: '263 84% 58%' },
  { name: 'Neon Green', color: '#22C55E', hsl: '142 71% 45%' },
  { name: 'Arctic', color: '#38BDF8', hsl: '199 89% 60%' },
  { name: 'Crimson', color: '#DC2626', hsl: '0 72% 51%' },
  { name: 'Bronze', color: '#CD7F32', hsl: '34 60% 50%' },
  { name: 'Sapphire', color: '#2563EB', hsl: '217 91% 54%' },
  { name: 'Magenta', color: '#E11D48', hsl: '347 77% 50%' },
  { name: 'Honey', color: '#FCD34D', hsl: '45 93% 64%' },
  { name: 'Forest', color: '#166534', hsl: '149 58% 24%' },
  { name: 'Plum', color: '#7E22CE', hsl: '270 67% 47%' },
  { name: 'Steel', color: '#475569', hsl: '215 19% 35%' },
  { name: 'Champagne', color: '#F5E6CC', hsl: '35 72% 88%' },
];

interface ThemeConfigContextType {
  colorTheme: string;
  setColorTheme: (name: string) => void;
  themes: ColorTheme[];
}

const ThemeConfigContext = createContext<ThemeConfigContextType | undefined>(undefined);

export function ThemeConfigProvider({ children }: { children: React.ReactNode }) {
  const [colorTheme, setColorThemeState] = useState<string>(() => {
    try {
      return localStorage.getItem('color-theme') || 'Cyan';
    } catch {
      return 'Cyan';
    }
  });

  const setColorTheme = (name: string) => {
    setColorThemeState(name);
    try {
      localStorage.setItem('color-theme', name);
    } catch {}
  };

  useEffect(() => {
    const theme = COLOR_THEMES.find(t => t.name === colorTheme);
    if (theme) {
      document.documentElement.setAttribute('data-color-theme', colorTheme);
      // Apply theme accent color to CSS custom properties
      const root = document.documentElement;
      root.style.setProperty('--primary', theme.hsl);
      root.style.setProperty('--accent', theme.hsl);
      root.style.setProperty('--ring', theme.hsl);
    } else {
      // Default cyan
      document.documentElement.removeAttribute('data-color-theme');
      const root = document.documentElement;
      root.style.removeProperty('--primary');
      root.style.removeProperty('--accent');
      root.style.removeProperty('--ring');
    }
  }, [colorTheme]);

  return (
    <ThemeConfigContext.Provider value={{ colorTheme, setColorTheme, themes: COLOR_THEMES }}>
      {children}
    </ThemeConfigContext.Provider>
  );
}

export function useThemeConfig() {
  const context = useContext(ThemeConfigContext);
  if (!context) throw new Error('useThemeConfig must be used within ThemeConfigProvider');
  return context;
}
