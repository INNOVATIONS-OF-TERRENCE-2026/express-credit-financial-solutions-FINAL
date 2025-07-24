import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Settings, TestTube, MessageSquare, BookOpen } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function OpenAITestPanel() {
  const [testMessage, setTestMessage] = useState("Hello, can you help me understand credit reports?");
  const [testTopic, setTestTopic] = useState("Understanding Your Credit Report");
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<{
    chatbot?: { success: boolean; response?: string; error?: string };
    education?: { success: boolean; response?: string; error?: string };
  }>({});
  
  const { session } = useAuth();
  const { toast } = useToast();

  const testChatbot = async () => {
    setIsTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('gpt-assistant', {
        body: {
          message: testMessage,
          conversationHistory: []
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;

      setTestResults(prev => ({
        ...prev,
        chatbot: { success: true, response: data.response }
      }));

      toast({
        title: "Chatbot Test Successful",
        description: "OpenAI API is responding correctly for the chatbot.",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setTestResults(prev => ({
        ...prev,
        chatbot: { success: false, error: errorMessage }
      }));

      toast({
        title: "Chatbot Test Failed", 
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  const testEducation = async () => {
    setIsTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('education-content', {
        body: {
          topic: testTopic,
          contentType: "guide"
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;

      setTestResults(prev => ({
        ...prev,
        education: { success: true, response: data.content }
      }));

      toast({
        title: "Education Content Test Successful",
        description: "OpenAI API is responding correctly for education content.",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setTestResults(prev => ({
        ...prev,
        education: { success: false, error: errorMessage }
      }));

      toast({
        title: "Education Content Test Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            OpenAI Integration Test Panel
          </CardTitle>
          <CardDescription>
            Test your OpenAI API integration for both the chatbot and education content features.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Setup Instructions */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Setup Requirements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>Required:</strong> OPENAI_API_KEY must be set in your Supabase Edge Function Secrets</p>
                <p><strong>Location:</strong> Supabase Dashboard → Project Settings → Edge Functions → Secrets</p>
                <p><strong>Model:</strong> Using latest gpt-4.1-2025-04-14 model</p>
              </div>
            </CardContent>
          </Card>

          {/* Chatbot Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Test Chatbot (gpt-assistant function)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="test-message">Test Message</Label>
                <Textarea
                  id="test-message"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Enter a test message for the chatbot..."
                  rows={3}
                />
              </div>
              <Button onClick={testChatbot} disabled={isTesting}>
                {isTesting ? "Testing..." : "Test Chatbot"}
              </Button>
              {testResults.chatbot && (
                <div className={`p-4 rounded-lg ${testResults.chatbot.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="font-medium mb-2">
                    {testResults.chatbot.success ? "✅ Success" : "❌ Failed"}
                  </div>
                  {testResults.chatbot.success ? (
                    <div className="text-sm">
                      <strong>Response:</strong> {testResults.chatbot.response?.substring(0, 200)}...
                    </div>
                  ) : (
                    <div className="text-sm text-red-700">
                      <strong>Error:</strong> {testResults.chatbot.error}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Education Content Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Test Education Content (education-content function)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="test-topic">Test Topic</Label>
                <Input
                  id="test-topic"
                  value={testTopic}
                  onChange={(e) => setTestTopic(e.target.value)}
                  placeholder="Enter a test topic..."
                />
              </div>
              <Button onClick={testEducation} disabled={isTesting}>
                {isTesting ? "Testing..." : "Test Education Content"}
              </Button>
              {testResults.education && (
                <div className={`p-4 rounded-lg ${testResults.education.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="font-medium mb-2">
                    {testResults.education.success ? "✅ Success" : "❌ Failed"}
                  </div>
                  {testResults.education.success ? (
                    <div className="text-sm">
                      <strong>Generated Content:</strong> {testResults.education.response?.substring(0, 200)}...
                    </div>
                  ) : (
                    <div className="text-sm text-red-700">
                      <strong>Error:</strong> {testResults.education.error}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Common Issues */}
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="h-4 w-4" />
                Common Issues & Solutions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-yellow-800">
                <div>
                  <strong>OPENAI_API_KEY not set:</strong> Add your OpenAI API key to Supabase Edge Function Secrets
                </div>
                <div>
                  <strong>Authentication error:</strong> Make sure you're logged in and have proper session token
                </div>
                <div>
                  <strong>API quota exceeded:</strong> Check your OpenAI account usage and billing
                </div>
                <div>
                  <strong>Model not found:</strong> Ensure your OpenAI account has access to gpt-4.1-2025-04-14
                </div>
                <div>
                  <strong>Network timeout:</strong> The functions may take 30-60 seconds for complex requests
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}