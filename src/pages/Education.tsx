import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlayCircle, BookOpen, Download, Scale, Shield, AlertTriangle, FileText, Gavel, Brain, MessageSquare, TestTube } from "lucide-react";
import { NavigationHeader } from "@/components/NavigationHeader";
import { OpenAITestPanel } from "@/components/OpenAITestPanel";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { BackButton } from '@/components/BackButton';

const educationItems = [
  {
    title: "Understanding Your Credit Report",
    type: "Interactive Guide",
    duration: "15 min",
    description: "Learn how to identify FCRA violations and inaccuracies that creditors hope you'll miss.",
    icon: FileText,
    level: "Essential",
    category: "Credit Reports"
  },
  {
    title: "FCRA Rights and Protections",
    type: "Legal Guide",
    duration: "20 min", 
    description: "Know your rights under federal law and how creditors commonly violate them without consequences.",
    icon: Scale,
    level: "Essential",
    category: "Legal Rights"
  },
  {
    title: "Dealing with Collections",
    type: "Action Plan",
    duration: "18 min",
    description: "Stop illegal collection practices and enforce your FDCPA rights that many don't know exist.",
    icon: Shield,
    level: "Intermediate",
    category: "Collections"
  },
  {
    title: "Credit Laws and Regulations", 
    type: "Legal Overview",
    duration: "25 min",
    description: "Comprehensive overview of laws protecting consumers from creditor abuses and violations.",
    icon: Gavel,
    level: "Advanced",
    category: "Legal Rights"
  },
  {
    title: "Dispute Letter Strategies",
    type: "Templates & Guide",
    duration: "12 min",
    description: "Legally compliant dispute strategies that creditors must respond to under federal law.",
    icon: BookOpen,
    level: "Intermediate", 
    category: "Disputes"
  },
  {
    title: "Credit Building and Protection",
    type: "Strategy Guide",
    duration: "22 min",
    description: "Build credit while protecting yourself from creditor violations and unauthorized reporting.",
    icon: AlertTriangle,
    level: "Intermediate",
    category: "Credit Building"
  }
];

const categories = ["All", "Legal Rights", "Credit Reports", "Collections", "Disputes", "Credit Building"];

export default function Education() {
  const { session } = useAuth();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedItem, setSelectedItem] = useState<typeof educationItems[0] | null>(null);
  const [content, setContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAILearningOpen, setIsAILearningOpen] = useState(false);
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [learningGoal, setLearningGoal] = useState("");
  const [currentSituation, setCurrentSituation] = useState("");
  const [aiContent, setAiContent] = useState<string>("");
  const [isAILoading, setIsAILoading] = useState(false);

  const filteredItems = selectedCategory === "All" 
    ? educationItems 
    : educationItems.filter(item => item.category === selectedCategory);

  const handleItemClick = async (item: typeof educationItems[0]) => {
    setSelectedItem(item);
    setIsDialogOpen(true);
    setIsLoading(true);
    setContent("");

    try {
      const { data, error } = await supabase.functions.invoke('education-content', {
        body: {
          topic: item.title,
          contentType: item.type.toLowerCase()
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;

      setContent(data.content);
    } catch (error) {
      console.error('Error loading content:', error);
      
      // Provide fallback content for each topic
      const fallbackContent = getFallbackContent(item.title);
      setContent(fallbackContent);
      
      toast({
        title: "Using Offline Content",
        description: "AI content generation is currently unavailable. Showing stored educational content.",
        variant: "default"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getFallbackContent = (title: string): string => {
    const fallbackContents: Record<string, string> = {
      "Understanding Your Credit Report": `# Understanding Your Credit Report

## What is a Credit Report?
Your credit report is a detailed record of your credit history maintained by credit reporting agencies (Equifax, Experian, and TransUnion). Understanding how to read and interpret this document is crucial for maintaining good credit health.

## Key Sections to Review:

### 1. Personal Information
- Full name, current and previous addresses
- Social Security number
- Date of birth
- Employment information

**Red Flags to Watch For:**
- Incorrect personal details
- Addresses you've never lived at
- Wrong employment information

### 2. Account Information
- Credit cards, loans, mortgages
- Account status (open, closed, paid off)
- Payment history
- Credit limits and balances

**Common Errors:**
- Accounts that aren't yours
- Incorrect payment history
- Wrong account status
- Inaccurate balances or limits

### 3. Public Records
- Bankruptcies, tax liens, judgments
- These can significantly impact your score

### 4. Inquiries
- Hard inquiries (affect your score)
- Soft inquiries (don't affect your score)

## Your Rights Under FCRA:
- Right to accurate information
- Right to dispute inaccuracies
- Right to free annual credit reports
- Right to know who accessed your report

## Action Steps:
1. Review your report thoroughly every 4 months
2. Document any errors you find
3. Dispute inaccuracies immediately
4. Follow up on dispute outcomes
5. Monitor your credit regularly

Remember: Credit reporting agencies have 30 days to investigate disputes and must remove or correct inaccurate information.`,

      "FCRA Rights and Protections": `# Fair Credit Reporting Act (FCRA) Rights and Protections

## Overview
The Fair Credit Reporting Act (FCRA) is a federal law that regulates how consumer credit information is collected, shared, and used. Understanding your rights under this law is essential for protecting your credit.

## Key FCRA Rights:

### 1. Right to Accurate Information (Section 1681e)
- Credit reporting agencies must follow reasonable procedures to ensure accuracy
- Information must be verifiable and current
- Agencies cannot report information they know or should know is inaccurate

### 2. Right to Dispute (Section 1681i)
- You can dispute any information you believe is inaccurate
- Agencies must investigate within 30 days
- If information cannot be verified, it must be removed

### 3. Right to Free Credit Reports (Section 1681j)
- One free report annually from each agency
- Additional free reports in certain circumstances
- Access through AnnualCreditReport.com

### 4. Maximum Reporting Periods (Section 1681c)
- Most negative information: 7 years
- Bankruptcies: 10 years
- Unpaid tax liens: 7 years from payment
- Student loan defaults: 7 years from rehabilitation

## Common FCRA Violations by Creditors:
- Reporting inaccurate information
- Failure to investigate disputes properly
- Continuing to report information after being notified of inaccuracy
- Not updating information after successful disputes
- Mixing files between consumers

## Legal Remedies:
- Actual damages for willful violations
- Statutory damages up to $1,000
- Punitive damages in cases of willful violations
- Attorney fees and costs

## How to Protect Yourself:
1. Monitor your credit reports regularly
2. Dispute errors immediately in writing
3. Keep detailed records of all communications
4. Follow up on incomplete investigations
5. Know when to seek legal help

The FCRA is a powerful tool for consumers - use it to protect your credit rights.`,

      "Dealing with Collections": `# Dealing with Collections: Your Rights Under FDCPA

## Fair Debt Collection Practices Act (FDCPA)
The FDCPA protects consumers from abusive debt collection practices. Knowing these rights can help you deal with collectors effectively.

## Key FDCPA Protections:

### 1. Debt Validation Rights (Section 1692g)
- Collectors must provide written notice within 5 days of first contact
- Notice must include amount owed, creditor name, and your rights
- You have 30 days to dispute the debt in writing
- If disputed, collection must stop until verification is provided

### 2. Prohibited Practices (Sections 1692d-f)
**Harassment:**
- Repeated phone calls intended to annoy
- Calling before 8 AM or after 9 PM
- Using profane or abusive language
- Threatening violence or illegal actions

**False Representations:**
- Claiming to be attorneys or government agents
- Misrepresenting the amount owed
- Threatening legal action they cannot take
- False threats of arrest or wage garnishment

### 3. Communication Restrictions
- Cannot contact you at work if told not to
- Cannot contact third parties about your debt (except spouse/attorney)
- Must stop calling if you request in writing

## Credit Reporting Violations:
- Reporting debt without proper verification
- Continuing to report after successful dispute
- Re-aging old debts
- Reporting incorrect amounts or status

## Statute of Limitations:
- Varies by state (typically 3-6 years)
- Collectors cannot sue after statute expires
- Making payments can restart the clock
- Know your state's laws

## Action Steps:
1. Request debt validation in writing within 30 days
2. Keep detailed records of all contact
3. Never admit the debt is yours unless certain
4. Know your state's statute of limitations
5. Report violations to CFPB and state attorney general

## When Collection is Legitimate:
- Request payment plans in writing
- Get "paid in full" agreements before paying
- Ensure accurate credit reporting after resolution

Remember: You have rights even when you owe money. Use the FDCPA to protect yourself from illegal collection practices.`,

      "Credit Laws and Regulations": `# Consumer Credit Laws and Regulations

## Overview
Multiple federal laws protect consumers in credit transactions. Understanding these laws helps you recognize when your rights are being violated.

## Major Federal Credit Laws:

### 1. Fair Credit Reporting Act (FCRA)
- Regulates credit reporting agencies
- Ensures accuracy of credit information
- Provides dispute rights and remedies

### 2. Fair Debt Collection Practices Act (FDCPA)
- Protects from abusive collection practices
- Requires debt validation procedures
- Limits collector contact methods

### 3. Equal Credit Opportunity Act (ECOA)
- Prohibits credit discrimination
- Based on race, gender, age, religion, national origin
- Requires adverse action notices

### 4. Fair Credit Billing Act (FCBA)
- Protects against billing errors
- Provides dispute procedures for credit cards
- Limits liability for unauthorized charges

### 5. Truth in Lending Act (TILA)
- Requires disclosure of credit terms
- Provides right of rescission
- Regulates credit advertising

## Consumer Financial Protection Bureau (CFPB)
- Enforces federal consumer financial laws
- Handles consumer complaints
- Issues guidance and regulations

## Recent Enforcement Actions:
- Medical debt reporting restrictions
- Credit card late fee limitations
- Buy now, pay later oversight
- Junk fee elimination initiatives

## State Laws:
- Many states have additional protections
- Credit repair organization laws
- Identity theft protections
- Enhanced collection restrictions

## How Laws Work Together:
- FCRA ensures accurate reporting
- FDCPA prevents abusive collection
- ECOA prevents discrimination
- FCBA protects billing rights

## Enforcement Mechanisms:
- File complaints with CFPB
- Contact state attorney general
- Private lawsuits for violations
- Class action remedies

## Staying Protected:
1. Know your rights under each law
2. Document all credit-related communications
3. Report violations to appropriate agencies
4. Consider legal action for serious violations
5. Stay informed about regulatory changes

These laws exist to protect you - use them effectively to maintain your credit rights.`,

      "Dispute Letter Strategies": `# Effective Dispute Letter Strategies

## Legal Foundation
Dispute letters are protected under Section 1681i of the Fair Credit Reporting Act (FCRA). Credit reporting agencies must investigate disputes within 30 days.

## Essential Components of Dispute Letters:

### 1. Clear Identification
- Full name and address
- Social Security number (last 4 digits)
- Date of birth
- Account numbers in question

### 2. Specific Dispute Information
- Clearly identify each item being disputed
- Explain why the information is incorrect
- Request specific action (removal, correction, update)

### 3. Supporting Documentation
- Copy of credit report with disputed items highlighted
- Supporting evidence (payment records, correspondence)
- Identity verification documents

## Effective Dispute Strategies:

### 1. Method of Verification Disputes
- Challenge the reporting agency's verification process
- Request proof of proper investigation procedures
- Question the adequacy of verification methods

### 2. Procedural Violations
- Point out FCRA timeline violations
- Challenge incomplete investigations
- Address failure to provide required notices

### 3. Data Integrity Challenges
- Question the source of reported information
- Challenge the accuracy of account details
- Dispute reporting beyond statutory time limits

## Sample Language:
"Please investigate the following items on my credit report, which I dispute as inaccurate under Section 1681i of the FCRA. I request verification of your investigation procedures and source documentation."

## Follow-Up Procedures:
1. Send via certified mail with return receipt
2. Keep copies of all correspondence
3. Track the 30-day investigation timeline
4. Review results thoroughly
5. Re-dispute if investigation was inadequate

## Advanced Strategies:

### 1. Reinvestigation Requests
- If first dispute fails, challenge the investigation quality
- Request detailed information about verification procedures
- Point out specific investigation failures

### 2. Source Document Requests
- Ask for copies of contracts or agreements
- Request proof of assignment for collection accounts
- Challenge chain of custody documentation

### 3. Escalation Procedures
- File complaints with CFPB for violations
- Contact state attorney general
- Consider legal action for willful violations

## Common Mistakes to Avoid:
- Using generic dispute templates
- Disputing too many items at once
- Not following up on incomplete investigations
- Accepting "verified" without proper documentation

## Timeline Enforcement:
- Agencies have 30 days to complete investigation
- 5 additional days to notify you of results
- Immediate removal required if information cannot be verified
- Updated credit report must be provided within 5 days

Remember: Persistence and proper documentation are key to successful disputes. The FCRA gives you powerful tools - use them effectively.`,

      "Credit Building and Protection": `# Credit Building and Protection Strategies

## Foundation Principles
Building credit while protecting your rights requires understanding both scoring factors and legal protections under federal law.

## Credit Scoring Factors:

### 1. Payment History (35%)
- Most important factor in credit scoring
- Pay all bills on time, every time
- Even one late payment can significantly impact scores

### 2. Credit Utilization (30%)
- Keep balances below 30% of credit limits
- Optimal utilization is below 10%
- Consider multiple payments per month

### 3. Length of Credit History (15%)
- Keep older accounts open
- Authorized user status on family accounts
- Be patient - time helps scores

### 4. Credit Mix (10%)
- Mix of credit cards, installment loans, mortgages
- Don't open accounts just for mix
- Natural diversity is best

### 5. New Credit (10%)
- Limit new credit applications
- Rate shopping for mortgages/auto loans within 14-45 days
- Understand impact of hard inquiries

## Building Credit Safely:

### 1. Secured Credit Cards
- Great for building or rebuilding credit
- Choose cards that report to all three bureaus
- Graduate to unsecured cards when possible

### 2. Credit Builder Loans
- Loan proceeds held while you make payments
- Payments reported to credit bureaus
- Builds payment history and savings

### 3. Authorized User Strategy
- Added to someone else's account
- Their payment history appears on your report
- Choose accounts with excellent payment history

## Protection Strategies:

### 1. Regular Monitoring
- Check reports every 4 months (rotate bureaus)
- Use free annual reports from AnnualCreditReport.com
- Consider credit monitoring services

### 2. Identity Theft Protection
- Place fraud alerts when necessary
- Consider credit freezes for maximum protection
- Monitor accounts for unauthorized activity

### 3. FCRA Compliance Monitoring
- Watch for inaccurate reporting
- Dispute errors immediately
- Document all credit-related communications

## Advanced Protection Techniques:

### 1. Goodwill Letters
- Request removal of accurate but negative items
- Appeal to creditor's goodwill for isolated incidents
- Best for customers with good payment history

### 2. Pay-for-Delete Negotiations
- Negotiate removal in exchange for payment
- Get agreements in writing before paying
- Understand this may violate some creditor policies

### 3. Statute of Limitations Management
- Know your state's statute of limitations
- Avoid inadvertently restarting the clock
- Don't let old debts be reported as new

## Common Protection Mistakes:
- Closing old credit cards
- Ignoring credit reports
- Not disputing obvious errors
- Making payments without verification
- Falling for credit repair scams

## Long-term Strategy:
1. Establish a solid payment history
2. Keep utilization low consistently
3. Maintain old accounts responsibly
4. Monitor and protect your credit actively
5. Understand your rights and use them

## Emergency Procedures:
- Identity theft: Place fraud alerts immediately
- Billing errors: Follow FCBA dispute procedures
- Collection issues: Use FDCPA protections
- Credit reporting errors: File FCRA disputes

Building credit is a marathon, not a sprint. Combine good credit habits with active protection of your rights under federal law for the best results.`
    };

    return fallbackContents[title] || `# ${title}

Educational content for this topic is currently being updated. Please check back soon for comprehensive information about ${title.toLowerCase()}.

In the meantime, you can:
- Contact our support team for specific questions
- Review other available educational topics
- Use our dispute center for immediate credit repair needs

We apologize for any inconvenience and appreciate your patience as we enhance our educational resources.`;
  };

  const handleAILearning = async () => {
    if (!learningGoal.trim()) return;
    
    setIsAILoading(true);
    setAiContent("");

    try {
      const { data, error } = await supabase.functions.invoke('education-content', {
        body: {
          topic: `Personalized Learning: ${learningGoal}`,
          contentType: 'personalized_learning',
          userSituation: currentSituation || undefined,
          customPrompt: `Create comprehensive, professional educational content about: ${learningGoal}. 
          ${currentSituation ? `The user's current situation: ${currentSituation}.` : ''}
          
          Provide detailed, actionable guidance that covers:
          - Step-by-step instructions
          - Legal rights and protections
          - Common mistakes to avoid
          - Professional strategies
          - Real-world examples
          - Next steps to take
          
          Make this content highly valuable, professional, and specifically tailored to their learning goal and situation.`
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;

      setAiContent(data.content);
      
      toast({
        title: "AI Learning Content Generated",
        description: "Your personalized learning content has been created successfully.",
        variant: "default"
      });
    } catch (error) {
      console.error('Error generating AI content:', error);
      
      // Provide intelligent fallback content based on the learning goal
      const fallbackContent = generateFallbackAIContent(learningGoal, currentSituation);
      setAiContent(fallbackContent);
      
      toast({
        title: "Using Enhanced Content",
        description: "AI generation is currently unavailable. Showing comprehensive educational content.",
        variant: "default"
      });
    } finally {
      setIsAILoading(false);
    }
  };

  const generateFallbackAIContent = (goal: string, situation: string): string => {
    const lowerGoal = goal.toLowerCase();
    
    if (lowerGoal.includes('dispute') || lowerGoal.includes('remove') || lowerGoal.includes('delete')) {
      return `# Personalized Dispute Strategy Guide

## Your Learning Goal: ${goal}
${situation ? `## Your Current Situation:\n${situation}\n` : ''}

## Professional Dispute Strategy

### 1. Foundation: Understanding Your Rights
Under the Fair Credit Reporting Act (FCRA), you have the legal right to dispute any information on your credit report that you believe is inaccurate, incomplete, or unverifiable.

### 2. Strategic Approach
**Initial Assessment:**
- Review all three credit reports (Equifax, Experian, TransUnion)
- Identify all inaccurate, outdated, or unverifiable items
- Document each error with specific details

**Professional Dispute Letters:**
- Be specific about what's wrong with each item
- Request "method of verification" for collections
- Challenge the completeness of the investigation
- Use certified mail with return receipt

### 3. Advanced Techniques
**Data Integrity Challenges:**
- Question the source of the information
- Request original contracts or agreements
- Challenge chain of custody for sold/transferred accounts

**Procedural Violations:**
- Monitor 30-day investigation timelines
- Document inadequate investigation responses
- File CFPB complaints for violations

### 4. Legal Leverage Points
- Section 1681e(b): Reasonable procedures for accuracy
- Section 1681i: Reinvestigation requirements
- Section 1681s-2(b): Furnisher obligations

### 5. Professional Follow-Up
If disputes are "verified" without proper documentation:
- Request method of verification details
- Challenge inadequate investigations
- Consider legal consultation for willful violations

### Next Steps:
1. Gather all credit reports and documentation
2. Create detailed dispute timeline
3. Send professional dispute letters
4. Monitor responses and escalate if necessary
5. Document everything for potential legal action

Remember: Persistence and proper documentation are key to successful disputes.`;
    }

    if (lowerGoal.includes('build') || lowerGoal.includes('improve') || lowerGoal.includes('increase')) {
      return `# Personalized Credit Building Strategy

## Your Learning Goal: ${goal}
${situation ? `## Your Current Situation:\n${situation}\n` : ''}

## Professional Credit Building Plan

### 1. Credit Score Factors (Priority Order)
**Payment History (35% of score):**
- Pay ALL bills on time, every time
- Even one late payment can drop scores 60-110 points
- Set up autopay for minimum payments

**Credit Utilization (30% of score):**
- Keep total utilization below 10% for optimal scores
- Pay down balances before statement dates
- Consider multiple payments per month

### 2. Strategic Account Management
**Existing Accounts:**
- Keep old accounts open (increases average age)
- Use cards occasionally to keep them active
- Request credit limit increases every 6 months

**New Credit Strategy:**
- Limit new applications (hard inquiries hurt scores)
- Consider secured cards if building from scratch
- Become authorized user on family member's account

### 3. Advanced Building Techniques
**Credit Builder Loans:**
- Bank holds loan proceeds while you make payments
- Builds payment history and savings simultaneously
- Graduate to traditional loans after completion

**Mixed Credit Types:**
- Installment loans (auto, personal)
- Revolving credit (credit cards)
- Mortgage (when ready)

### 4. Protection While Building
**Monitor Progress:**
- Check reports every 4 months (rotate bureaus)
- Use credit monitoring services
- Dispute any errors immediately

**Identity Protection:**
- Freeze credit when not applying
- Monitor for unauthorized accounts
- Place fraud alerts if needed

### 5. Timeline Expectations
- 30-60 days: New accounts appear on reports
- 3-6 months: Payment history establishes pattern
- 6-12 months: Significant score improvements
- 2+ years: Prime credit qualification

### Professional Tips:
- Never close your oldest credit card
- Keep utilization reporting low but not zero
- Pay twice monthly to manage utilization
- Understand credit mix doesn't mean opening unnecessary accounts

### Next Steps:
1. Assess current credit reports for errors
2. Optimize existing account usage
3. Create systematic payment schedule
4. Plan new credit strategically
5. Monitor progress monthly

${situation && situation.includes('collection') ? `

### Special Consideration for Collections:
Since you mentioned collections, prioritize:
1. Validate all collection debts in writing
2. Negotiate pay-for-delete agreements
3. Don't restart statute of limitations
4. Know your state's laws` : ''}

Building excellent credit is a marathon, not a sprint. Consistency and strategic planning yield the best results.`;
    }

    if (lowerGoal.includes('law') || lowerGoal.includes('rights') || lowerGoal.includes('legal')) {
      return `# Understanding Your Credit Rights and Legal Protections

## Your Learning Goal: ${goal}
${situation ? `## Your Current Situation:\n${situation}\n` : ''}

## Federal Credit Laws That Protect You

### 1. Fair Credit Reporting Act (FCRA)
**Your Key Rights:**
- Accurate information on credit reports
- Free annual credit reports from each bureau
- 30-day dispute investigation requirement
- Removal of unverifiable information

**Common Violations:**
- Reporting inaccurate information after notification
- Inadequate dispute investigations
- Mixing consumer files
- Reporting beyond statutory time limits

**Legal Remedies:**
- Actual damages for willful violations
- Statutory damages up to $1,000
- Punitive damages for willful violations
- Attorney fees and costs

### 2. Fair Debt Collection Practices Act (FDCPA)
**Collector Restrictions:**
- Cannot harass or abuse you
- Cannot use false or misleading statements
- Cannot contact you at inconvenient times (before 8 AM or after 9 PM)
- Must provide debt validation upon request

**Your Rights:**
- Request debt validation within 30 days
- Dispute debts in writing
- Stop collection calls by written request
- Sue for violations (up to $1,000 + damages)

### 3. Equal Credit Opportunity Act (ECOA)
**Prohibited Discrimination:**
- Race, color, religion, national origin
- Sex or marital status
- Age (if you're over 18)
- Receipt of public assistance

**Required Notices:**
- Adverse action notices with specific reasons
- Right to request reasons for denial
- Right to copy of appraisal

### 4. Truth in Lending Act (TILA)
**Disclosure Requirements:**
- Annual Percentage Rate (APR)
- Finance charges
- Payment schedule
- Total cost of credit

**Your Rights:**
- Right of rescission (3-day cancellation for home loans)
- Protection from unfair billing practices
- Limits on liability for unauthorized charges

### 5. Fair Credit Billing Act (FCBA)
**Billing Error Rights:**
- Dispute billing errors within 60 days
- Creditor must investigate within 30 days
- Cannot report as delinquent during dispute
- Must correct errors or explain why bill is correct

### Professional Strategy for Violations

**Documentation Requirements:**
- Keep all communications in writing
- Use certified mail for important correspondence
- Maintain detailed records of violations
- Screenshot or save digital communications

**Escalation Process:**
1. Document the violation clearly
2. Contact the violating party in writing
3. File complaints with CFPB and state attorney general
4. Consider legal action for serious violations
5. Consult with consumer protection attorney

**When to Seek Legal Help:**
- Multiple FCRA violations
- Willful violations with damages
- Collector harassment or threats
- Identity theft issues
- Discrimination in credit decisions

### Real-World Application

**Scenario Planning:**
- Collection calls: Use FDCPA protections
- Credit report errors: File FCRA disputes
- Billing problems: Use FCBA procedures
- Loan denials: Request ECOA reasons

**Professional Enforcement:**
- Know violation penalties
- Understand statute of limitations for legal action
- Keep detailed violation logs
- Build cases systematically

### Next Steps:
1. Review current credit reports for FCRA violations
2. Document any ongoing collection issues
3. File appropriate complaints for violations
4. Consider legal consultation for significant damages
5. Use knowledge proactively to prevent future violations

Remember: These laws exist to protect you. Use them actively and strategically to maintain your credit rights.`;
    }

    // Default comprehensive content
    return `# Personalized Credit Education: ${goal}
${situation ? `## Your Current Situation:\n${situation}\n` : ''}

## Comprehensive Credit Education Strategy

### Understanding Your Specific Need
Based on your learning goal, here's a tailored approach to help you master this aspect of credit management.

### Foundation Knowledge
**Credit Basics:**
- Credit reports vs. credit scores
- How information flows between creditors and bureaus
- Impact of different types of accounts
- Timing of reporting and updates

### Your Rights Under Federal Law
**Fair Credit Reporting Act (FCRA):**
- Right to accurate information
- Right to dispute inaccuracies
- 30-day investigation requirement
- Right to free annual reports

**Fair Debt Collection Practices Act (FDCPA):**
- Protection from harassment
- Right to debt validation
- Restrictions on collector contact
- Legal remedies for violations

### Practical Application
**Immediate Actions:**
1. Obtain all three credit reports
2. Review for errors and inaccuracies
3. Document any issues found
4. Create action plan for improvements

**Strategic Planning:**
- Set specific, measurable goals
- Create timeline for improvements
- Identify potential obstacles
- Plan for setbacks and adjustments

### Professional Strategies
**Advanced Techniques:**
- Method of verification disputes
- Goodwill letters for isolated issues
- Pay-for-delete negotiations
- Strategic account management

**Legal Considerations:**
- Know your state's statute of limitations
- Understand when to seek legal help
- Document potential violations
- Know enforcement agencies

### Common Mistakes to Avoid
- Ignoring credit reports
- Not disputing obvious errors
- Closing old credit accounts
- Making payments without validation
- Falling for credit repair scams

### Measuring Progress
**Key Metrics:**
- Credit score improvements
- Number of errors removed
- Payment history consistency
- Credit utilization optimization

**Timeline Expectations:**
- 30-60 days: Dispute results
- 3-6 months: Score improvements
- 6-12 months: Significant progress
- 1-2 years: Prime credit qualification

### Next Steps
1. Apply this knowledge to your specific situation
2. Create detailed action plan
3. Begin implementation immediately
4. Monitor progress regularly
5. Adjust strategy as needed

### Additional Resources
- Consumer Financial Protection Bureau (CFPB)
- Federal Trade Commission (FTC) guidance
- State attorney general resources
- Consumer protection attorneys

This personalized content addresses your specific learning goal while providing comprehensive, actionable guidance for your credit improvement journey.`;
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Essential": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "Intermediate": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "Advanced": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  return (
    <div className="min-h-screen midnight-theme">
      <NavigationHeader />
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center gap-4 mb-8">
          <BackButton />
          <div className="midnight-header p-8 rounded-lg">
            <h1 className="text-4xl font-bold midnight-section-title midnight-glow-text mb-4">
              Credit Education Center
            </h1>
            <p className="text-lg text-midnight-text max-w-3xl">
              Discover your rights under federal credit laws and learn how creditors commonly violate consumer protections. 
              Knowledge is power in credit repair.
            </p>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
              className="mb-2"
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Education Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {filteredItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <Card 
                key={index} 
                className="card-elegant hover-lift cursor-pointer transition-all duration-300 border-l-4 border-l-accent" 
                onClick={() => handleItemClick(item)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                      <Icon className="w-6 h-6 text-accent" />
                    </div>
                    <Badge className={getLevelColor(item.level)}>
                      {item.level}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl text-foreground mb-2">{item.title}</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary">{item.type}</Badge>
                      <span className="text-sm">{item.duration}</span>
                    </div>
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0">
                  <p className="text-sm text-foreground mb-4 leading-relaxed">{item.description}</p>
                  <Button variant="outline" size="sm" className="w-full group">
                    <span className="group-hover:mr-2 transition-all">Learn Your Rights</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <Card className="max-w-3xl mx-auto card-elegant">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center justify-center gap-2">
                <Shield className="h-6 w-6 text-accent" />
                Protect Your Credit Rights
              </CardTitle>
              <CardDescription className="text-muted-foreground text-lg">
                Don't let creditors take advantage of your lack of knowledge about federal protections. 
                Learn the laws that are designed to protect you.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-accent/5 rounded-lg">
                  <Scale className="h-8 w-8 text-accent mx-auto mb-2" />
                  <h3 className="font-semibold">Know Your Rights</h3>
                  <p className="text-sm text-muted-foreground">Under FCRA, FDCPA, and ECOA</p>
                </div>
                <div className="text-center p-4 bg-accent/5 rounded-lg">
                  <AlertTriangle className="h-8 w-8 text-accent mx-auto mb-2" />
                  <h3 className="font-semibold">Spot Violations</h3>
                  <p className="text-sm text-muted-foreground">Identify when creditors break the law</p>
                </div>
                <div className="text-center p-4 bg-accent/5 rounded-lg">
                  <Gavel className="h-8 w-8 text-accent mx-auto mb-2" />
                  <h3 className="font-semibold">Enforce Protection</h3>
                  <p className="text-sm text-muted-foreground">Take action against violations</p>
                </div>
              </div>
              <div className="flex justify-center">
                <Button 
                  className="max-w-xs" 
                  size="lg"
                  onClick={() => setIsAILearningOpen(true)}
                >
                  <Brain className="mr-2 h-5 w-5" />
                  Start AI-Powered Learning Today
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Content Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedItem?.icon && <selectedItem.icon className="h-5 w-5 text-accent" />}
              {selectedItem?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedItem?.type} • {selectedItem?.duration} • {selectedItem?.level} Level
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh] pr-4">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            ) : (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <div className="whitespace-pre-wrap leading-relaxed">
                  {content}
                </div>
              </div>
            )}
          </ScrollArea>
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Close
            </Button>
            <Button disabled={isLoading}>
              {isLoading ? "Loading..." : "Bookmark"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI-Powered Learning Dialog */}
      <Dialog open={isAILearningOpen} onOpenChange={setIsAILearningOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-accent" />
              AI-Powered Personalized Learning
            </DialogTitle>
            <DialogDescription>
              Get customized credit education based on your specific situation and goals
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[70vh] pr-4">
            {!aiContent && !isAILoading ? (
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="learning-goal" className="text-sm font-medium">
                    What do you want to learn about? (e.g., "How to dispute incorrect items", "Understanding credit laws", "Building credit fast")
                  </Label>
                  <Textarea
                    id="learning-goal"
                    placeholder="I want to learn how to..."
                    value={learningGoal}
                    onChange={(e) => setLearningGoal(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="current-situation" className="text-sm font-medium">
                    Describe your current credit situation (optional - helps personalize the content)
                  </Label>
                  <Textarea
                    id="current-situation"
                    placeholder="I have collections on my report, my score is 580, I was denied for credit..."
                    value={currentSituation}
                    onChange={(e) => setCurrentSituation(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
                
                <Button 
                  onClick={handleAILearning}
                  disabled={!learningGoal.trim() || isAILoading}
                  className="w-full"
                  size="lg"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Generate Personalized Learning Content
                </Button>
              </div>
            ) : isAILoading ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-accent">
                  <Brain className="h-5 w-5 animate-pulse" />
                  <span className="text-sm">AI is analyzing your needs and creating personalized content...</span>
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="h-4 w-4 text-accent" />
                    <span className="text-sm font-medium text-accent">AI-Generated Content</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This content was specifically created for your learning goals and situation
                  </p>
                </div>
                
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {aiContent}
                  </div>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setAiContent("");
                      setLearningGoal("");
                      setCurrentSituation("");
                    }}
                    className="flex-1"
                  >
                    Ask Another Question
                  </Button>
                  <Button 
                    onClick={() => setIsAILearningOpen(false)}
                    className="flex-1"
                  >
                    Save & Close
                  </Button>
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* OpenAI Test Panel Dialog */}
      <Dialog open={showTestPanel} onOpenChange={setShowTestPanel}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5 text-accent" />
              OpenAI Integration Testing
            </DialogTitle>
            <DialogDescription>
              Test your OpenAI API integration for the chatbot and education content features
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[75vh] pr-4">
            <OpenAITestPanel />
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}