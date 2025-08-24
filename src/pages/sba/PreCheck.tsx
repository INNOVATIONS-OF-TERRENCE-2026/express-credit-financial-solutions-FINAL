import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { SectionTitle } from '@/components/sba/SectionTitle';
import { useAppStore } from '@/store/app';

interface FormData {
  yearsInBusiness: string;
  revenue: string;
  useOfFunds: string;
  employees: string;
  collateral: string;
  creditScore: string;
}

const QUESTIONS = [
  {
    id: 'yearsInBusiness',
    title: 'How long has your business been operating?',
    options: [
      { value: '0', label: 'Pre-revenue / Startup' },
      { value: '<1', label: 'Less than 1 year' },
      { value: '1-2', label: '1-2 years' },
      { value: '3-5', label: '3-5 years' },
      { value: '5+', label: '5+ years' },
    ],
  },
  {
    id: 'revenue',
    title: 'What is your annual revenue range?',
    options: [
      { value: '<100k', label: 'Less than $100K' },
      { value: '100k-500k', label: '$100K - $500K' },
      { value: '500k-1m', label: '$500K - $1M' },
      { value: '1m-5m', label: '$1M - $5M' },
      { value: '5m+', label: '$5M+' },
    ],
  },
  {
    id: 'useOfFunds',
    title: 'What will you use the loan for?',
    options: [
      { value: 'working_capital', label: 'Working Capital' },
      { value: 'equipment', label: 'Equipment Purchase' },
      { value: 'real_estate', label: 'Real Estate Purchase' },
      { value: 'refinancing', label: 'Debt Refinancing' },
      { value: 'expansion', label: 'Business Expansion' },
    ],
  },
  {
    id: 'employees',
    title: 'How many employees does your business have?',
    options: [
      { value: '0', label: 'Just me (sole proprietor)' },
      { value: '1-5', label: '1-5 employees' },
      { value: '6-25', label: '6-25 employees' },
      { value: '26-100', label: '26-100 employees' },
      { value: '100+', label: '100+ employees' },
    ],
  },
  {
    id: 'collateral',
    title: 'Do you have collateral to secure the loan?',
    options: [
      { value: 'yes_real_estate', label: 'Yes - Real Estate' },
      { value: 'yes_equipment', label: 'Yes - Equipment/Inventory' },
      { value: 'yes_other', label: 'Yes - Other Assets' },
      { value: 'limited', label: 'Limited Collateral' },
      { value: 'no', label: 'No Collateral Available' },
    ],
  },
  {
    id: 'creditScore',
    title: 'What is your estimated personal credit score?',
    options: [
      { value: '<=600', label: '600 or below' },
      { value: '600-660', label: '600-660' },
      { value: '660-720', label: '660-720' },
      { value: '720+', label: '720 or above' },
      { value: 'unknown', label: "I don't know" },
    ],
  },
];

export default function PreCheck() {
  const navigate = useNavigate();
  const { setMatchedProgram, setStatus } = useAppStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    yearsInBusiness: '',
    revenue: '',
    useOfFunds: '',
    employees: '',
    collateral: '',
    creditScore: '',
  });

  const currentQuestion = QUESTIONS[currentStep];
  const progress = ((currentStep + 1) / QUESTIONS.length) * 100;
  const isStepComplete = formData[currentQuestion.id as keyof FormData] !== '';

  const handleNext = () => {
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Process results and determine program
      const program = determineBestProgram(formData);
      setMatchedProgram(program);
      setStatus('consent');
      navigate('/sba/consent');
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate('/sba');
    }
  };

  const handleValueChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  };

  const determineBestProgram = (data: FormData): "7a" | "504" | "microloan" | "express" => {
    // Simple rule-based matching
    if (data.useOfFunds === 'real_estate' && data.revenue !== '<100k') {
      return '504';
    }
    
    if (data.revenue === '<100k' || data.employees === '0' || data.employees === '1-5') {
      return 'microloan';
    }
    
    if (data.creditScore === '720+' && (data.useOfFunds === 'working_capital' || data.useOfFunds === 'equipment')) {
      return 'express';
    }
    
    return '7a'; // Default recommendation
  };

  const getProgramInfo = (program: string) => {
    const programs = {
      '7a': { name: 'SBA 7(a) Loan', description: 'Most versatile SBA loan program' },
      '504': { name: 'SBA 504 Loan', description: 'Perfect for real estate and equipment' },
      'microloan': { name: 'SBA Microloan', description: 'Ideal for small businesses and startups' },
      'express': { name: 'SBA Express Loan', description: 'Fast approval for qualified businesses' },
    };
    return programs[program as keyof typeof programs];
  };

  // Show results if we've completed all questions
  if (currentStep === QUESTIONS.length) {
    const recommendedProgram = determineBestProgram(formData);
    const programInfo = getProgramInfo(recommendedProgram);

    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 py-8 px-4">
        <div className="container mx-auto max-w-2xl">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
              <CardTitle className="text-2xl text-white">
                Pre-Qualification Complete!
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-green-400 mb-2">
                  Recommended Program
                </h3>
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <h4 className="text-lg font-bold text-white">{programInfo.name}</h4>
                  <p className="text-slate-300">{programInfo.description}</p>
                </div>
              </div>

              <div className="text-sm text-slate-400 space-y-2">
                <p>This recommendation is based on your business profile.</p>
                <p>The final program will be determined during the full application process.</p>
              </div>

              <div className="flex gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep(0)}
                  className="flex-1 border-slate-600 text-slate-300"
                >
                  Retake Quiz
                </Button>
                <Button 
                  onClick={handleNext}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Continue to Application
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 py-8 px-4">
      <div className="container mx-auto max-w-2xl">
        <div className="mb-8">
          <SectionTitle subtitle="Answer a few questions to find the best SBA program for your business">
            SBA Pre-Qualification
          </SectionTitle>
          
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-sm text-slate-400">
              <span>Step {currentStep + 1} of {QUESTIONS.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-xl text-white">
              {currentQuestion.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup 
              value={formData[currentQuestion.id as keyof FormData]} 
              onValueChange={handleValueChange}
              className="space-y-3"
            >
              {currentQuestion.options.map((option) => (
                <div key={option.value} className="flex items-center space-x-3">
                  <RadioGroupItem 
                    value={option.value} 
                    id={option.value}
                    className="border-slate-600 text-green-500"
                  />
                  <Label 
                    htmlFor={option.value}
                    className="text-slate-300 cursor-pointer flex-1 py-2"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>

            <div className="flex justify-between pt-6 border-t border-slate-700">
              <Button
                variant="outline"
                onClick={handlePrevious}
                className="border-slate-600 text-slate-300"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {currentStep === 0 ? 'Back to Home' : 'Previous'}
              </Button>
              
              <Button
                onClick={handleNext}
                disabled={!isStepComplete}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                {currentStep === QUESTIONS.length - 1 ? 'See Results' : 'Next'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}