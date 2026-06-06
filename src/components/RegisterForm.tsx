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
    <div className="lux-glass-dark w-full max-w-md animate-fade-in p-8 relative">
      <span aria-hidden className="absolute inset-x-10 top-0 lux-chrome-rule" />
      <div className="text-center mb-6 space-y-2">
        <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center btn-premium-gold">
          <UserPlus className="h-5 w-5" />
        </div>
        <p className="lux-eyebrow text-ivory/60">Client Onboarding</p>
        <h2 className="lux-display text-2xl text-ivory">Create Account</h2>
        <p className="text-sm text-ivory/70">Join Express Credit &amp; Financial Solutions</p>
      </div>
      <div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="lux-label-dark">First Name *</Label>
              <Input id="firstName" className="lux-input-dark h-11" placeholder="John" value={formData.firstName} onChange={(e) => handleChange('firstName', e.target.value)} required maxLength={50} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="middleName" className="lux-label-dark">Middle</Label>
              <Input id="middleName" className="lux-input-dark h-11" placeholder="M" value={formData.middleName} onChange={(e) => handleChange('middleName', e.target.value)} maxLength={50} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="lux-label-dark">Last Name *</Label>
              <Input id="lastName" className="lux-input-dark h-11" placeholder="Doe" value={formData.lastName} onChange={(e) => handleChange('lastName', e.target.value)} required maxLength={50} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateOfBirth" className="lux-label-dark">Date of Birth *</Label>
            <Input id="dateOfBirth" type="date" className="lux-input-dark h-11" value={formData.dateOfBirth} onChange={(e) => handleChange('dateOfBirth', e.target.value)} required max={new Date().toISOString().split('T')[0]} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="lux-label-dark">Email *</Label>
            <Input id="email" type="email" className="lux-input-dark h-11" placeholder="john@example.com" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} required maxLength={255} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="lux-label-dark">Password *</Label>
            <div className="relative">
              <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="At least 8 characters" value={formData.password} onChange={(e) => handleChange('password', e.target.value)} required className="lux-input-dark h-11 pr-10" />
              <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-ivory/60 hover:text-ivory" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="lux-label-dark">Confirm Password *</Label>
            <div className="relative">
              <Input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} placeholder="Re-enter password" value={formData.confirmPassword} onChange={(e) => handleChange('confirmPassword', e.target.value)} required className="lux-input-dark h-11 pr-10" />
              <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-ivory/60 hover:text-ivory" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <Button type="submit" variant="premium" className="w-full" size="lg" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>

          <div className="text-center">
            <Button type="button" variant="link" onClick={onToggleForm} className="text-gold-soft hover:text-gold">
              Already have an account? Sign in
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
