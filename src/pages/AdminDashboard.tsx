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
  Brain, Cpu, FileSearch, Menu, LogOut, Zap
} from 'lucide-react';
import { AdminCreditReportManager } from '@/components/AdminCreditReportManager';
import { BacklogOverview } from '@/components/BacklogOverview';
import { AdminReviewQueue } from '@/components/AdminReviewQueue';
import { CasePipelineDashboard } from '@/components/CasePipelineDashboard';
import { AIAnalysisViewer } from '@/components/AIAnalysisViewer';
import { AdminAIControlPanel } from '@/components/AdminAIControlPanel';
import { ThemeSelector } from '@/components/ThemeSelector';
import { AdminBacklogTools } from '@/components/AdminBacklogTools';
import { cn } from '@/lib/utils';

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

type Section = 'overview' | 'review-queue' | 'pipeline' | 'ai-analysis' | 'ai-ops' | 'backlog' | 'users' | 'membership' | 'disputes' | 'documents' | 'credit-reports' | 'email' | 'system';

const NAV_ITEMS: { section: Section; label: string; icon: any; group: string }[] = [
  { section: 'overview', label: 'Dashboard', icon: LayoutDashboard, group: 'OVERVIEW' },
  { section: 'backlog', label: 'Backlog Tools', icon: Zap, group: 'WORKFLOW' },
  { section: 'review-queue', label: 'Review Queue', icon: ClipboardCheck, group: 'WORKFLOW' },
  { section: 'pipeline', label: 'Pipeline', icon: GitBranch, group: 'WORKFLOW' },
  { section: 'ai-analysis', label: 'AI Analysis', icon: Brain, group: 'WORKFLOW' },
  { section: 'ai-ops', label: 'AI Ops', icon: Cpu, group: 'OPERATIONS' },
  { section: 'users', label: 'Clients', icon: Users, group: 'MANAGEMENT' },
  { section: 'membership', label: 'Membership', icon: Crown, group: 'MANAGEMENT' },
  { section: 'disputes', label: 'Disputes', icon: FileText, group: 'MANAGEMENT' },
  { section: 'documents', label: 'Documents', icon: Upload, group: 'MANAGEMENT' },
  { section: 'credit-reports', label: 'Credit Reports', icon: FileSearch, group: 'MANAGEMENT' },
  { section: 'email', label: 'Email', icon: Mail, group: 'OPERATIONS' },
  { section: 'system', label: 'System', icon: Settings, group: 'OPERATIONS' },
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
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({ title: "Error", description: "Failed to load admin data", variant: "destructive" });
    } finally {
      setLoading(false);
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

  const groups = ['OVERVIEW', 'WORKFLOW', 'MANAGEMENT', 'OPERATIONS'];

  const SidebarNav = ({ onItemClick }: { onItemClick?: () => void }) => (
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
        {groups.map(group => {
          const items = NAV_ITEMS.filter(i => i.group === group);
          return (
            <div key={group}>
              <p className="section-label px-3 mb-1">{group}</p>
              <div className="space-y-0.5">
                {items.map(item => {
                  const Icon = item.icon;
                  const active = activeSection === item.section;
                  return (
                    <button
                      key={item.section}
                      onClick={() => { setActiveSection(item.section); onItemClick?.(); }}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all',
                        active
                          ? 'bg-accent/10 text-foreground border-l-2 border-primary font-medium'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent/5'
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

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {/* Overview */}
          {activeSection === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              {/* Workflow Command Center */}
              <Card className="glass-card border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Workflow Command Center
                  </CardTitle>
                  <CardDescription>Live workflow status — click to open</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { section: 'review-queue' as Section, label: 'Review Queue', icon: ClipboardCheck, color: 'text-orange-500 bg-orange-500/10', desc: 'Pending reviews' },
                      { section: 'pipeline' as Section, label: 'Case Pipeline', icon: GitBranch, color: 'text-purple-500 bg-purple-500/10', desc: 'Active cases' },
                      { section: 'ai-analysis' as Section, label: 'AI Analysis', icon: Brain, color: 'text-cyan-500 bg-cyan-500/10', desc: 'Credit insights' },
                      { section: 'ai-ops' as Section, label: 'AI Ops', icon: Cpu, color: 'text-rose-500 bg-rose-500/10', desc: 'Run operations' },
                    ].map(item => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.section}
                          onClick={() => setActiveSection(item.section)}
                          className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/10 hover:border-primary/30 transition-all text-left"
                        >
                          <div className={cn('rounded-lg p-2', item.color)}><Icon className="h-5 w-5" /></div>
                          <div>
                            <p className="font-medium text-sm text-foreground">{item.label}</p>
                            <p className="text-xs text-muted-foreground">{item.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <BacklogOverview />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Users', value: users.length, icon: Users, color: 'text-blue-500 bg-blue-500/10' },
                  { label: 'Active Disputes', value: disputes.length, icon: FileText, color: 'text-indigo-500 bg-indigo-500/10' },
                  { label: 'Completed Letters', value: disputes.filter(d => d.generated_letter).length, icon: Activity, color: 'text-green-500 bg-green-500/10' },
                  { label: 'Notifications', value: notifications.length, icon: Mail, color: 'text-amber-500 bg-amber-500/10' },
                ].map(stat => {
                  const Icon = stat.icon;
                  return (
                    <Card key={stat.label} className="glass-card-hover">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="section-label">{stat.label}</p>
                            <p className="stat-number mt-1">{stat.value}</p>
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
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                  <CardDescription>Jump to any workflow section</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {[
                      { section: 'backlog' as Section, label: 'Backlog Tools', icon: Zap, desc: 'Process client files fast', color: 'text-red-500 bg-red-500/10' },
                      { section: 'ai-ops' as Section, label: 'AI Ops Panel', icon: Cpu, desc: 'Run AI operations', color: 'text-rose-500 bg-rose-500/10' },
                      { section: 'review-queue' as Section, label: 'Review Queue', icon: ClipboardCheck, desc: 'Approve or reject disputes', color: 'text-orange-500 bg-orange-500/10' },
                      { section: 'pipeline' as Section, label: 'Case Pipeline', icon: GitBranch, desc: 'Track all case stages', color: 'text-purple-500 bg-purple-500/10' },
                      { section: 'ai-analysis' as Section, label: 'AI Analysis', icon: Brain, desc: 'View AI credit insights', color: 'text-cyan-500 bg-cyan-500/10' },
                      { section: 'disputes' as Section, label: 'All Disputes', icon: FileText, desc: 'Manage dispute letters', color: 'text-indigo-500 bg-indigo-500/10' },
                      { section: 'credit-reports' as Section, label: 'Credit Reports', icon: FileSearch, desc: 'Manage uploaded reports', color: 'text-emerald-500 bg-emerald-500/10' },
                      { section: 'users' as Section, label: 'Client Manager', icon: Users, desc: 'View & manage clients', color: 'text-blue-500 bg-blue-500/10' },
                      { section: 'membership' as Section, label: 'Memberships', icon: Crown, desc: 'Assign plans & VIP', color: 'text-amber-500 bg-amber-500/10' },
                    ].map(item => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.section}
                          onClick={() => setActiveSection(item.section)}
                          className="group flex flex-col items-start gap-2 p-4 rounded-xl border border-border bg-card hover:bg-accent/10 hover:border-primary/30 transition-all text-left"
                        >
                          <div className={cn('rounded-lg p-2', item.color)}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">{item.label}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
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
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === 'review-queue' && <div className="animate-fade-in"><AdminReviewQueue /></div>}
          {activeSection === 'pipeline' && <div className="animate-fade-in"><CasePipelineDashboard /></div>}
          {activeSection === 'ai-analysis' && <div className="animate-fade-in"><AIAnalysisViewer isAdmin /></div>}
          {activeSection === 'ai-ops' && <div className="animate-fade-in"><AdminAIControlPanel /></div>}
          {activeSection === 'backlog' && <div className="animate-fade-in"><AdminBacklogTools /></div>}

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
                            <TableCell><Button size="sm" variant="outline"><Eye className="h-4 w-4" /></Button></TableCell>
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
    </div>
  );
}
