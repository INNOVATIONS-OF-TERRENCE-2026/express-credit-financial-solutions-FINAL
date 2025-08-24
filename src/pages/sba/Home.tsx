import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  ArrowRight,
  FileText,
  Users,
  Home as HomeIcon,
  ArrowLeft
} from 'lucide-react';

const PROGRAMS = [
  {
    id: '7a',
    title: 'SBA 7(a) Loans',
    description: 'Most common SBA loan for working capital, equipment, and real estate',
    maxAmount: '$5M',
    useFor: ['Working Capital', 'Equipment', 'Real Estate', 'Refinancing'],
    icon: Building2,
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  {
    id: '504',
    title: 'SBA 504 Loans',
    description: 'Fixed-rate financing for real estate and equipment purchases',
    maxAmount: '$5.5M',
    useFor: ['Real Estate', 'Equipment', 'Renovations'],
    icon: HomeIcon,
    color: 'bg-green-500/20 text-green-400 border-green-500/30',
  },
  {
    id: 'microloan',
    title: 'Microloans',
    description: 'Small loans for startups and growing small businesses',
    maxAmount: '$50K',
    useFor: ['Working Capital', 'Inventory', 'Equipment'],
    icon: DollarSign,
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  },
  {
    id: 'express',
    title: 'SBA Express',
    description: 'Fast approval process with quick funding decisions',
    maxAmount: '$500K',
    useFor: ['Working Capital', 'Equipment', 'Inventory'],
    icon: Clock,
    color: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  },
];

const FEATURES = [
  {
    icon: FileText,
    title: 'Smart Pre-Qualification',
    description: 'Get matched to the right SBA program based on your needs',
  },
  {
    icon: Users,
    title: 'Streamlined Application',
    description: 'Complete intake process with guided step-by-step forms',
  },
  {
    icon: CheckCircle,
    title: 'Document Management',
    description: 'Upload and organize all required documents in one place',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Button
                asChild
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                <Link to="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Express Credit & Financial Solutions
                </h1>
                <p className="text-slate-400 text-sm">
                  SBA Loan Automation Portal — 0804 Edition
                </p>
              </div>
            </div>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              SBA Compliant
            </Badge>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
              SBA Loan
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 ml-4">
                Made Simple
              </span>
            </h2>
            <p className="text-xl text-slate-400 mb-8 max-w-3xl mx-auto">
              Streamline your SBA loan application process. Get pre-qualified, 
              complete your intake, and generate lender-ready packets automatically.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                asChild 
                size="lg" 
                className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20"
              >
                <Link to="/sba/precheck">
                  Start Free Pre-Check
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                Learn More
              </Button>
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {FEATURES.map((feature, index) => (
              <Card key={index} className="bg-slate-800/50 border-slate-700 text-center">
                <CardHeader>
                  <feature.icon className="h-12 w-12 text-green-400 mx-auto mb-4" />
                  <CardTitle className="text-white">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-400">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section className="py-16 px-4 bg-slate-900/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-white mb-4">
              SBA Loan Programs
            </h3>
            <p className="text-slate-400 text-lg">
              Choose from four main SBA loan programs based on your business needs
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PROGRAMS.map((program) => (
              <Card key={program.id} className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
                <CardHeader className="text-center">
                  <program.icon className="h-12 w-12 text-green-400 mx-auto mb-4" />
                  <CardTitle className="text-white text-lg">{program.title}</CardTitle>
                  <CardDescription className="text-slate-400">
                    {program.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <Badge className={program.color}>
                      Up to {program.maxAmount}
                    </Badge>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold text-slate-300 mb-2">Best for:</h4>
                    <ul className="space-y-1">
                      {program.useFor.map((use, index) => (
                        <li key={index} className="text-xs text-slate-400 flex items-center">
                          <CheckCircle className="h-3 w-3 text-green-400 mr-2 flex-shrink-0" />
                          {use}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button asChild className="bg-green-600 hover:bg-green-700 text-white">
              <Link to="/sba/precheck">
                Find My Program
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/50 py-8 px-4">
        <div className="container mx-auto text-center">
          <p className="text-slate-400 text-sm">
            © 2025 Express Credit & Financial Solutions — SBA Loan Automation Portal.
            <br />
            Not a lender; we prepare and package files for SBA-partner lenders.
          </p>
        </div>
      </footer>
    </div>
  );
}