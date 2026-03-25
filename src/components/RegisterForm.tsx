import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface RegisterFormProps {
  onToggleForm: () => void;
}

export function RegisterForm({ onToggleForm }: RegisterFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast({ title: "Required", description: "First and last name are required", variant: "destructive" });
      return;
    }

    if (!formData.dateOfBirth) {
      toast({ title: "Required", description: "Date of birth is required", variant: "destructive" });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({ title: "Password Mismatch", description: "Passwords do not match", variant: "destructive" });
      return;
    }

    if (formData.password.length < 8) {
      toast({ title: "Weak Password", description: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }

    setLoading(true);
    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: formData.firstName.trim(),
          middle_name: formData.middleName.trim(),
          last_name: formData.lastName.trim(),
          date_of_birth: formData.dateOfBirth,
          full_name: `${formData.firstName.trim()} ${formData.middleName.trim() ? formData.middleName.trim() + ' ' : ''}${formData.lastName.trim()}`,
          email_confirm: true,
        }
      }
    });

    if (error) {
      toast({ title: "Registration Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Registration Successful", description: "Please check your email to verify your account." });
    }
    setLoading(false);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="card-elegant w-full max-w-md animate-fade-in">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center mb-4">
          <UserPlus className="h-8 w-8 text-accent mr-2" />
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
        </div>
        <CardDescription>Join Express Credit & Financial Solutions</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input id="firstName" placeholder="John" value={formData.firstName} onChange={(e) => handleChange('firstName', e.target.value)} required maxLength={50} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="middleName">Middle</Label>
              <Input id="middleName" placeholder="M" value={formData.middleName} onChange={(e) => handleChange('middleName', e.target.value)} maxLength={50} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input id="lastName" placeholder="Doe" value={formData.lastName} onChange={(e) => handleChange('lastName', e.target.value)} required maxLength={50} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth *</Label>
            <Input id="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={(e) => handleChange('dateOfBirth', e.target.value)} required max={new Date().toISOString().split('T')[0]} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" placeholder="john@example.com" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} required maxLength={255} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <div className="relative">
              <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Create a password" value={formData.password} onChange={(e) => handleChange('password', e.target.value)} required className="pr-10" />
              <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password *</Label>
            <div className="relative">
              <Input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirm your password" value={formData.confirmPassword} onChange={(e) => handleChange('confirmPassword', e.target.value)} required className="pr-10" />
              <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <Button type="submit" variant="gold" className="w-full" size="lg" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>

          <div className="text-center">
            <Button type="button" variant="link" onClick={onToggleForm} className="text-accent hover:text-accent/80">
              Already have an account? Sign in
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
