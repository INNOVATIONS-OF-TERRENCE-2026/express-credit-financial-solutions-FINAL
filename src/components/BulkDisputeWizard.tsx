import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Wand2, FileText, Eye, Download } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

interface FlaggedAccount {
  id: string;
  creditor_name: string;
  account_number: string;
  account_type: string;
  balance: number;
  flag_reason: string;
  flag_confidence: number;
  status: string;
  user_id: string;
}

interface DisputeTemplate {
  id: string;
  name: string;
  content: string;
}

interface GeneratedLetter {
  accountId: string;
  creditorName: string;
  accountNumber: string;
  letter: string;
  disputeId?: string;
}

export function BulkDisputeWizard() {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [flaggedAccounts, setFlaggedAccounts] = useState<FlaggedAccount[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [generatedLetters, setGeneratedLetters] = useState<GeneratedLetter[]>([]);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewLetter, setPreviewLetter] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const templates: DisputeTemplate[] = [
    {
      id: 'not_mine',
      name: 'Account Not Mine',
      content: 'This account does not belong to me and should be removed from my credit report.'
    },
    {
      id: 'paid_full',
      name: 'Paid in Full',
      content: 'This account was paid in full and should reflect the correct status.'
    },
    {
      id: 'incorrect_amount',
      name: 'Incorrect Amount',
      content: 'The balance or payment information for this account is incorrect.'
    },
    {
      id: 'outdated',
      name: 'Outdated Account',
      content: 'This account is past the statute of limitations and should be removed.'
    },
    {
      id: 'duplicate',
      name: 'Duplicate Account',
      content: 'This is a duplicate entry for an existing account.'
    }
  ];

  useEffect(() => {
    if (open) {
      fetchFlaggedAccounts();
    }
  }, [open]);

  const fetchFlaggedAccounts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('flagged_disputes')
        .select('*')
        .eq('user_id', user.id)
        .eq('admin_approved', true)
        .eq('dispute_letter_generated', false)
        .order('flag_confidence', { ascending: false });

      if (error) throw error;
      setFlaggedAccounts(data || []);
    } catch (error) {
      console.error('Error fetching flagged accounts:', error);
      toast.error('Failed to fetch flagged accounts');
    }
  };

  const handleAccountToggle = (accountId: string) => {
    setSelectedAccounts(prev => 
      prev.includes(accountId) 
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    );
  };

  const selectAllAccounts = () => {
    setSelectedAccounts(flaggedAccounts.map(acc => acc.id));
  };

  const clearSelection = () => {
    setSelectedAccounts([]);
  };

  const previewSingleLetter = async (account: FlaggedAccount) => {
    const template = templates.find(t => t.id === selectedTemplate);
    if (!template) {
      toast.error('Please select a template first');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('preview-dispute-letter', {
        body: {
          creditorName: account.creditor_name,
          accountNumber: account.account_number,
          issueType: template.name,
          additionalNotes: `${template.content}\n\n${customNotes}`.trim()
        }
      });

      if (error) throw error;

      if (data.success) {
        setPreviewLetter(data.letter);
        setShowPreview(true);
      } else {
        throw new Error(data.error || 'Failed to generate preview');
      }
    } catch (error) {
      console.error('Error generating preview:', error);
      toast.error('Failed to generate letter preview');
    }
  };

  const generateAllLetters = async () => {
    const template = templates.find(t => t.id === selectedTemplate);
    if (!template || selectedAccounts.length === 0) {
      toast.error('Please select accounts and a template');
      return;
    }

    setGenerating(true);
    setProgress(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const letters: GeneratedLetter[] = [];
      const disputeLetterInserts = [];
      const timelineEntries = [];

      for (let i = 0; i < selectedAccounts.length; i++) {
        const accountId = selectedAccounts[i];
        const account = flaggedAccounts.find(acc => acc.id === accountId);
        if (!account) continue;

        // Generate letter content
        const { data, error } = await supabase.functions.invoke('generate-dispute-letter', {
          body: {
            creditorName: account.creditor_name,
            accountNumber: account.account_number,
            issueType: template.name,
            additionalNotes: `${template.content}\n\n${customNotes}`.trim()
          }
        });

        if (error) {
          console.error(`Error generating letter for ${account.creditor_name}:`, error);
          continue;
        }

        // Create dispute letter entry
        const disputeLetterData = {
          user_id: user.id,
          creditor_name: account.creditor_name,
          account_number: account.account_number,
          issue_type: template.name,
          additional_notes: `${template.content}\n\n${customNotes}`.trim(),
          generated_letter: data.letter || '',
          dispute_reason: 'Bulk dispute generation',
          letter_title: `Bulk Dispute - ${account.creditor_name}`
        };

        disputeLetterInserts.push(disputeLetterData);
        
        letters.push({
          accountId,
          creditorName: account.creditor_name,
          accountNumber: account.account_number,
          letter: data.letter || ''
        });

        setProgress(((i + 1) / selectedAccounts.length) * 50);
      }

      // Insert all dispute letters
      const { data: insertedLetters, error: insertError } = await supabase
        .from('dispute_letters')
        .insert(disputeLetterInserts)
        .select('id');

      if (insertError) throw insertError;

      // Create timeline entries
      if (insertedLetters) {
        for (let i = 0; i < insertedLetters.length; i++) {
          const letterId = insertedLetters[i].id;
          const account = flaggedAccounts.find(acc => acc.id === selectedAccounts[i]);
          if (account) {
            const deadlineDate = new Date();
            deadlineDate.setDate(deadlineDate.getDate() + 30);

            timelineEntries.push({
              user_id: user.id,
              dispute_letter_id: letterId,
              creditor_name: account.creditor_name,
              account_number: account.account_number,
              date_generated: new Date().toISOString(),
              status: 'generated',
              deadline_date: deadlineDate.toISOString()
            });

            letters[i].disputeId = letterId;
          }
        }

        // Insert timeline entries
        const { error: timelineError } = await supabase
          .from('dispute_timeline')
          .insert(timelineEntries);

        if (timelineError) {
          console.error('Error creating timeline entries:', timelineError);
        }
      }

      // Mark flagged disputes as having letters generated
      const { error: updateError } = await supabase
        .from('flagged_disputes')
        .update({ dispute_letter_generated: true })
        .in('id', selectedAccounts);

      if (updateError) {
        console.error('Error updating flagged disputes:', updateError);
      }

      setProgress(100);
      setGeneratedLetters(letters);
      setCurrentStep(3);

      toast.success(`Successfully generated ${letters.length} dispute letters`);

    } catch (error) {
      console.error('Error generating bulk letters:', error);
      toast.error('Failed to generate dispute letters');
    } finally {
      setGenerating(false);
    }
  };

  const downloadAllPDFs = () => {
    generatedLetters.forEach(letter => {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const margin = 20;
      
      const splitText = doc.splitTextToSize(letter.letter, pageWidth - 2 * margin);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.text(splitText, margin, margin);
      
      const fileName = `Bulk_Dispute_${letter.creditorName.replace(/[^a-z0-9]/gi, '_')}.pdf`;
      doc.save(fileName);
    });
    
    toast.success(`Downloaded ${generatedLetters.length} PDF files`);
  };

  const resetWizard = () => {
    setCurrentStep(1);
    setSelectedAccounts([]);
    setSelectedTemplate('');
    setCustomNotes('');
    setGeneratedLetters([]);
    setProgress(0);
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Select Accounts to Dispute</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={selectAllAccounts}>
            Select All ({flaggedAccounts.length})
          </Button>
          <Button size="sm" variant="outline" onClick={clearSelection}>
            Clear Selection
          </Button>
        </div>
      </div>

      {flaggedAccounts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            No approved flagged accounts found. Upload a credit report to get AI-flagged disputes.
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {flaggedAccounts.map((account) => (
            <div key={account.id} className="flex items-center space-x-3 p-3 border rounded-lg">
              <Checkbox
                id={account.id}
                checked={selectedAccounts.includes(account.id)}
                onCheckedChange={() => handleAccountToggle(account.id)}
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{account.creditor_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Account: {account.account_number} • Type: {account.account_type}
                    </p>
                    <p className="text-xs text-muted-foreground">{account.flag_reason}</p>
                  </div>
                  <div className="text-right">
                    <Badge className="mb-1">
                      {(account.flag_confidence * 100).toFixed(0)}% confidence
                    </Badge>
                    <p className="text-sm font-medium">
                      {account.balance ? `$${account.balance.toFixed(2)}` : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between pt-4">
        <p className="text-sm text-muted-foreground">
          {selectedAccounts.length} account{selectedAccounts.length !== 1 ? 's' : ''} selected
        </p>
        <Button 
          onClick={() => setCurrentStep(2)} 
          disabled={selectedAccounts.length === 0}
        >
          Next: Select Template
        </Button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Select Dispute Template</h3>
      
      <div className="space-y-2">
        <Label htmlFor="template">Dispute Template</Label>
        <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a dispute template" />
          </SelectTrigger>
          <SelectContent>
            {templates.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                {template.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedTemplate && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm">
              {templates.find(t => t.id === selectedTemplate)?.content}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="custom-notes">Additional Notes (Optional)</Label>
        <Textarea
          id="custom-notes"
          value={customNotes}
          onChange={(e) => setCustomNotes(e.target.value)}
          placeholder="Add any additional information or specific details for all disputes..."
          rows={4}
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground">
          {customNotes.length}/500 characters
        </p>
      </div>

      {selectedTemplate && selectedAccounts.length > 0 && (
        <div className="border rounded-lg p-3">
          <h4 className="font-medium mb-2">Preview Sample Letter</h4>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => previewSingleLetter(flaggedAccounts.find(acc => selectedAccounts.includes(acc.id))!)}
            className="flex items-center gap-1"
          >
            <Eye className="h-4 w-4" />
            Preview Letter
          </Button>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={() => setCurrentStep(1)}>
          Back
        </Button>
        <Button 
          onClick={generateAllLetters}
          disabled={!selectedTemplate || selectedAccounts.length === 0 || generating}
        >
          {generating ? 'Generating...' : `Generate ${selectedAccounts.length} Letter${selectedAccounts.length !== 1 ? 's' : ''}`}
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Generated Letters</h3>
      
      <div className="text-center space-y-4">
        <div className="text-green-600">
          <FileText className="h-12 w-12 mx-auto mb-2" />
          <p className="text-lg font-medium">
            Successfully generated {generatedLetters.length} dispute letters!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
          {generatedLetters.map((letter, index) => (
            <div key={index} className="p-3 border rounded-lg">
              <p className="font-medium text-sm">{letter.creditorName}</p>
              <p className="text-xs text-muted-foreground">Account: {letter.accountNumber}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-2">
          <Button onClick={downloadAllPDFs} className="flex items-center gap-1">
            <Download className="h-4 w-4" />
            Download All PDFs
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
          <Button variant="outline" onClick={resetWizard}>
            Start Over
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Button onClick={() => setOpen(true)} className="flex items-center gap-2">
        <Wand2 className="h-4 w-4" />
        Bulk Dispute Wizard
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Dispute Wizard</DialogTitle>
            <DialogDescription>
              Generate multiple dispute letters at once from AI-flagged accounts
            </DialogDescription>
          </DialogHeader>

          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-2">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                1
              </div>
              <div className={`flex-1 h-0.5 ${
                currentStep > 1 ? 'bg-primary' : 'bg-muted'
              }`} />
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                2
              </div>
              <div className={`flex-1 h-0.5 ${
                currentStep > 2 ? 'bg-primary' : 'bg-muted'
              }`} />
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                currentStep >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                3
              </div>
            </div>
            
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Select Accounts</span>
              <span>Choose Template</span>
              <span>Generate & Download</span>
            </div>
          </div>

          {generating && (
            <div className="space-y-2 mb-6">
              <Progress value={progress} className="w-full" />
              <p className="text-center text-sm text-muted-foreground">
                Generating dispute letters... {Math.round(progress)}%
              </p>
            </div>
          )}

          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Letter Preview</DialogTitle>
            <DialogDescription>
              Preview of the dispute letter that will be generated
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-muted rounded-lg">
            <pre className="whitespace-pre-wrap text-sm">{previewLetter}</pre>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}