import {
  ClipboardCheck,
  FileSearch,
  FileText,
  Gavel,
  LucideIcon,
  MessageSquare,
  ScrollText,
  UserPlus,
  Users,
  Wallet,
  Wrench,
} from 'lucide-react';

export type AdminQuickAction = {
  to: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

export const ADMIN_QUICK_ACTIONS: AdminQuickAction[] = [
  {
    to: '/admin/clients',
    label: 'View All Clients',
    description: 'Open the full client registry and management table.',
    icon: Users,
  },
  {
    to: '/admin/clients/new',
    label: 'Add Client',
    description: 'Create a new client record and start onboarding.',
    icon: UserPlus,
  },
  {
    to: '/admin/documents',
    label: 'Review Documents',
    description: 'Check uploaded identity, address, and support files.',
    icon: ClipboardCheck,
  },
  {
    to: '/admin/reports',
    label: 'Review Reports',
    description: 'Open uploaded credit reports for admin review.',
    icon: FileSearch,
  },
  {
    to: '/admin/disputes',
    label: 'Manage Disputes',
    description: 'Track active dispute rounds and next actions.',
    icon: Gavel,
  },
  {
    to: '/admin/payments',
    label: 'View Payments',
    description: 'Review payment status, history, and issues.',
    icon: Wallet,
  },
  {
    to: '/admin/agreements',
    label: 'View Agreements',
    description: 'Track signature status and agreement records.',
    icon: ScrollText,
  },
  {
    to: '/admin/activity',
    label: 'Activity Center',
    description: 'Monitor recent client and admin workflow events.',
    icon: MessageSquare,
  },
  {
    to: '/admin/verification-report',
    label: 'Verification Report',
    description: 'Open the operational verification and status report.',
    icon: FileText,
  },
  {
    to: '/admin/tools',
    label: 'Admin Tools',
    description: 'Access internal tools and system controls.',
    icon: Wrench,
  },
];

export const ADMIN_COMMAND_CENTER_ACTIONS = ADMIN_QUICK_ACTIONS;
