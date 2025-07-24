import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { PlayCircle, BookOpen, Download, Scale, Shield, AlertTriangle, FileText, Gavel } from "lucide-react";
import { NavigationHeader } from "@/components/NavigationHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

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

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Essential": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "Intermediate": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "Advanced": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Credit Education Center
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Discover your rights under federal credit laws and learn how creditors commonly violate consumer protections. 
            Knowledge is power in credit repair.
          </p>
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
              <Button className="w-full" size="lg">
                Start Learning Today
              </Button>
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
    </div>
  );
}