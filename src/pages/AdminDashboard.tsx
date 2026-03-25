import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRoles } from '@/hooks/useRoles';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  Crown, FileText, Upload, Mail, Settings, Users, Activity, ExternalLink,
  Shield, Search, Download, Eye, LayoutDashboard, ClipboardCheck, GitBranch,
  Brain, Cpu, FileSearch, Menu, LogOut, Zap, AlertTriangle, Bot, Gavel, Pencil
} from 'lucide-react';
import { AutomationControlCenter } from '@/components/AutomationControlCenter';
import { AdminCreditReportManager } from '@/components/AdminCreditReportManager';
import { BacklogOverview } from '@/components/BacklogOverview';
import { AdminReviewQueue } from '@/components/AdminReviewQueue';
import { CasePipelineDashboard } from '@/components/CasePipelineDashboard';
import { AIAnalysisViewer } from '@/components/AIAnalysisViewer';
import { AdminAIControlPanel } from '@/components/AdminAIControlPanel';
import { ThemeSelector } from '@/components/ThemeSelector';
import { AdminBacklogTools } from '@/components/AdminBacklogTools';
import { ClientProcessingGrid } from '@/components/ClientProcessingGrid';
import { BulkDocumentIntelligence } from '@/components/BulkDocumentIntelligence';
import { cn } from '@/lib/utils';
import { AutonomousControlPanel } from '@/components/AutonomousControlPanel';
import { DisputeCommandCenter } from '@/components/DisputeCommandCenter';
import { AdminClientEditor } from '@/components/AdminClientEditor';
import { CIPExecutionCenter } from '@/components/CIPExecutionCenter';

interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  plan_type?: string;
  payment_status?: string;
  subscription_status?: string;
}

interface DisputeRecord {
  id: string;
  user_id: string;
  creditor_name: string;
  account_number: string;
  issue_type: string;
  created_at: string;
  generated_letter: string | null;
  user_email?: string;
  status?: string;
}

interface NotificationLog {
  id: string;
  notification_type: string;
  user_id: string;
  email_sent: boolean;
  created_at: string;
  details: any;
}

type Section = 'overview' | 'review-queue' | 'pipeline' | 'ai-analysis' | 'ai-ops' | 'backlog' | 'processing' | 'bulk-docs' | 'autonomous' | 'dispute-command' | 'automation' | 'ai-execution' | 'users' | 'membership' | 'disputes' | 'documents' | 'credit-reports' | 'email' | 'system';

const NAV_ITEMS: { section: Section; label: string; icon: any; group: string }[] = [
  // ⚡ PRIORITY TOOLS — top of sidebar for instant access
  { section: 'review-queue', label: 'Review Queue', icon: ClipboardCheck, group: 'PRIORITY' },
  { section: 'processing', label: 'Processing Grid', icon: Activity, group: 'PRIORITY' },
  { section: 'pipeline', label: 'Pipeline', icon: GitBranch, group: 'PRIORITY' },
  { section: 'documents', label: 'Documents', icon: Upload, group: 'PRIORITY' },
  { section: 'autonomous', label: 'Autonomous Mode', icon: Bot, group: 'PRIORITY' },
  { section: 'dispute-command', label: 'Dispute Command', icon: Gavel, group: 'PRIORITY' },
  { section: 'automation', label: 'Automation Center', icon: Zap, group: 'PRIORITY' },
  { section: 'ai-execution', label: 'AI Execution', icon: Cpu, group: 'PRIORITY' },

  { section: 'overview', label: 'Dashboard', icon: LayoutDashboard, group: 'OVERVIEW' },
  { section: 'backlog', label: 'Backlog Tools', icon: Zap, group: 'WORKFLOW' },
  { section: 'processing', label: 'Processing Grid', icon: Activity, group: 'WORKFLOW' },
  { section: 'bulk-docs', label: 'Bulk Doc Intel', icon: FileSearch, group: 'WORKFLOW' },
  { section: 'review-queue', label: 'Review Queue', icon: ClipboardCheck, group: 'WORKFLOW' },
  { section: 'pipeline', label: 'Pipeline', icon: GitBranch, group: 'WORKFLOW' },
  { section: 'ai-analysis', label: 'AI Analysis', icon: Brain, group: 'WORKFLOW' },
  { section: 'autonomous', label: 'Autonomous Mode', icon: Bot, group: 'WORKFLOW' },
  { section: 'dispute-command', label: 'Dispute Command', icon: Gavel, group: 'WORKFLOW' },
  { section: 'automation', label: 'Automation Center', icon: Zap, group: 'WORKFLOW' },
  { section: 'ai-execution', label: 'AI Execution Center', icon: Cpu, group: 'WORKFLOW' },
  { section: 'ai-ops', label: 'AI Ops', icon: Cpu, group: 'OPERATIONS' },
  { section: 'users', label: 'Clients', icon: Users, group: 'MANAGEMENT' },
  { section: 'membership', label: 'Membership', icon: Crown, group: 'MANAGEMENT' },
  { section: 'disputes', label: 'Disputes', icon: FileText, group: 'MANAGEMENT' },
  { section: 'documents', label: 'Documents', icon: Upload, group: 'MANAGEMENT' },
  { section: 'credit-reports', label: 'Credit Reports', icon: FileSearch, group: 'MANAGEMENT' },
  { section: 'email', label: 'Email', icon: Mail, group: 'OPERATIONS' },
  { section: 'system', label: 'System', icon: Settings, group: 'OPERATIONS' },
];

// Command Center card definitions
const COMMAND_CARDS = [
  {
    title: 'Backlog Processing Center',
    desc: 'Client Processing Grid, Review Queue, Pipeline',
    icon: Zap,
    accent: 'text-red-500 bg-red-500/10 border-red-500/20',
    mainSection: 'backlog' as Section,
    subLinks: [
      { label: 'Processing Grid', section: 'processing' as Section },
      { label: 'Review Queue', section: 'review-queue' as Section },
      { label: 'Pipeline', section: 'pipeline' as Section },
    ],
  },
  {
    title: 'AI Ops Center',
    desc: 'AI Analysis, AI Control Panel',
    icon: Brain,
    accent: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
    mainSection: 'ai-analysis' as Section,
    subLinks: [
      { label: 'AI Analysis', section: 'ai-analysis' as Section },
      { label: 'AI Ops', section: 'ai-ops' as Section },
    ],
  },
  {
    title: 'Document Intelligence',
    desc: 'Document Management, Bulk Upload System',
    icon: FileSearch,
    accent: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    mainSection: 'documents' as Section,
    subLinks: [
      { label: 'Documents', section: 'documents' as Section },
      { label: 'Bulk Doc Intel', section: 'bulk-docs' as Section },
    ],
  },
  {
    title: 'Client Management',
    desc: 'Client List, Profiles, Membership',
    icon: Users,
    accent: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    mainSection: 'users' as Section,
    subLinks: [
      { label: 'Clients', section: 'users' as Section },
      { label: 'Membership', section: 'membership' as Section },
    ],
  },
  {
    title: 'System Control',
    desc: 'Admin Settings, Admin Tools, Email',
    icon: Settings,
    accent: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    mainSection: 'system' as Section,
    subLinks: [
      { label: 'System', section: 'system' as Section },
      { label: 'Email', section: 'email' as Section },
    ],
  },
  {
    title: 'Autonomous Processing',
    desc: 'AI Background Processing, Auto-Match, Review Queue',
    icon: Bot,
    accent: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    mainSection: 'autonomous' as Section,
    subLinks: [
      { label: 'Autonomous Mode', section: 'autonomous' as Section },
      { label: 'AI Analysis', section: 'ai-analysis' as Section },
    ],
  },
  {
    title: 'Dispute Command Center',
    desc: 'AI Dispute Generation, Letter Management, Status Tracking',
    icon: Gavel,
    accent: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    mainSection: 'dispute-command' as Section,
    subLinks: [
      { label: 'Dispute Command', section: 'dispute-command' as Section },
      { label: 'Disputes', section: 'disputes' as Section },
    ],
  },
  {
    title: 'Automation Control Center',
    desc: 'Events, Notifications, Predictions, Templates',
    icon: Zap,
    accent: 'text-green-500 bg-green-500/10 border-green-500/20',
    mainSection: 'automation' as Section,
    subLinks: [
      { label: 'Automation Center', section: 'automation' as Section },
      { label: 'Email', section: 'email' as Section },
    ],
  },
  {
    title: 'AI Execution Center',
    desc: 'CIP Engine, Multi-Agent Workflows, Strategy Decisions',
    icon: Cpu,
    accent: 'text-violet-500 bg-violet-500/10 border-violet-500/20',
    mainSection: 'ai-execution' as Section,
    subLinks: [
      { label: 'CIP Center', section: 'ai-execution' as Section },
      { label: 'AI Analysis', section: 'ai-analysis' as Section },
      { label: 'Dispute Command', section: 'dispute-command' as Section },
    ],
  },
];

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const { isAdmin, loading: rolesLoading } = useRoles();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [disputes, setDisputes] = useState<DisputeRecord[]>([]);
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editModeEnabled, setEditModeEnabled] = useState(false);
  const [activeSection, setActiveSectionState] = useState<Section>(() => {
    const params = new URLSearchParams(window.location.search);
    return (params.get('section') as Section) || 'overview';
  });
  const [liveCounts, setLiveCounts] = useState({ total: 0, inProgress: 0, needsReview: 0, completed: 0 });
  const [editingClientId, setEditingClientId] = useState<string | null>(null);

  const setActiveSection = (s: Section) => {
    setActiveSectionState(s);
    const url = new URL(window.location.href);
    url.searchParams.set('section', s);
    window.history.replaceState({}, '', url.toString());
  };

  useEffect(() => {
    const handler = (e: Event) => {
      const section = (e as CustomEvent).detail as Section;
      if (section) setActiveSection(section);
    };
    window.addEventListener('admin-set-section', handler);
    return () => window.removeEventListener('admin-set-section', handler);
  }, []);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [emailForm, setEmailForm] = useState({ recipient: '', subject: '', message: '' });

  useEffect(() => {
    if (!rolesLoading && !isAdmin()) {
      navigate('/');
      return;
    }
    if (isAdmin()) fetchAdminData();
  }, [isAdmin, rolesLoading, navigate]);

  const fetchAdminData = async () => {
    try {
      const { data: usersData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      setUsers(usersData || []);

      const { data: disputesData } = await supabase.from('dispute_letters').select('*').order('created_at', { ascending: false });
      const disputesWithEmails = await Promise.all(
        (disputesData || []).map(async (dispute) => {
          const { data: profile } = await supabase.from('profiles').select('email').eq('user_id', dispute.user_id).single();
          return { ...dispute, user_email: profile?.email || 'Unknown', status: dispute.generated_letter ? 'Completed' : 'Pending' };
        })
      );
      setDisputes(disputesWithEmails);

      const { data: notificationsData } = await supabase.from('notification_logs').select('*').order('created_at', { ascending: false }).limit(50);
      setNotifications(notificationsData || []);

      // Fetch live processing counts
      fetchLiveCounts(usersData || [], disputesWithEmails);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({ title: "Error", description: "Failed to load admin data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveCounts = async (usersArr: AdminUser[], disputesArr: DisputeRecord[]) => {
    try {
      const { count: flaggedCount } = await supabase
        .from('flagged_disputes')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { count: reviewCount } = await supabase
        .from('dispute_letters')
        .select('*', { count: 'exact', head: true })
        .eq('case_status', 'needs_admin_review');

      const completedLetters = disputesArr.filter(d => d.generated_letter).length;

      setLiveCounts({
        total: usersArr.length,
        inProgress: disputesArr.length - completedLetters,
        needsReview: (flaggedCount || 0) + (reviewCount || 0),
        completed: completedLetters,
      });
    } catch {
      // fallback
      setLiveCounts({
        total: usersArr.length,
        inProgress: disputesArr.filter(d => !d.generated_letter).length,
        needsReview: 0,
        completed: disputesArr.filter(d => d.generated_letter).length,
      });
    }
  };

  const sendEmailNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.functions.invoke('send-notification-email', {
        body: { to: emailForm.recipient, subject: emailForm.subject, message: emailForm.message, from_admin: true }
      });
      if (error) throw error;
      toast({ title: "Success", description: "Email sent successfully" });
      setEmailForm({ recipient: '', subject: '', message: '' });
    } catch (error) {
      toast({ title: "Error", description: "Failed to send email", variant: "destructive" });
    }
  };

  const filteredUsers = users.filter(u => u.email.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredDisputes = disputes.filter(d => d.creditor_name.toLowerCase().includes(searchTerm.toLowerCase()) || d.user_email?.toLowerCase().includes(searchTerm.toLowerCase()));

  if (rolesLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md px-4">
          <Skeleton className="h-8 w-3/4 mx-auto" />
          <Skeleton className="h-4 w-1/2 mx-auto" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin()) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don't have permission to access the admin dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">Return to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sidebarGroups = ['PRIORITY', 'OVERVIEW', 'WORKFLOW', 'MANAGEMENT', 'OPERATIONS'];

  // Deduplicate sidebar items per group (PRIORITY duplicates from WORKFLOW intentionally)
  const renderedSections = new Set<string>();

  const SidebarNav = ({ onItemClick }: { onItemClick?: () => void }) => {
    const rendered = new Set<string>();
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Crown className="h-6 w-6 text-primary" />
            <div>
              <h2 className="font-poppins font-bold text-foreground text-sm">Admin Panel</h2>
              <p className="text-xs text-muted-foreground">Express Credit CRM</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-2 space-y-4 overflow-y-auto">
          {sidebarGroups.map(group => {
            const items = NAV_ITEMS.filter(i => i.group === group);
            if (items.length === 0) return null;
            return (
              <div key={group}>
                <p className="section-label px-3 mb-1">
                  {group === 'PRIORITY' ? '⚡ PRIORITY TOOLS' : group}
                </p>
                {group === 'PRIORITY' && (
                  <div className="mx-3 mb-2 h-px bg-primary/30" />
                )}
                <div className="space-y-0.5">
                  {items.map((item, idx) => {
                    const key = `${group}-${item.section}-${idx}`;
                    const Icon = item.icon;
                    const active = activeSection === item.section;
                    return (
                      <button
                        key={key}
                        onClick={() => { setActiveSection(item.section); onItemClick?.(); }}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all',
                          active
                            ? 'bg-accent/10 text-foreground border-l-2 border-primary font-medium'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent/5',
                          group === 'PRIORITY' && !active && 'font-medium text-foreground/80'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border space-y-2">
          <div className="flex items-center gap-2">
            <ThemeSelector />
            <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut} className="w-full justify-start text-muted-foreground">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-border bg-card flex-col flex-shrink-0">
        <SidebarNav />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarNav onItemClick={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center px-4 gap-4 sticky top-0 z-30">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="font-poppins font-semibold text-foreground">
            {NAV_ITEMS.find(i => i.section === activeSection)?.label || 'Dashboard'}
          </h1>
          <div className="ml-auto text-xs text-muted-foreground hidden sm:block">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </header>

        {/* ═══ PINNED ACTION BAR — always visible ═══ */}
        <div className="sticky top-14 z-20 bg-card border-b border-border px-4 py-2 flex items-center gap-2 overflow-x-auto">
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 border-primary/30 hover:bg-primary/10"
            onClick={() => setActiveSection('bulk-docs')}
          >
            <Upload className="h-4 w-4 mr-1.5" />
            Upload Documents
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 border-red-500/30 hover:bg-red-500/10 text-red-600 dark:text-red-400"
            onClick={() => setActiveSection('backlog')}
          >
            <Zap className="h-4 w-4 mr-1.5" />
            Process Backlog
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 border-cyan-500/30 hover:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
            onClick={() => setActiveSection('ai-analysis')}
          >
            <Brain className="h-4 w-4 mr-1.5" />
            Run AI Analysis
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 border-orange-500/30 hover:bg-orange-500/10 text-orange-600 dark:text-orange-400"
            onClick={() => setActiveSection('review-queue')}
          >
            <ClipboardCheck className="h-4 w-4 mr-1.5" />
            Open Review Queue
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 border-purple-500/30 hover:bg-purple-500/10 text-purple-600 dark:text-purple-400"
            onClick={() => setActiveSection('autonomous')}
          >
            <Bot className="h-4 w-4 mr-1.5" />
            Autonomous Mode
           </Button>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 border-amber-500/30 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400"
            onClick={() => setActiveSection('dispute-command')}
          >
            <Gavel className="h-4 w-4 mr-1.5" />
            Generate Disputes
           </Button>
           <Button
            size="sm"
            variant="outline"
            className="shrink-0 border-green-500/30 hover:bg-green-500/10 text-green-600 dark:text-green-400"
            onClick={() => setActiveSection('automation')}
          >
            <Zap className="h-4 w-4 mr-1.5" />
            Automation Center
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 border-violet-500/30 hover:bg-violet-500/10 text-violet-600 dark:text-violet-400"
            onClick={() => setActiveSection('ai-execution')}
          >
            <Cpu className="h-4 w-4 mr-1.5" />
            AI Execution
          </Button>
          {liveCounts.needsReview > 0 && (
            <Badge variant="destructive" className="shrink-0 ml-auto animate-pulse">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {liveCounts.needsReview} Waiting Action
            </Badge>
          )}
        </div>

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {/* ═══ OVERVIEW — COMMAND CENTER ═══ */}
          {activeSection === 'overview' && (
            <div className="space-y-6 animate-fade-in">

              {/* Block A: Live Processing Overview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">Live Processing Overview</h2>
                  {liveCounts.needsReview > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      🔥 {liveCounts.needsReview} Clients Waiting Action
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { label: 'Total Clients', value: liveCounts.total, icon: Users, color: 'text-blue-500 bg-blue-500/10' },
                    { label: 'In Progress', value: liveCounts.inProgress, icon: Activity, color: 'text-amber-500 bg-amber-500/10' },
                    { label: 'Needs Review', value: liveCounts.needsReview, icon: AlertTriangle, color: 'text-red-500 bg-red-500/10', highlight: liveCounts.needsReview > 0 },
                    { label: 'Completed', value: liveCounts.completed, icon: ClipboardCheck, color: 'text-green-500 bg-green-500/10' },
                  ].map(stat => {
                    const Icon = stat.icon;
                    return (
                      <Card key={stat.label} className={cn('glass-card-hover', stat.highlight && 'border-red-500/30 bg-red-500/5')}>
                        <CardContent className="pt-5 pb-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="section-label text-xs">{stat.label}</p>
                              <p className="stat-number mt-1 text-2xl">{stat.value}</p>
                            </div>
                            <div className={cn('rounded-lg p-2.5', stat.color)}>
                              <Icon className="h-5 w-5" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Block B: Admin Command Center Cards */}
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground">Admin Command Center</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {COMMAND_CARDS.map(card => {
                    const Icon = card.icon;
                    return (
                      <button
                        key={card.title}
                        onClick={() => setActiveSection(card.mainSection)}
                        className={cn(
                          'group text-left rounded-xl border bg-card p-5 transition-all hover:shadow-md hover:border-primary/30',
                          card.accent.split(' ').pop() // border color
                        )}
                      >
                        <div className="flex items-start gap-4">
                          <div className={cn('rounded-xl p-3 shrink-0', card.accent)}>
                            <Icon className="h-6 w-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm">
                              {card.title}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">{card.desc}</p>
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {card.subLinks.map(sub => (
                                <span
                                  key={sub.label}
                                  onClick={(e) => { e.stopPropagation(); setActiveSection(sub.section); }}
                                  className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary cursor-pointer transition-colors"
                                >
                                  {sub.label}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Block C: Existing BacklogOverview + quick external links */}
              <BacklogOverview />

              <div className="flex flex-wrap gap-2 pt-2">
                <Button onClick={() => navigate('/dispute-center')} variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />Dispute Center
                </Button>
                <Button onClick={() => navigate('/admin/clients')} variant="outline" size="sm">
                  <Users className="h-4 w-4 mr-2" />Client Portals
                </Button>
                <Button onClick={() => navigate('/admin/tools')} variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />Admin Tools
                </Button>
                <Button onClick={() => setEditModeEnabled(!editModeEnabled)} variant={editModeEnabled ? "destructive" : "outline"} size="sm">
                  <Settings className="h-4 w-4 mr-2" />{editModeEnabled ? 'Disable' : 'Enable'} Edit Mode
                </Button>
              </div>
            </div>
          )}

          {activeSection === 'review-queue' && <div className="animate-fade-in"><AdminReviewQueue /></div>}
          {activeSection === 'pipeline' && <div className="animate-fade-in"><CasePipelineDashboard /></div>}
          {activeSection === 'ai-analysis' && <div className="animate-fade-in"><AIAnalysisViewer isAdmin /></div>}
          {activeSection === 'ai-ops' && <div className="animate-fade-in"><AdminAIControlPanel /></div>}
          {activeSection === 'backlog' && <div className="animate-fade-in"><AdminBacklogTools /></div>}
          {activeSection === 'processing' && <div className="animate-fade-in"><ClientProcessingGrid /></div>}
          {activeSection === 'bulk-docs' && <div className="animate-fade-in"><BulkDocumentIntelligence /></div>}
          {activeSection === 'autonomous' && <div className="animate-fade-in"><AutonomousControlPanel /></div>}
          {activeSection === 'dispute-command' && <div className="animate-fade-in"><DisputeCommandCenter /></div>}
          {activeSection === 'automation' && <div className="animate-fade-in"><AutomationControlCenter /></div>}

          {/* Users */}
          {activeSection === 'users' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search by email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
                </div>
                <Button onClick={fetchAdminData} variant="outline">Refresh</Button>
              </div>
              <Card className="glass-card">
                <CardHeader><CardTitle>User Management</CardTitle><CardDescription>Manage client accounts</CardDescription></CardHeader>
                <CardContent>
                  {/* Desktop table */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow><TableHead>Email</TableHead><TableHead>Plan</TableHead><TableHead>Status</TableHead><TableHead>Joined</TableHead><TableHead>Actions</TableHead></TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((u) => (
                          <TableRow key={u.id}>
                            <TableCell className="font-medium">{u.email}</TableCell>
                            <TableCell><Badge variant="outline">{u.plan_type || 'None'}</Badge></TableCell>
                            <TableCell><Badge variant={u.payment_status === 'active' ? 'default' : 'secondary'}>{u.payment_status || 'Inactive'}</Badge></TableCell>
                            <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                            <TableCell><div className="flex gap-1"><Button size="sm" variant="outline"><Eye className="h-4 w-4" /></Button><Button size="sm" variant="outline" onClick={() => setEditingClientId(u.id)}><Pencil className="h-4 w-4" /></Button></div></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {/* Mobile cards */}
                  <div className="md:hidden space-y-3">
                    {filteredUsers.map(u => (
                      <Card key={u.id} className="glass-card-hover">
                        <CardContent className="pt-4">
                          <p className="font-medium text-sm">{u.email}</p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline">{u.plan_type || 'None'}</Badge>
                            <Badge variant={u.payment_status === 'active' ? 'default' : 'secondary'}>{u.payment_status || 'Inactive'}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{new Date(u.created_at).toLocaleDateString()}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Membership */}
          {activeSection === 'membership' && (
            <div className="space-y-6 animate-fade-in">
              <Card className="glass-card">
                <CardHeader><CardTitle>Membership Management</CardTitle><CardDescription>Assign, upgrade, or downgrade user tiers</CardDescription></CardHeader>
                <CardContent>
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow><TableHead>Email</TableHead><TableHead>Plan</TableHead><TableHead>Status</TableHead><TableHead>Assign</TableHead><TableHead>Toggle</TableHead><TableHead>VIP</TableHead></TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((u) => (
                          <TableRow key={u.id}>
                            <TableCell className="font-medium">{u.email}</TableCell>
                            <TableCell><Badge variant="outline">{u.plan_type || 'None'}</Badge></TableCell>
                            <TableCell><Badge variant={u.payment_status === 'active' ? 'default' : 'secondary'}>{u.payment_status || 'Inactive'}</Badge></TableCell>
                            <TableCell>
                              <Select defaultValue={u.plan_type || ''} onValueChange={async (value) => {
                                const { error } = await supabase.from('profiles').update({ plan_type: value, payment_status: 'active' }).eq('id', u.id);
                                if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
                                else { toast({ title: 'Updated', description: `${u.email} → ${value}` }); fetchAdminData(); }
                              }}>
                                <SelectTrigger className="w-[100px]"><SelectValue placeholder="Select" /></SelectTrigger>
                                <SelectContent><SelectItem value="basic">Basic</SelectItem><SelectItem value="pro">Pro</SelectItem><SelectItem value="elite">Elite</SelectItem><SelectItem value="vip">VIP</SelectItem></SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Switch checked={u.payment_status === 'active'} onCheckedChange={async (checked) => {
                                const { error } = await supabase.from('profiles').update({ payment_status: checked ? 'active' : 'inactive' }).eq('id', u.id);
                                if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
                                else { toast({ title: 'Updated', description: `${u.email} → ${checked ? 'active' : 'inactive'}` }); fetchAdminData(); }
                              }} />
                            </TableCell>
                            <TableCell>
                              <Button size="sm" variant="outline" onClick={async () => {
                                const expiresAt = new Date(); expiresAt.setDate(expiresAt.getDate() + 14);
                                const { error } = await supabase.from('profiles').update({ membership_type: 'vip_trial', payment_status: 'active', plan_type: 'vip', expires_at: expiresAt.toISOString() }).eq('id', u.id);
                                if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
                                else { toast({ title: 'VIP Trial Granted', description: `${u.email} — 14-day VIP trial` }); fetchAdminData(); }
                              }}>Grant VIP</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="md:hidden space-y-3">
                    {filteredUsers.map(u => (
                      <Card key={u.id} className="glass-card-hover">
                        <CardContent className="pt-4 space-y-2">
                          <p className="font-medium text-sm">{u.email}</p>
                          <div className="flex gap-2"><Badge variant="outline">{u.plan_type || 'None'}</Badge><Badge variant={u.payment_status === 'active' ? 'default' : 'secondary'}>{u.payment_status || 'Inactive'}</Badge></div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Disputes */}
          {activeSection === 'disputes' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search by creditor or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
                </div>
                <Button onClick={fetchAdminData} variant="outline">Refresh</Button>
              </div>
              <Card className="glass-card">
                <CardHeader><CardTitle>Dispute Tracking</CardTitle></CardHeader>
                <CardContent>
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow><TableHead>User</TableHead><TableHead>Creditor</TableHead><TableHead>Account</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead><TableHead>Actions</TableHead></TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredDisputes.map((d) => (
                          <TableRow key={d.id}>
                            <TableCell className="font-medium">{d.user_email}</TableCell>
                            <TableCell>{d.creditor_name}</TableCell>
                            <TableCell>****{d.account_number?.slice(-4)}</TableCell>
                            <TableCell><Badge variant="outline">{d.issue_type}</Badge></TableCell>
                            <TableCell><Badge variant={d.status === 'Completed' ? 'default' : 'secondary'}>{d.status}</Badge></TableCell>
                            <TableCell>{new Date(d.created_at).toLocaleDateString()}</TableCell>
                            <TableCell><div className="flex gap-1"><Button size="sm" variant="outline">Complete</Button>{d.generated_letter && <Button size="sm" variant="outline"><Download className="h-4 w-4" /></Button>}</div></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="md:hidden space-y-3">
                    {filteredDisputes.map(d => (
                      <Card key={d.id} className="glass-card-hover">
                        <CardContent className="pt-4">
                          <p className="font-medium text-sm">{d.creditor_name}</p>
                          <p className="text-xs text-muted-foreground">{d.user_email}</p>
                          <div className="flex gap-2 mt-2"><Badge variant="outline">{d.issue_type}</Badge><Badge variant={d.status === 'Completed' ? 'default' : 'secondary'}>{d.status}</Badge></div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Documents */}
          {activeSection === 'documents' && (
            <div className="space-y-6 animate-fade-in">
              <Card className="glass-card">
                <CardHeader><CardTitle>Document Automation Center</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Upload PDF Templates</h3>
                    <p className="text-muted-foreground mb-4">Upload dispute letter templates for automatic generation</p>
                    <Button><Upload className="h-4 w-4 mr-2" />Choose Files</Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="glass-card"><CardHeader><CardTitle className="text-lg">Template Library</CardTitle></CardHeader><CardContent><div className="space-y-2"><div className="flex items-center justify-between p-2 border border-border rounded-lg"><span className="text-sm">Standard Dispute Letter</span><Badge>Active</Badge></div><div className="flex items-center justify-between p-2 border border-border rounded-lg"><span className="text-sm">Debt Validation Letter</span><Badge>Active</Badge></div><div className="flex items-center justify-between p-2 border border-border rounded-lg"><span className="text-sm">Cease & Desist Letter</span><Badge variant="secondary">Draft</Badge></div></div></CardContent></Card>
                    <Card className="glass-card"><CardHeader><CardTitle className="text-lg">Quick Generate</CardTitle></CardHeader><CardContent className="space-y-4"><div><Label>Select User</Label><Input placeholder="user@example.com" /></div><div><Label>Template</Label><Input placeholder="Standard Dispute Letter" /></div><Button className="w-full">Generate Letter</Button></CardContent></Card>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === 'credit-reports' && <div className="animate-fade-in"><AdminCreditReportManager /></div>}

          {/* Email */}
          {activeSection === 'email' && (
            <div className="space-y-6 animate-fade-in">
              <Card className="glass-card">
                <CardHeader><CardTitle>Email Control Panel</CardTitle><CardDescription>Send notifications to users</CardDescription></CardHeader>
                <CardContent>
                  <form onSubmit={sendEmailNotification} className="space-y-4">
                    <div><Label htmlFor="recipient">Recipient Email</Label><Input id="recipient" type="email" value={emailForm.recipient} onChange={(e) => setEmailForm(prev => ({ ...prev, recipient: e.target.value }))} placeholder="client@example.com" required /></div>
                    <div><Label htmlFor="subject">Subject</Label><Input id="subject" value={emailForm.subject} onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))} placeholder="Important update" required /></div>
                    <div><Label htmlFor="message">Message</Label><Textarea id="message" value={emailForm.message} onChange={(e) => setEmailForm(prev => ({ ...prev, message: e.target.value }))} placeholder="Enter your message..." rows={6} required /></div>
                    <Button type="submit" className="w-full"><Mail className="h-4 w-4 mr-2" />Send Email</Button>
                  </form>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardHeader><CardTitle>Recent Notifications</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>User</TableHead><TableHead>Status</TableHead><TableHead>Sent</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {notifications.slice(0, 10).map((n) => (
                        <TableRow key={n.id}>
                          <TableCell className="font-medium">{n.notification_type}</TableCell>
                          <TableCell className="truncate max-w-[100px]">{n.user_id}</TableCell>
                          <TableCell><Badge variant={n.email_sent ? 'default' : 'destructive'}>{n.email_sent ? 'Sent' : 'Failed'}</Badge></TableCell>
                          <TableCell>{new Date(n.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* System */}
          {activeSection === 'system' && (
            <div className="space-y-6 animate-fade-in">
              <Card className="glass-card">
                <CardHeader><CardTitle>System Settings</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div><Label className="text-base font-medium">Internal Edit Mode</Label><p className="text-sm text-muted-foreground">Show edit controls</p></div>
                    <Switch checked={editModeEnabled} onCheckedChange={setEditModeEnabled} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button onClick={() => window.open('https://supabase.com/dashboard/project/vctxvlkzoyqrwnletgsp', '_blank')} variant="outline"><ExternalLink className="h-4 w-4 mr-2" />Supabase Dashboard</Button>
                    <Button onClick={() => window.open('https://dashboard.stripe.com', '_blank')} variant="outline"><ExternalLink className="h-4 w-4 mr-2" />Stripe Dashboard</Button>
                    <Button onClick={() => navigate('/dispute-center')} variant="outline"><FileText className="h-4 w-4 mr-2" />Dispute Center</Button>
                    <Button onClick={() => navigate('/admin/settings')} variant="outline"><Settings className="h-4 w-4 mr-2" />Admin Settings</Button>
                  </div>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardHeader><CardTitle>System Status</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border border-border rounded-lg"><div className="stat-number text-green-500">{users.length}</div><p className="section-label mt-1">Registered Users</p></div>
                    <div className="text-center p-4 border border-border rounded-lg"><div className="stat-number text-primary">{disputes.length}</div><p className="section-label mt-1">Total Disputes</p></div>
                    <div className="text-center p-4 border border-border rounded-lg"><div className="stat-number text-amber-500">{notifications.length}</div><p className="section-label mt-1">Notifications</p></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* Client Editor Dialog */}
      <AdminClientEditor
        clientId={editingClientId}
        open={!!editingClientId}
        onOpenChange={(open) => { if (!open) setEditingClientId(null); }}
        onSaved={fetchAdminData}
      />
    </div>
  );
}
