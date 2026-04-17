import { Users, Upload, ListChecks, FileText, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  active: string;
  onSelect: (s: string) => void;
  onMore: () => void;
}

const ITEMS = [
  { id: 'war-board', label: 'War Board', icon: Users },
  { id: 'credit-upload', label: 'Upload', icon: Upload },
  { id: 'tasks', label: 'Tasks', icon: ListChecks },
  { id: 'documents', label: 'Docs', icon: FileText },
];

export function AdminMobileNav({ active, onSelect, onMore }: Props) {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border safe-area-bottom">
      <div className="grid grid-cols-5 gap-1 px-1 py-1.5">
        {ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className={cn(
              'flex flex-col items-center justify-center gap-1 min-h-[56px] rounded-lg px-1 py-1.5 transition-colors',
              active === id
                ? 'bg-primary/15 text-primary'
                : 'text-muted-foreground hover:text-foreground active:bg-accent/30'
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-medium leading-none">{label}</span>
          </button>
        ))}
        <button
          onClick={onMore}
          className="flex flex-col items-center justify-center gap-1 min-h-[56px] rounded-lg px-1 py-1.5 text-muted-foreground hover:text-foreground active:bg-accent/30"
        >
          <Menu className="h-5 w-5" />
          <span className="text-[10px] font-medium leading-none">More</span>
        </button>
      </div>
    </nav>
  );
}
