import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { 
  GraduationCap, 
  BookOpen, 
  Award, 
  MessageCircle, 
  CheckCircle, 
  Star,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  Users,
  Shield,
  Target,
  ArrowLeft,
  Send
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { BackButton } from '@/components/BackButton';

interface EducationModule {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTime: string;
  topics: string[];
  completed?: boolean;
  progress?: number;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const EDUCATION_MODULES: EducationModule[] = [
  {
    id: 'credit-scores',
    title: 'Understanding Credit Scores',
    description: 'Learn how credit scores work and what factors affect them',
    icon: <TrendingUp className="h-5 w-5" />,
    difficulty: 'Beginner',
    estimatedTime: '15 min',
    topics: ['FICO vs VantageScore', 'Score Ranges', 'Impact Factors', 'Monitoring']
  },
  {
    id: 'disputes',
    title: 'Credit Disputes',
    description: 'Master the art of disputing inaccurate credit items',
    icon: <AlertTriangle className="h-5 w-5" />,
    difficulty: 'Intermediate',
    estimatedTime: '25 min',
    topics: ['FCRA Rights', 'Dispute Process', 'Documentation', 'Follow-up']
  },
  {
    id: 'collections',
    title: 'Dealing with Collections',
    description: 'Strategies for handling collection accounts and debt validation',
    icon: <Shield className="h-5 w-5" />,
    difficulty: 'Intermediate',
    estimatedTime: '20 min',
    topics: ['Validation Letters', 'Pay for Delete', 'Statute of Limitations', 'Settlements']
  },
  {
    id: 'tradelines',
    title: 'Tradelines and Credit Building',
    description: 'Build positive credit history with strategic tradelines',
    icon: <CreditCard className="h-5 w-5" />,
    difficulty: 'Advanced',
    estimatedTime: '30 min',
    topics: ['Primary Tradelines', 'Authorized Users', 'Credit Mix', 'Utilization']
  },
  {
    id: 'authorized-users',
    title: 'Authorized User Strategy',
    description: 'Leverage authorized user positions for credit improvement',
    icon: <Users className="h-5 w-5" />,
    difficulty: 'Intermediate',
    estimatedTime: '20 min',
    topics: ['AU Benefits', 'Selection Criteria', 'Risks & Rewards', 'Best Practices']
  },
  {
    id: 'rebuilding',
    title: 'Credit Rebuilding Strategy',
    description: 'Comprehensive plan for rebuilding credit from the ground up',
    icon: <Target className="h-5 w-5" />,
    difficulty: 'Advanced',
    estimatedTime: '35 min',
    topics: ['Secured Cards', 'Payment History', 'Long-term Planning', 'Maintenance']
  }
];

export default function EducationCenter() {
  const { user } = useAuth();
  const { hasAccess } = useMembership();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [selectedModule, setSelectedModule] = useState<EducationModule | null>(null);
  const [userProgress, setUserProgress] = useState<Record<string, any>>({});
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const [badges, setBadges] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      fetchUserProgress();
    }
  }, [user]);

  const fetchUserProgress = async () => {
    try {
      const { data, error } = await supabase
        .from('education_progress')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;

      const progressMap = (data || []).reduce((acc, item) => {
        acc[item.topic] = item;
        return acc;
      }, {});

      setUserProgress(progressMap);

      // Collect all badges
      const allBadges = (data || []).flatMap(item => (item.badges_earned as string[]) || []);
      setBadges([...new Set(allBadges)]);

    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const startModule = (module: EducationModule) => {
    setSelectedModule(module);
    setChatMessages([
      {
        id: '1',
        role: 'assistant',
        content: `Welcome to the ${module.title} module! I'm your AI instructor. This lesson will take approximately ${module.estimatedTime}. Let's start with a question: What would you like to learn about ${module.title.toLowerCase()}?`,
        timestamp: new Date()
      }
    ]);
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || !selectedModule || !user) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: currentMessage,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoadingResponse(true);

    try {
      const { data, error } = await supabase.functions.invoke('education-content', {
        body: {
          topic: selectedModule.id,
          contentType: 'interactive_lesson',
          userMessage: currentMessage,
          context: selectedModule.topics
        }
      });

      if (error) throw error;

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, assistantMessage]);

      // Update progress
      await updateProgress(selectedModule.id, 25);

    } catch (error) {
      console.error('Error getting AI response:', error);
      toast({
        title: "Error",
        description: "Failed to get AI response",
        variant: "destructive",
      });
    } finally {
      setIsLoadingResponse(false);
    }
  };

  const completeModule = async (moduleId: string) => {
    try {
      await updateProgress(moduleId, 100, true);
      
      toast({
        title: "Module Completed!",
        description: "You've earned a completion badge",
      });

      // Award badge
      const newBadge = `${moduleId}_complete`;
      setBadges(prev => [...prev, newBadge]);

    } catch (error) {
      console.error('Error completing module:', error);
      toast({
        title: "Error",
        description: "Failed to mark module as complete",
        variant: "destructive",
      });
    }
  };

  const updateProgress = async (topic: string, progressPercentage: number, completed = false) => {
    try {
      const progressData = {
        user_id: user?.id,
        topic,
        progress_percentage: progressPercentage,
        completed_at: completed ? new Date().toISOString() : null,
        badges_earned: completed ? [`${topic}_complete`] : []
      };

      const { error } = await supabase
        .from('education_progress')
        .upsert(progressData, { onConflict: 'user_id,topic' });

      if (error) throw error;

      // Refresh progress
      fetchUserProgress();

    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getOverallProgress = () => {
    const completedModules = EDUCATION_MODULES.filter(module => 
      userProgress[module.id]?.completed_at
    ).length;
    return (completedModules / EDUCATION_MODULES.length) * 100;
  };

  if (!hasAccess('education')) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <CardTitle>Education Center Access Required</CardTitle>
            <CardDescription>
              Upgrade your membership to access our comprehensive credit education modules.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => navigate('/membership')} className="w-full">
              Upgrade Membership
            </Button>
            <Button onClick={() => navigate('/')} variant="outline" className="w-full">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (selectedModule) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6">
          <div className="mb-6">
            <Button 
              onClick={() => setSelectedModule(null)} 
              variant="outline" 
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Modules
            </Button>
            <h1 className="text-3xl font-bold mb-2">{selectedModule.title}</h1>
            <p className="text-muted-foreground">{selectedModule.description}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Module Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {selectedModule.icon}
                  Module Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Difficulty</Label>
                  <Badge className={getDifficultyColor(selectedModule.difficulty)}>
                    {selectedModule.difficulty}
                  </Badge>
                </div>
                <div>
                  <Label>Estimated Time</Label>
                  <p className="text-sm">{selectedModule.estimatedTime}</p>
                </div>
                <div>
                  <Label>Topics Covered</Label>
                  <ul className="text-sm space-y-1">
                    {selectedModule.topics.map((topic, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        {topic}
                      </li>
                    ))}
                  </ul>
                </div>
                <Button 
                  onClick={() => completeModule(selectedModule.id)}
                  className="w-full"
                  disabled={userProgress[selectedModule.id]?.completed_at}
                >
                  {userProgress[selectedModule.id]?.completed_at ? 'Completed' : 'Mark as Complete'}
                </Button>
              </CardContent>
            </Card>

            {/* Chat Interface */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Interactive Learning Chat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <ScrollArea className="h-96 border rounded-lg p-4">
                    <div className="space-y-4">
                      {chatMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                              message.role === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                      {isLoadingResponse && (
                        <div className="flex justify-start">
                          <div className="bg-muted rounded-lg p-3">
                            <div className="animate-pulse">AI is typing...</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  <div className="flex gap-2">
                    <Input
                      placeholder="Ask a question about this topic..."
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      disabled={isLoadingResponse}
                    />
                    <Button 
                      onClick={sendMessage} 
                      disabled={!currentMessage.trim() || isLoadingResponse}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <BackButton />
        
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-primary" />
            AI Credit Education Center
          </h1>
          <p className="text-xl text-muted-foreground">
            Master credit repair with interactive AI-powered learning modules
          </p>
        </div>

        <Tabs defaultValue="modules" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="modules">Learning Modules</TabsTrigger>
            <TabsTrigger value="progress">My Progress</TabsTrigger>
            <TabsTrigger value="badges">Achievements</TabsTrigger>
          </TabsList>

          <TabsContent value="modules" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {EDUCATION_MODULES.map((module) => {
                const progress = userProgress[module.id];
                const isCompleted = !!progress?.completed_at;
                const progressPercentage = progress?.progress_percentage || 0;

                return (
                  <Card key={module.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {module.icon}
                          {isCompleted && <CheckCircle className="h-4 w-4 text-green-600" />}
                        </div>
                        <Badge className={getDifficultyColor(module.difficulty)}>
                          {module.difficulty}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{module.title}</CardTitle>
                      <CardDescription>{module.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>📚 {module.estimatedTime}</span>
                        <span>{module.topics.length} topics</span>
                      </div>

                      {progressPercentage > 0 && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{progressPercentage}%</span>
                          </div>
                          <Progress value={progressPercentage} />
                        </div>
                      )}

                      <Button 
                        onClick={() => startModule(module)}
                        className="w-full"
                        variant={isCompleted ? "outline" : "default"}
                      >
                        {isCompleted ? 'Review Module' : 'Start Learning'}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Learning Progress</CardTitle>
                <CardDescription>Track your education journey</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Overall Progress</span>
                      <span className="text-sm text-muted-foreground">{Math.round(getOverallProgress())}%</span>
                    </div>
                    <Progress value={getOverallProgress()} className="h-3" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {EDUCATION_MODULES.map((module) => {
                      const progress = userProgress[module.id];
                      const isCompleted = !!progress?.completed_at;
                      const progressPercentage = progress?.progress_percentage || 0;

                      return (
                        <div key={module.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                          <div className="flex-shrink-0">
                            {isCompleted ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              module.icon
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{module.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Progress value={progressPercentage} className="h-1 flex-1" />
                              <span className="text-xs text-muted-foreground">{progressPercentage}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="badges" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Your Achievements
                </CardTitle>
                <CardDescription>Badges earned for completing modules</CardDescription>
              </CardHeader>
              <CardContent>
                {badges.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No badges earned yet</p>
                    <p className="text-sm">Complete learning modules to earn achievements</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {badges.map((badge, index) => (
                      <div key={index} className="text-center p-4 border rounded-lg">
                        <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                        <p className="text-sm font-medium capitalize">
                          {badge.replace('_complete', '').replace('-', ' ')}
                        </p>
                        <p className="text-xs text-muted-foreground">Completed</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}