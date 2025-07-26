import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Calendar, Eye, Download, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface ChatSession {
  sessionId: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
  lastMessage: string;
  messageCount: number;
}

export function ChatHistoryPanel() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadChatHistory();
  }, []);

  const loadChatHistory = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('chat-history-manager', {
        body: { action: 'load' }
      });

      if (error) throw error;

      if (data.success) {
        const sessionArray: ChatSession[] = Object.entries(data.sessions).map(([sessionId, messages]: [string, any]) => ({
          sessionId,
          messages: messages.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
          lastMessage: messages[messages.length - 1]?.content.substring(0, 100) + '...' || 'No messages',
          messageCount: messages.length
        }));

        setSessions(sessionArray.sort((a, b) => 
          new Date(b.messages[b.messages.length - 1]?.timestamp || 0).getTime() - 
          new Date(a.messages[a.messages.length - 1]?.timestamp || 0).getTime()
        ));
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      toast({
        title: "Error",
        description: "Failed to load chat history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const viewSession = (session: ChatSession) => {
    setSelectedSession(session);
    setShowDialog(true);
  };

  const exportSession = (session: ChatSession) => {
    const chatContent = session.messages
      .map(msg => `[${format(new Date(msg.timestamp), 'yyyy-MM-dd HH:mm:ss')}] ${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n\n');

    const blob = new Blob([chatContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-session-${session.sessionId.substring(0, 8)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Chat session exported successfully",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading chat history...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Chat History
          </CardTitle>
          <CardDescription>
            View and manage your previous AI assistant conversations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No chat history found.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Start a conversation with the AI assistant to see your chat history here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div key={session.sessionId} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Session {session.sessionId.substring(0, 8)}</span>
                      <Badge variant="outline">
                        {session.messageCount} messages
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(session.messages[session.messages.length - 1]?.timestamp || Date.now()), 'MMM dd, yyyy')}
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {session.lastMessage}
                  </p>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => viewSession(session)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportSession(session)}
                      className="flex items-center gap-1"
                    >
                      <Download className="h-4 w-4" />
                      Export
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session View Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Chat Session Details</DialogTitle>
            <DialogDescription>
              Session ID: {selectedSession?.sessionId} • {selectedSession?.messageCount} messages
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-96 w-full p-4 border rounded-lg">
            <div className="space-y-4">
              {selectedSession?.messages.map((message, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${
                    message.role === 'user' 
                      ? 'bg-primary/10 ml-8' 
                      : 'bg-muted/50 mr-8'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={message.role === 'user' ? 'default' : 'secondary'}>
                      {message.role === 'user' ? 'You' : 'AI Assistant'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(message.timestamp), 'MMM dd, HH:mm:ss')}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
          
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => selectedSession && exportSession(selectedSession)}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Session
            </Button>
            <Button onClick={() => setShowDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}