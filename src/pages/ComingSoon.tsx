import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Mail, Phone } from 'lucide-react';

interface ComingSoonProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<any>;
  estimatedDate?: string;
  features?: string[];
}

export function ComingSoon({ 
  title, 
  description = "This feature is currently under development and will be available soon.",
  icon: Icon,
  estimatedDate,
  features = []
}: ComingSoonProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          {Icon && (
            <div className="flex justify-center mb-4">
              <Icon className="h-16 w-16 text-primary/60" />
            </div>
          )}
          <CardTitle className="text-3xl font-bold">{title}</CardTitle>
          <CardDescription className="text-lg">
            {description}
          </CardDescription>
          <div className="flex justify-center mt-4">
            <Badge variant="secondary" className="px-4 py-2">
              <Clock className="h-4 w-4 mr-2" />
              Coming Soon
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {estimatedDate && (
            <div className="text-center">
              <p className="text-muted-foreground">
                Estimated Release: <span className="font-semibold">{estimatedDate}</span>
              </p>
            </div>
          )}

          {features.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-center">Planned Features</h3>
              <ul className="space-y-2">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-primary rounded-full" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="border-t pt-6 space-y-4">
            <h3 className="text-lg font-semibold text-center">Need Immediate Assistance?</h3>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => window.location.href = 'mailto:expresscreditfinancialsolution@gmail.com'}
              >
                <Mail className="h-4 w-4" />
                Email Us
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => window.location.href = 'tel:9034846348'}
              >
                <Phone className="h-4 w-4" />
                Call (903) 484-6348
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}