import React, { createContext, useContext, useEffect, useState } from 'react';

export interface ColorTheme {
  name: string;
  color: string;
  hsl: string; // "H S% L%"
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

function parseHSL(hsl: string): { h: number; s: number; l: number } {
  const parts = hsl.match(/[\d.]+/g);
  if (!parts || parts.length < 3) return { h: 189, s: 94, l: 43 };
  return { h: parseFloat(parts[0]), s: parseFloat(parts[1]), l: parseFloat(parts[2]) };
}

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
    const root = document.documentElement;

    if (theme) {
      const { h, s, l } = parseHSL(theme.hsl);
      const isDark = root.classList.contains('dark');

      // Primary / accent / ring
      root.style.setProperty('--primary', theme.hsl);
      root.style.setProperty('--accent', theme.hsl);
      root.style.setProperty('--ring', theme.hsl);

      // Primary foreground – light text for dark accents, dark text for light accents
      const needsDarkFg = l > 65 || (s < 30 && l > 50);
      root.style.setProperty('--primary-foreground', needsDarkFg ? '222 47% 11%' : '0 0% 100%');
      root.style.setProperty('--accent-foreground', needsDarkFg ? '222 47% 11%' : '0 0% 100%');

      // Border – tinted with the accent color
      if (isDark) {
        root.style.setProperty('--border', `${h} ${Math.min(s, 30)}% 25%`);
        root.style.setProperty('--input', `${h} ${Math.min(s, 20)}% 20%`);
        // Card – slight tint
        root.style.setProperty('--card', `${h} ${Math.min(s, 25)}% 14%`);
        root.style.setProperty('--card-foreground', '210 40% 98%');
        // Secondary – deeper tint
        root.style.setProperty('--secondary', `${h} ${Math.min(s, 20)}% 18%`);
        root.style.setProperty('--secondary-foreground', '210 40% 98%');
        // Muted
        root.style.setProperty('--muted', `${h} ${Math.min(s, 15)}% 18%`);
        root.style.setProperty('--muted-foreground', `${h} ${Math.min(s, 15)}% 60%`);
        // Background – very subtle tint
        root.style.setProperty('--background', `${h} ${Math.min(s, 20)}% 10%`);
        root.style.setProperty('--foreground', '210 40% 98%');
        // Popover
        root.style.setProperty('--popover', `${h} ${Math.min(s, 25)}% 13%`);
        root.style.setProperty('--popover-foreground', '210 40% 98%');
        // Sidebar
        root.style.setProperty('--sidebar-background', `${h} ${Math.min(s, 20)}% 9%`);
        root.style.setProperty('--sidebar-foreground', '210 40% 98%');
        root.style.setProperty('--sidebar-primary', theme.hsl);
        root.style.setProperty('--sidebar-primary-foreground', needsDarkFg ? '222 47% 11%' : '0 0% 100%');
        root.style.setProperty('--sidebar-accent', `${h} ${Math.min(s, 20)}% 18%`);
        root.style.setProperty('--sidebar-accent-foreground', '210 40% 98%');
        root.style.setProperty('--sidebar-border', `${h} ${Math.min(s, 25)}% 22%`);
        root.style.setProperty('--sidebar-ring', theme.hsl);
        // Fintech vars
        root.style.setProperty('--fintech-accent', theme.hsl);
      } else {
        // Light mode
        root.style.setProperty('--border', `${h} ${Math.min(s, 30)}% 88%`);
        root.style.setProperty('--input', `${h} ${Math.min(s, 25)}% 90%`);
        root.style.setProperty('--card', `${h} ${Math.min(s, 15)}% 99%`);
        root.style.setProperty('--card-foreground', '222 47% 11%');
        root.style.setProperty('--secondary', `${h} ${Math.min(s, 30)}% 95%`);
        root.style.setProperty('--secondary-foreground', '222 47% 11%');
        root.style.setProperty('--muted', `${h} ${Math.min(s, 20)}% 96%`);
        root.style.setProperty('--muted-foreground', `${h} ${Math.min(s, 15)}% 40%`);
        root.style.setProperty('--background', `${h} ${Math.min(s, 15)}% 100%`);
        root.style.setProperty('--foreground', '222 47% 11%');
        root.style.setProperty('--popover', `${h} ${Math.min(s, 15)}% 99%`);
        root.style.setProperty('--popover-foreground', '222 47% 11%');
        // Sidebar
        root.style.setProperty('--sidebar-background', `${h} ${Math.min(s, 20)}% 97%`);
        root.style.setProperty('--sidebar-foreground', '222 47% 11%');
        root.style.setProperty('--sidebar-primary', theme.hsl);
        root.style.setProperty('--sidebar-primary-foreground', needsDarkFg ? '222 47% 11%' : '0 0% 100%');
        root.style.setProperty('--sidebar-accent', `${h} ${Math.min(s, 25)}% 93%`);
        root.style.setProperty('--sidebar-accent-foreground', '222 47% 11%');
        root.style.setProperty('--sidebar-border', `${h} ${Math.min(s, 25)}% 90%`);
        root.style.setProperty('--sidebar-ring', theme.hsl);
        root.style.setProperty('--fintech-accent', theme.hsl);
      }
    } else {
      // Reset all overrides
      const props = [
        '--primary', '--accent', '--ring', '--primary-foreground', '--accent-foreground',
        '--border', '--input', '--card', '--card-foreground', '--secondary', '--secondary-foreground',
        '--muted', '--muted-foreground', '--background', '--foreground', '--popover', '--popover-foreground',
        '--sidebar-background', '--sidebar-foreground', '--sidebar-primary', '--sidebar-primary-foreground',
        '--sidebar-accent', '--sidebar-accent-foreground', '--sidebar-border', '--sidebar-ring',
        '--fintech-accent',
      ];
      props.forEach(p => root.style.removeProperty(p));
    }
  }, [colorTheme]);

  // Re-apply when dark/light mode changes
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === 'class') {
          // Re-trigger theme application by toggling state
          setColorThemeState(prev => {
            // Force re-run of the theme effect
            const theme = COLOR_THEMES.find(t => t.name === prev);
            if (theme) {
              const root = document.documentElement;
              const { h, s, l } = parseHSL(theme.hsl);
              const isDark = root.classList.contains('dark');
              const needsDarkFg = l > 65 || (s < 30 && l > 50);

              root.style.setProperty('--primary', theme.hsl);
              root.style.setProperty('--accent', theme.hsl);
              root.style.setProperty('--ring', theme.hsl);
              root.style.setProperty('--primary-foreground', needsDarkFg ? '222 47% 11%' : '0 0% 100%');
              root.style.setProperty('--accent-foreground', needsDarkFg ? '222 47% 11%' : '0 0% 100%');

              if (isDark) {
                root.style.setProperty('--border', `${h} ${Math.min(s, 30)}% 25%`);
                root.style.setProperty('--input', `${h} ${Math.min(s, 20)}% 20%`);
                root.style.setProperty('--card', `${h} ${Math.min(s, 25)}% 14%`);
                root.style.setProperty('--card-foreground', '210 40% 98%');
                root.style.setProperty('--secondary', `${h} ${Math.min(s, 20)}% 18%`);
                root.style.setProperty('--secondary-foreground', '210 40% 98%');
                root.style.setProperty('--muted', `${h} ${Math.min(s, 15)}% 18%`);
                root.style.setProperty('--muted-foreground', `${h} ${Math.min(s, 15)}% 60%`);
                root.style.setProperty('--background', `${h} ${Math.min(s, 20)}% 10%`);
                root.style.setProperty('--foreground', '210 40% 98%');
                root.style.setProperty('--popover', `${h} ${Math.min(s, 25)}% 13%`);
                root.style.setProperty('--popover-foreground', '210 40% 98%');
                root.style.setProperty('--sidebar-background', `${h} ${Math.min(s, 20)}% 9%`);
                root.style.setProperty('--sidebar-foreground', '210 40% 98%');
                root.style.setProperty('--sidebar-primary', theme.hsl);
                root.style.setProperty('--sidebar-accent', `${h} ${Math.min(s, 20)}% 18%`);
                root.style.setProperty('--sidebar-accent-foreground', '210 40% 98%');
                root.style.setProperty('--sidebar-border', `${h} ${Math.min(s, 25)}% 22%`);
              } else {
                root.style.setProperty('--border', `${h} ${Math.min(s, 30)}% 88%`);
                root.style.setProperty('--input', `${h} ${Math.min(s, 25)}% 90%`);
                root.style.setProperty('--card', `${h} ${Math.min(s, 15)}% 99%`);
                root.style.setProperty('--card-foreground', '222 47% 11%');
                root.style.setProperty('--secondary', `${h} ${Math.min(s, 30)}% 95%`);
                root.style.setProperty('--secondary-foreground', '222 47% 11%');
                root.style.setProperty('--muted', `${h} ${Math.min(s, 20)}% 96%`);
                root.style.setProperty('--muted-foreground', `${h} ${Math.min(s, 15)}% 40%`);
                root.style.setProperty('--background', `${h} ${Math.min(s, 15)}% 100%`);
                root.style.setProperty('--foreground', '222 47% 11%');
                root.style.setProperty('--popover', `${h} ${Math.min(s, 15)}% 99%`);
                root.style.setProperty('--popover-foreground', '222 47% 11%');
                root.style.setProperty('--sidebar-background', `${h} ${Math.min(s, 20)}% 97%`);
                root.style.setProperty('--sidebar-foreground', '222 47% 11%');
                root.style.setProperty('--sidebar-primary', theme.hsl);
                root.style.setProperty('--sidebar-accent', `${h} ${Math.min(s, 25)}% 93%`);
                root.style.setProperty('--sidebar-accent-foreground', '222 47% 11%');
                root.style.setProperty('--sidebar-border', `${h} ${Math.min(s, 25)}% 90%`);
              }
              root.style.setProperty('--sidebar-ring', theme.hsl);
              root.style.setProperty('--fintech-accent', theme.hsl);
            }
            return prev;
          });
        }
      }
    });

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

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
