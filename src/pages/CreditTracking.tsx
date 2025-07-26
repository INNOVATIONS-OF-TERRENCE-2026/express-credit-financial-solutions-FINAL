import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, TrendingUp, TrendingDown, Minus, Calendar, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { BackButton } from '@/components/BackButton';
import { NavigationHeader } from '@/components/NavigationHeader';

interface CreditScore {
  id: string;
  bureau: 'Experian' | 'Equifax' | 'TransUnion';
  score: number;
  date: string;
  notes?: string;
  created_at: string;
}

interface ScoreEntry {
  bureau: string;
  score: number;
  date: string;
  notes: string;
}

export default function CreditTracking() {
  const { toast } = useToast();
  const [scores, setScores] = useState<CreditScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newScore, setNewScore] = useState<ScoreEntry>({
    bureau: '',
    score: 0,
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const bureaus = ['Experian', 'Equifax', 'TransUnion'];

  useEffect(() => {
    loadCreditScores();
  }, []);

  const loadCreditScores = () => {
    try {
      const stored = localStorage.getItem('creditScores');
      if (stored) {
        const parsedScores = JSON.parse(stored);
        setScores(parsedScores.sort((a: CreditScore, b: CreditScore) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        ));
      }
    } catch (error) {
      console.error('Error loading credit scores:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveCreditScores = (updatedScores: CreditScore[]) => {
    localStorage.setItem('creditScores', JSON.stringify(updatedScores));
  };

  const handleAddScore = () => {
    if (!newScore.bureau || !newScore.score || newScore.score < 300 || newScore.score > 850) {
      toast({
        title: "Invalid Input",
        description: "Please fill all fields and ensure score is between 300-850",
        variant: "destructive"
      });
      return;
    }

    const creditScore: CreditScore = {
      id: Date.now().toString(),
      bureau: newScore.bureau as 'Experian' | 'Equifax' | 'TransUnion',
      score: newScore.score,
      date: newScore.date,
      notes: newScore.notes,
      created_at: new Date().toISOString()
    };

    const updatedScores = [creditScore, ...scores];
    setScores(updatedScores);
    saveCreditScores(updatedScores);

    toast({
      title: "Success",
      description: "Credit score added successfully"
    });

    setNewScore({
      bureau: '',
      score: 0,
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setIsDialogOpen(false);
  };

  const getScoreTrend = (bureau: string) => {
    const bureauScores = scores
      .filter(s => s.bureau === bureau)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    if (bureauScores.length < 2) return 'neutral';
    
    const latest = bureauScores[bureauScores.length - 1];
    const previous = bureauScores[bureauScores.length - 2];
    
    if (latest.score > previous.score) return 'up';
    if (latest.score < previous.score) return 'down';
    return 'neutral';
  };

  const getLatestScore = (bureau: string) => {
    const bureauScores = scores.filter(s => s.bureau === bureau);
    return bureauScores.length > 0 ? bureauScores[0] : null;
  };

  const getScoreColor = (score: number) => {
    if (score >= 800) return 'text-green-600';
    if (score >= 740) return 'text-blue-600';
    if (score >= 670) return 'text-yellow-600';
    if (score >= 580) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreRating = (score: number) => {
    if (score >= 800) return 'Excellent';
    if (score >= 740) return 'Very Good';
    if (score >= 670) return 'Good';
    if (score >= 580) return 'Fair';
    return 'Poor';
  };

  // Prepare chart data
  const chartData = scores.reduce((acc, score) => {
    const date = format(new Date(score.date), 'MMM dd');
    const existingDate = acc.find(item => item.date === date);
    
    if (existingDate) {
      existingDate[score.bureau] = score.score;
    } else {
      acc.push({
        date,
        [score.bureau]: score.score,
        fullDate: score.date
      });
    }
    
    return acc;
  }, [] as any[])
  .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime())
  .slice(-12); // Show last 12 data points

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading credit scores...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Credit Score Tracking</h1>
            <p className="text-muted-foreground">Monitor your credit progress across all three bureaus</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Score
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Credit Score</DialogTitle>
                <DialogDescription>
                  Enter your latest credit score from any bureau
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="bureau">Bureau</Label>
                  <Select value={newScore.bureau} onValueChange={(value) => setNewScore({...newScore, bureau: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select bureau" />
                    </SelectTrigger>
                    <SelectContent>
                      {bureaus.map(bureau => (
                        <SelectItem key={bureau} value={bureau}>{bureau}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="score">Credit Score (300-850)</Label>
                  <Input
                    id="score"
                    type="number"
                    min="300"
                    max="850"
                    value={newScore.score || ''}
                    onChange={(e) => setNewScore({...newScore, score: parseInt(e.target.value) || 0})}
                    placeholder="Enter score"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newScore.date}
                    onChange={(e) => setNewScore({...newScore, date: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={newScore.notes}
                    onChange={(e) => setNewScore({...newScore, notes: e.target.value})}
                    placeholder="Any additional notes..."
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddScore}>
                  Add Score
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Current Scores Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {bureaus.map(bureau => {
            const latestScore = getLatestScore(bureau);
            const trend = getScoreTrend(bureau);
            
            return (
              <Card key={bureau} className="card-elegant">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{bureau}</CardTitle>
                    {trend === 'up' && <TrendingUp className="h-5 w-5 text-green-600" />}
                    {trend === 'down' && <TrendingDown className="h-5 w-5 text-red-600" />}
                    {trend === 'neutral' && <Minus className="h-5 w-5 text-gray-400" />}
                  </div>
                </CardHeader>
                <CardContent>
                  {latestScore ? (
                    <div>
                      <div className={`text-3xl font-bold ${getScoreColor(latestScore.score)}`}>
                        {latestScore.score}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {getScoreRating(latestScore.score)}
                        </Badge>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(latestScore.date), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-muted-foreground">
                      No scores recorded
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Score History Chart */}
        {chartData.length > 0 && (
          <Card className="card-elegant mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-accent" />
                Credit Score History
              </CardTitle>
              <CardDescription>Track your progress over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[300, 850]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="Experian" stroke="#8884d8" strokeWidth={2} />
                  <Line type="monotone" dataKey="Equifax" stroke="#82ca9d" strokeWidth={2} />
                  <Line type="monotone" dataKey="TransUnion" stroke="#ffc658" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Recent Score Entries */}
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle>Recent Score Entries</CardTitle>
            <CardDescription>Your latest credit score updates</CardDescription>
          </CardHeader>
          <CardContent>
            {scores.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Bureau</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scores.slice(0, 10).map((score) => (
                    <TableRow key={score.id}>
                      <TableCell>{format(new Date(score.date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{score.bureau}</TableCell>
                      <TableCell>
                        <span className={`font-semibold ${getScoreColor(score.score)}`}>
                          {score.score}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {getScoreRating(score.score)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {score.notes || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No credit scores recorded yet. Click "Add Score" to get started.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}