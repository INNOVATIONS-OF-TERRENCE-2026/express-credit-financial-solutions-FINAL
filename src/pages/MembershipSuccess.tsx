import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { NavigationHeader } from "@/components/NavigationHeader";
import { useMembership } from "@/hooks/useMembership";

export default function MembershipSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { refreshMembership } = useMembership();

  useEffect(() => {
    // Refresh membership data when component loads
    refreshMembership();
  }, [refreshMembership]);

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-foreground">Payment Successful!</CardTitle>
              <CardDescription className="text-muted-foreground">
                Thank you for your purchase. Your membership has been activated.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="text-sm text-muted-foreground">
                {sessionId && (
                  <p>Session ID: {sessionId}</p>
                )}
              </div>
              
              <div className="space-y-3">
                <Button onClick={() => navigate('/')} className="w-full">
                  Go to Dashboard
                </Button>
                <Button variant="outline" onClick={() => navigate('/dispute-center')} className="w-full">
                  Start Using Dispute Center
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Your membership details will be updated shortly. If you don't see changes immediately, please refresh the page.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}