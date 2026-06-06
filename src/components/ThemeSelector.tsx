import { useTheme } from 'next-themes';
import { useThemeConfig, COLOR_THEMES } from '@/contexts/ThemeContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Palette, Sun, Moon, Monitor, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const { colorTheme, setColorTheme } = useThemeConfig();

  const modes = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
          aria-label="Open theme settings"
        >
          <Palette className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[340px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle>Theme Settings</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          {/* Mode Selection */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Appearance</h4>
            <div className="grid grid-cols-3 gap-2">
              {modes.map(({ value, label, icon: Icon }) => (
                <Button
                  key={value}
                  variant={theme === value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme(value)}
                  className="flex flex-col gap-1 h-auto py-3"
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs">{label}</span>
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Color Theme Selection */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Accent Color</h4>
            <div className="grid grid-cols-8 gap-2">
              {COLOR_THEMES.map((t) => (
                <button
                  key={t.name}
                  onClick={() => setColorTheme(t.name)}
                  className={cn(
                    'w-8 h-8 rounded-full relative flex items-center justify-center transition-all duration-200 hover:scale-110',
                    colorTheme === t.name && 'ring-2 ring-offset-2 ring-offset-background ring-foreground'
                  )}
                  style={{ backgroundColor: t.color }}
                  title={t.name}
                >
                  {colorTheme === t.name && (
                    <Check className="h-3.5 w-3.5 text-white drop-shadow-md" />
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Current: <span className="font-medium text-foreground">{colorTheme}</span>
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
