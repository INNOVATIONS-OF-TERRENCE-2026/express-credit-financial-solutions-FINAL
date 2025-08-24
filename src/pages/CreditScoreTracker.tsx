import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, TrendingUp, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { NavigationHeader } from '@/components/NavigationHeader';

interface CreditScore {
  id: string;
  client_id: string | null;
  user_id: string;
  bureau: string;
  score: number;
  score_date: string;
  created_at: string;
  updated_at: string;
}

interface ChartDataPoint {
  date: string;
  Experian?: number;
  Equifax?: number;
  TransUnion?: number;
}

export default function CreditScoreTracker() {
  const { user, isAdmin } = useAuth();
  const [scores, setScores] = useState<CreditScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    bureau: '' as 'Experian' | 'Equifax' | 'TransUnion' | '',
    score: '',
    score_date: undefined as Date | undefined,
  });

  useEffect(() => {
    if (user) {
      fetchScores();
    }
  }, [user]);

  useEffect(() => {
    processChartData();
  }, [scores]);

  const fetchScores = async () => {
    try {
      const { data, error } = await supabase
        .from('credit_scores')
        .select('*')
        .eq('user_id', user?.id)
        .order('score_date', { ascending: true });

      if (error) throw error;
      setScores(data || []);
    } catch (error) {
      console.error('Error fetching credit scores:', error);
      toast.error('Failed to fetch credit scores');
    } finally {
      setLoading(false);
    }
  };

  const processChartData = () => {
    const dataMap = new Map<string, ChartDataPoint>();

    scores.forEach(score => {
      const date = score.score_date;
      const bureau = score.bureau as 'Experian' | 'Equifax' | 'TransUnion';
      if (!dataMap.has(date)) {
        dataMap.set(date, { date });
      }
      const point = dataMap.get(date)!;
      point[bureau] = score.score;
    });

    const sortedData = Array.from(dataMap.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    setChartData(sortedData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bureau || !formData.score || !formData.score_date) {
      toast.error('Please fill in all fields');
      return;
    }

    const score = parseInt(formData.score);
    if (score < 300 || score > 850) {
      toast.error('Credit score must be between 300 and 850');
      return;
    }

    try {
      const { error } = await supabase
        .from('credit_scores')
        .insert({
          user_id: user?.id,
          bureau: formData.bureau,
          score: score,
          score_date: format(formData.score_date, 'yyyy-MM-dd'),
        });

      if (error) throw error;

      toast.success('Credit score added successfully');
      setFormData({ bureau: '', score: '', score_date: undefined });
      setShowAddForm(false);
      fetchScores();
    } catch (error) {
      console.error('Error adding credit score:', error);
      toast.error('Failed to add credit score');
    }
  };

  const getLatestScores = () => {
    const latestScores: { [key: string]: any } = {};
    scores.forEach(score => {
      const bureau = score.bureau as 'Experian' | 'Equifax' | 'TransUnion';
      if (!latestScores[bureau] || new Date(score.score_date) > new Date(latestScores[bureau + '_date'] || '1970-01-01')) {
        latestScores[bureau] = score.score;
        latestScores[bureau + '_date'] = score.score_date;
      }
    });
    return latestScores;
  };

  const latestScores = getLatestScores();

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading credit scores...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Credit Score Tracker</h1>
          <p className="text-muted-foreground">
            Monitor your credit scores across all three bureaus over time
          </p>
        </div>

        {/* Latest Scores Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {(['Experian', 'Equifax', 'TransUnion'] as const).map((bureau) => (
            <Card key={bureau}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{bureau}</CardTitle>
                <CardDescription>Latest Score</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="text-3xl font-bold text-primary">
                    {latestScores[bureau] || '--'}
                  </div>
                  {latestScores[bureau] && (
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add Score Button */}
        <div className="mb-6">
          <Button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add New Score
          </Button>
        </div>

        {/* Add Score Form */}
        {showAddForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Add New Credit Score</CardTitle>
              <CardDescription>
                Enter your latest credit score information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bureau">Credit Bureau</Label>
                    <Select 
                      value={formData.bureau} 
                      onValueChange={(value) => setFormData({...formData, bureau: value as any})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select bureau" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Experian">Experian</SelectItem>
                        <SelectItem value="Equifax">Equifax</SelectItem>
                        <SelectItem value="TransUnion">TransUnion</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="score">Credit Score</Label>
                    <Input
                      id="score"
                      type="number"
                      min="300"
                      max="850"
                      value={formData.score}
                      onChange={(e) => setFormData({...formData, score: e.target.value})}
                      placeholder="e.g. 750"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Score Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.score_date ? (
                            format(formData.score_date, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.score_date}
                          onSelect={(date) => setFormData({...formData, score_date: date})}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit">Add Score</Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Credit Score Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Credit Score History</CardTitle>
            <CardDescription>
              Track your credit score progress across all three bureaus
            </CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                  />
                  <YAxis 
                    domain={[300, 850]}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    labelFormatter={(value) => format(new Date(value), 'PPP')}
                    formatter={(value: number, name: string) => [value, name]}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="Experian" 
                    stroke="#e11d48" 
                    strokeWidth={2}
                    dot={{ fill: "#e11d48", strokeWidth: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Equifax" 
                    stroke="#2563eb" 
                    strokeWidth={2}
                    dot={{ fill: "#2563eb", strokeWidth: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="TransUnion" 
                    stroke="#16a34a" 
                    strokeWidth={2}
                    dot={{ fill: "#16a34a", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <TrendingUp className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No Credit Score Data
                </h3>
                <p className="text-muted-foreground mb-4">
                  Start tracking your credit scores by adding your first entry
                </p>
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Score
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}