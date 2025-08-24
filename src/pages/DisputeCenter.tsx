import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { NavigationHeader } from '@/components/NavigationHeader';
import { Download, FileText, Plus, Mail, PenTool } from 'lucide-react';
import jsPDF from 'jspdf';
import { useAuditLog } from '@/hooks/useAuditLog';
import { sanitizeInput, sanitizeAccountNumber, sanitizeDisputeContent, validateDisputeFormData } from '@/utils/inputValidation';
import { useRoles } from '@/hooks/useRoles';
import { useMembership } from '@/hooks/useMembership';
import { EnhancedCreditReportUpload } from '@/components/EnhancedCreditReportUpload';
import { FlaggedDisputesTable } from '@/components/FlaggedDisputesTable';
import { BulkDisputeWizard } from '@/components/BulkDisputeWizard';
import { DigitalSignature } from '@/components/DigitalSignature';
import { MailingLabelGenerator } from '@/components/MailingLabelGenerator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Eye, Sparkles } from 'lucide-react';
import { BackButton } from '@/components/BackButton';

interface DisputeLetter {
  id: string;
  creditor_name: string;
  account_number: string;
  issue_type: string;
  additional_notes: string | null;
  generated_letter: string | null;
  created_at: string;
  signature_url?: string | null;
}

export function DisputeCenter() {
  const [disputes, setDisputes] = useState<DisputeLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showLetterPreview, setShowLetterPreview] = useState(false);
  const [previewLetter, setPreviewLetter] = useState<string>('');
  const [selectedCreditors, setSelectedCreditors] = useState<string[]>([]);
  const [uploadedReports, setUploadedReports] = useState([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewingDispute, setPreviewingDispute] = useState<DisputeLetter | null>(null);
  const [previewGenerating, setPreviewGenerating] = useState(false);
  const [aiPreviewGenerating, setAiPreviewGenerating] = useState<string | null>(null);
  const [showAiPreviewModal, setShowAiPreviewModal] = useState(false);
  const [aiPreviewText, setAiPreviewText] = useState('');
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null);
  const [showMailingModal, setShowMailingModal] = useState(false);
  const { toast } = useToast();
  const { logDisputeLetterGeneration } = useAuditLog();
  const { isAdmin } = useRoles();
  const { hasAccess } = useMembership();

  const [newDispute, setNewDispute] = useState({
    creditor_name: '',
    account_number: '',
    issue_type: '',
    additional_notes: ''
  });

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('dispute_letters')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDisputes(data || []);
    } catch (error) {
      console.error('Error fetching disputes:', error);
      toast({
        title: "Error",
        description: "Failed to load disputes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateLetter = async (disputeId: string) => {
    setGeneratingId(disputeId);
    try {
      const { data, error } = await supabase.functions.invoke('generate-dispute-letter-secure', {
        body: { disputeId }
      });

      if (error) throw error;

      // Show preview first
      setPreviewLetter(data.letter);
      setShowLetterPreview(true);
      
      // Log the letter generation
      const dispute = disputes.find(d => d.id === disputeId);
      if (dispute) {
        await logDisputeLetterGeneration(disputeId, dispute.creditor_name);
      }
    } catch (error) {
      console.error('Error generating letter:', error);
      toast({
        title: "Error",
        description: "Failed to generate dispute letter",
        variant: "destructive",
      });
    } finally {
      setGeneratingId(null);
    }
  };

  const confirmAndSaveLetter = async () => {
    try {
      // Save the letter to the dispute record
      const disputeId = disputes.find(d => generatingId === d.id)?.id;
      if (disputeId) {
        const { error } = await supabase
          .from('dispute_letters')
          .update({ generated_letter: previewLetter })
          .eq('id', disputeId);

        if (error) throw error;

        await fetchDisputes();
        toast({
          title: "Success",
          description: "Dispute letter saved successfully",
        });
      }
    } catch (error) {
      console.error('Error saving letter:', error);
      toast({
        title: "Error",
        description: "Failed to save letter",
        variant: "destructive",
      });
    } finally {
      setShowLetterPreview(false);
      setPreviewLetter('');
    }
  };

  const validateDisputeForm = (): boolean => {
    const validation = validateDisputeFormData({
      creditorName: newDispute.creditor_name,
      accountNumber: newDispute.account_number,
      issueType: newDispute.issue_type,
      additionalNotes: newDispute.additional_notes
    });

    if (!validation.isValid) {
      const errors: Record<string, string> = {};
      validation.errors.forEach(error => {
        if (error.includes('Creditor name')) errors.creditor_name = error;
        if (error.includes('Account number')) errors.account_number = error;
        if (error.includes('Issue type')) errors.issue_type = error;
        if (error.includes('Additional notes')) errors.additional_notes = error;
      });
      setValidationErrors(errors);
    }

    return validation.isValid;
  };

  const createDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateDisputeForm()) {
      toast({
        title: "Validation Error",
        description: "Please correct the errors in the form",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Please log in to create disputes');

      // Sanitize inputs before storing
      const sanitizedDispute = {
        user_id: user.id,
        creditor_name: sanitizeInput(newDispute.creditor_name),
        account_number: sanitizeAccountNumber(newDispute.account_number),
        issue_type: sanitizeInput(newDispute.issue_type),
        additional_notes: newDispute.additional_notes ? sanitizeDisputeContent(newDispute.additional_notes) : null,
        generated_letter: null,
        dispute_reason: 'User created dispute',
        letter_title: `Dispute for ${sanitizeInput(newDispute.creditor_name)}`
      };

      const { error } = await supabase
        .from('dispute_letters')
        .insert(sanitizedDispute);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Dispute created successfully!",
      });

      setNewDispute({
        creditor_name: '',
        account_number: '',
        issue_type: '',
        additional_notes: ''
      });
      setValidationErrors({});
      setShowForm(false);
      await fetchDisputes();
    } catch (error) {
      console.error('Error creating dispute:', error);
      toast({
        title: "Error",
        description: "Failed to create dispute",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const previewDisputeLetter = async (dispute: DisputeLetter) => {
    setPreviewGenerating(true);
    setPreviewingDispute(dispute);
    
    try {
      const { data, error } = await supabase.functions.invoke('preview-dispute-letter', {
        body: {
          creditorName: dispute.creditor_name,
          accountNumber: dispute.account_number,
          issueType: dispute.issue_type,
          additionalNotes: dispute.additional_notes
        }
      });

      if (error) throw error;

      if (data.success) {
        setPreviewLetter(data.letter);
        setShowPreviewModal(true);
      } else {
        throw new Error(data.error || 'Failed to generate preview');
      }
    } catch (error) {
      console.error('Error generating preview:', error);
      toast({
        title: "Error",
        description: "Failed to generate letter preview",
        variant: "destructive",
      });
    } finally {
      setPreviewGenerating(false);
    }
  };

  const generateAiPreview = async (dispute: DisputeLetter) => {
    setAiPreviewGenerating(dispute.id);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-letter-preview', {
        body: {
          letterId: dispute.id,
          letterTitle: `${dispute.issue_type} dispute for ${dispute.creditor_name}`,
          violationNotes: dispute.additional_notes || `Dispute regarding ${dispute.issue_type.toLowerCase()} issue with account ${dispute.account_number}`,
          creditorName: dispute.creditor_name,
          issueType: dispute.issue_type
        }
      });

      if (error) throw error;

      if (data.success) {
        setAiPreviewText(data.preview);
        setShowAiPreviewModal(true);
      } else {
        setAiPreviewText(data.preview || "Preview unavailable. Please contact support.");
        setShowAiPreviewModal(true);
      }
    } catch (error) {
      console.error('Error generating AI preview:', error);
      toast({
        title: "Error",
        description: "Failed to generate AI preview",
        variant: "destructive",
      });
    } finally {
      setAiPreviewGenerating(null);
    }
  };

  const getIssueTypeBadge = (issueType: string) => {
    const colors: Record<string, string> = {
      'Not Mine': 'bg-red-100 text-red-800',
      'Paid in Full': 'bg-green-100 text-green-800',
      'Incorrect Amount': 'bg-yellow-100 text-yellow-800',
      'Outdated': 'bg-blue-100 text-blue-800',
      'Other': 'bg-gray-100 text-gray-800',
    };
    
    return (
      <Badge className={colors[issueType] || colors['Other']}>
        {issueType}
      </Badge>
    );
  };

  const handleSignatureSaved = async (signatureUrl: string) => {
    if (!selectedDisputeId) return;

    try {
      const { error } = await supabase
        .from('dispute_letters')
        .update({ signature_url: signatureUrl })
        .eq('id', selectedDisputeId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Signature saved to dispute letter",
      });

      await fetchDisputes();
    } catch (error) {
      console.error('Error saving signature to dispute:', error);
      toast({
        title: "Error",
        description: "Failed to save signature",
        variant: "destructive",
      });
    }
  };

  const downloadSignedPDF = async (dispute: DisputeLetter) => {
    if (!dispute.generated_letter) {
      toast({
        title: "Error",
        description: "No generated letter to download",
        variant: "destructive",
      });
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    
    // Add letter content
    const splitText = doc.splitTextToSize(dispute.generated_letter, pageWidth - 2 * margin);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(splitText, margin, margin);
    
    // Add signature if available
    if (dispute.signature_url) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 60;
        const imgHeight = (img.height / img.width) * imgWidth;
        const yPos = doc.internal.pageSize.height - margin - imgHeight - 10;
        
        doc.addImage(imgData, 'PNG', margin, yPos, imgWidth, imgHeight);
        
        const fileName = `Signed_Dispute_${dispute.creditor_name.replace(/[^a-z0-9]/gi, '_')}.pdf`;
        doc.save(fileName);
        
        toast({
          title: "Success",
          description: "Signed PDF downloaded successfully",
        });
      };
      img.src = dispute.signature_url;
    } else {
      const fileName = `Dispute_Letter_${dispute.creditor_name.replace(/[^a-z0-9]/gi, '_')}.pdf`;
      doc.save(fileName);
      
      toast({
        title: "Success", 
        description: "PDF downloaded successfully",
      });
    }
  };

  const downloadPDF = (dispute: DisputeLetter) => {
    // Now use downloadSignedPDF instead
    downloadSignedPDF(dispute);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading disputes...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <BackButton />
              <div>
                <h1 className="text-3xl font-bold text-foreground">Dispute Center</h1>
                <p className="text-muted-foreground mt-2">
                  Manage your credit disputes and generate FCRA-compliant letters
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <BulkDisputeWizard />
              <Button 
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                {showForm ? 'Cancel' : 'Create New Dispute'}
              </Button>
            </div>
          </div>
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create New Dispute</CardTitle>
              <CardDescription>
                Enter the details for your credit dispute
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={createDispute} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="creditor_name">Creditor Name *</Label>
                    <Input
                      id="creditor_name"
                      value={newDispute.creditor_name}
                      onChange={(e) => {
                        setNewDispute(prev => ({...prev, creditor_name: e.target.value}));
                        if (validationErrors.creditor_name) {
                          setValidationErrors(prev => ({...prev, creditor_name: ''}));
                        }
                      }}
                      placeholder="e.g., Capital One"
                      className={validationErrors.creditor_name ? 'border-red-500' : ''}
                      required
                    />
                    {validationErrors.creditor_name && (
                      <p className="text-sm text-red-500">{validationErrors.creditor_name}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account_number">Account Number *</Label>
                    <Input
                      id="account_number"
                      value={newDispute.account_number}
                      onChange={(e) => {
                        setNewDispute(prev => ({...prev, account_number: e.target.value}));
                        if (validationErrors.account_number) {
                          setValidationErrors(prev => ({...prev, account_number: ''}));
                        }
                      }}
                      placeholder="Last 4 digits or full number"
                      className={validationErrors.account_number ? 'border-red-500' : ''}
                      maxLength={20}
                      required
                    />
                    {validationErrors.account_number && (
                      <p className="text-sm text-red-500">{validationErrors.account_number}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="issue_type">Issue Type *</Label>
                  <Select value={newDispute.issue_type} onValueChange={(value) => {
                    setNewDispute(prev => ({...prev, issue_type: value}));
                    if (validationErrors.issue_type) {
                      setValidationErrors(prev => ({...prev, issue_type: ''}));
                    }
                  }}>
                    <SelectTrigger className={validationErrors.issue_type ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select the type of issue" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Not Mine">Not Mine - Account does not belong to me</SelectItem>
                      <SelectItem value="Paid in Full">Paid in Full - Account was already paid</SelectItem>
                      <SelectItem value="Incorrect Amount">Incorrect Amount - Wrong balance or payment</SelectItem>
                      <SelectItem value="Outdated">Outdated - Should have fallen off credit report</SelectItem>
                      <SelectItem value="Duplicate">Duplicate - Multiple entries for same account</SelectItem>
                      <SelectItem value="Other">Other - Custom issue</SelectItem>
                    </SelectContent>
                  </Select>
                  {validationErrors.issue_type && (
                    <p className="text-sm text-red-500">{validationErrors.issue_type}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="additional_notes">Additional Notes</Label>
                  <Textarea
                    id="additional_notes"
                    value={newDispute.additional_notes}
                    onChange={(e) => {
                      setNewDispute(prev => ({...prev, additional_notes: e.target.value}));
                      if (validationErrors.additional_notes) {
                        setValidationErrors(prev => ({...prev, additional_notes: ''}));
                      }
                    }}
                    placeholder="Any additional details about this dispute..."
                    className={validationErrors.additional_notes ? 'border-red-500' : ''}
                    rows={3}
                    maxLength={1000}
                  />
                  {validationErrors.additional_notes && (
                    <p className="text-sm text-red-500">{validationErrors.additional_notes}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {newDispute.additional_notes.length}/1000 characters
                  </p>
                </div>
                <Button type="submit" disabled={creating} className="w-full">
                  {creating ? 'Creating...' : 'Create Dispute'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Credit Report Upload Section */}
        <EnhancedCreditReportUpload />

        {/* AI-Flagged Disputes Section */}
        <div className="mb-6">
          <FlaggedDisputesTable />
        </div>

        {/* Letter Preview Dialog */}
        <Dialog open={showLetterPreview} onOpenChange={setShowLetterPreview}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Dispute Letter Preview</DialogTitle>
              <DialogDescription>
                Review your generated dispute letter before saving
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm">{previewLetter}</pre>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowLetterPreview(false)}
                >
                  Cancel
                </Button>
                <Button onClick={confirmAndSaveLetter}>
                  Save Letter
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* GPT Preview Modal */}
        <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>AI-Generated Letter Preview</DialogTitle>
              <DialogDescription>
                Preview of your dispute letter generated by AI - you can edit or approve for generation
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm">{previewLetter}</pre>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPreviewModal(false);
                    setPreviewLetter('');
                    setPreviewingDispute(null);
                  }}
                >
                  Close Preview
                </Button>
                <Button 
                  onClick={() => {
                    if (previewingDispute) {
                      generateLetter(previewingDispute.id);
                    }
                    setShowPreviewModal(false);
                    setPreviewLetter('');
                    setPreviewingDispute(null);
                  }}
                >
                  Approve & Generate
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* AI Preview Modal */}
        <Dialog open={showAiPreviewModal} onOpenChange={setShowAiPreviewModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Letter Preview
              </DialogTitle>
              <DialogDescription>
                Simple explanation of what this dispute letter is requesting
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-lg border border-primary/20">
                <p className="text-foreground leading-relaxed">{aiPreviewText}</p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAiPreviewModal(false);
                    setAiPreviewText('');
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Dispute Letters Table
          </CardTitle>
          <CardDescription>
            Your credit dispute letters and their current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {disputes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No disputes found. Create your first dispute to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Creditor Name</TableHead>
                  <TableHead>Account Number</TableHead>
                  <TableHead>Issue Type</TableHead>
                  <TableHead>Additional Notes</TableHead>
                  <TableHead>Letter Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {disputes.map((dispute) => (
                  <TableRow key={dispute.id}>
                    <TableCell className="font-medium">{dispute.creditor_name}</TableCell>
                    <TableCell>****{dispute.account_number.slice(-4)}</TableCell>
                    <TableCell>{getIssueTypeBadge(dispute.issue_type)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {dispute.additional_notes || 'None'}
                    </TableCell>
                    <TableCell>
                      {dispute.generated_letter ? (
                        <Badge className="bg-green-100 text-green-800">Generated</Badge>
                      ) : (
                        <Badge variant="outline">Not Generated</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => previewDisputeLetter(dispute)}
                          disabled={previewGenerating && previewingDispute?.id === dispute.id}
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          {previewGenerating && previewingDispute?.id === dispute.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                              Previewing...
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4" />
                              Preview
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => generateAiPreview(dispute)}
                          disabled={aiPreviewGenerating === dispute.id}
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          {aiPreviewGenerating === dispute.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                              AI Preview...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4" />
                              Preview with AI
                            </>
                          )}
                        </Button>
                        {(isAdmin() || hasAccess('dispute-generator')) ? (
                          <Button
                            onClick={() => generateLetter(dispute.id)}
                            disabled={generatingId === dispute.id}
                            size="sm"
                          >
                            {generatingId === dispute.id ? 'Generating...' : 'Generate Letter'}
                          </Button>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            Pro+ Required
                          </div>
                        )}
                        {dispute.generated_letter && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadSignedPDF(dispute)}
                              className="flex items-center gap-1"
                            >
                              <Download className="h-4 w-4" />
                              Download PDF
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedDisputeId(dispute.id);
                                setShowSignatureModal(true);
                              }}
                              className="flex items-center gap-1"
                            >
                              <PenTool className="h-4 w-4" />
                              {dispute.signature_url ? 'Update Signature' : 'Add Signature'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowMailingModal(true)}
                              className="flex items-center gap-1"
                            >
                              <Mail className="h-4 w-4" />
                              Mailing Label
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        </Card>

        {/* Digital Signature Modal */}
        <DigitalSignature
          open={showSignatureModal}
          onOpenChange={setShowSignatureModal}
          onSignatureSaved={handleSignatureSaved}
          documentTitle={disputes.find(d => d.id === selectedDisputeId)?.creditor_name ? 
            `Dispute Letter - ${disputes.find(d => d.id === selectedDisputeId)?.creditor_name}` : 
            "Dispute Letter"
          }
        />

        {/* Mailing Label Modal */}
        <MailingLabelGenerator
          open={showMailingModal}
          onOpenChange={setShowMailingModal}
        />
      </div>
    </div>
  );
}