import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, BarChart3, Vault, Wallet, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

const ITEMS = [
  { id: 'home',    label: 'Home',    icon: LayoutDashboard, to: '/client/dashboard' },
  { id: 'scores',  label: 'Scores',  icon: BarChart3,       to: '/client/results' },
  { id: 'vault',   label: 'Vault',   icon: Vault,           to: '/client/documents' },
  { id: 'billing', label: 'Account', icon: Wallet,          to: '/client/payments' },
  { id: 'inbox',   label: 'Inbox',   icon: Bell,            to: '/client/messages' },
];

/**
 * Native-feel bottom tab bar (Experian/Amex/Chase app pattern).
 * Renders only on mobile; desktop continues to use the shadcn sidebar.
 */
export function ClientMobileNav() {
  const { pathname } = useLocation();
  return (
    <nav
      aria-label="Portal sections"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border safe-area-bottom"
    >
      <span aria-hidden className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-gold-deep/50 to-transparent" />
      <ul className="grid grid-cols-5 gap-1 px-2 py-1.5">
        {ITEMS.map((it) => {
          const active = pathname === it.to || pathname.startsWith(it.to + '/');
          return (
            <li key={it.id}>
              <NavLink
                to={it.to}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-1 min-h-[56px] rounded-xl px-1 py-1.5 transition-colors',
                  active
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground active:bg-secondary/40',
                )}
              >
                {active && (
                  <span
                    aria-hidden
                    className="absolute top-0 left-1/2 -translate-x-1/2 h-[3px] w-8 rounded-b-full bg-gradient-gold"
                  />
                )}
                <it.icon className={cn('h-5 w-5', active && 'text-gold-deep')} />
                <span className={cn('text-[10px] leading-none', active ? 'font-semibold' : 'font-medium')}>
                  {it.label}
                </span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}