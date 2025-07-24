import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Star, Award, TrendingUp, CheckCircle, Clock, Users } from 'lucide-react';
interface ContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: 'fcra' | 'legal' | 'rapid';
}
export const ContentModal = ({
  isOpen,
  onClose,
  content
}: ContentModalProps) => {
  const getContent = () => {
    switch (content) {
      case 'fcra':
        return {
          title: "Advanced Credit Investigations Backed by Federal Law",
          content: <div className="space-y-6">
              <p className="text-muted-foreground leading-relaxed">
                Our certified FCRA experts dig deeper than the average dispute. We use compliance tools, legal research, and CFPB insights to identify credit report violations and force accurate updates.
              </p>
              
              <div className="space-y-4">
                <h4 className="font-semibold text-lg flex items-center gap-2">
                  <Star className="h-5 w-5 text-accent" />
                  Here's what we investigate:
                </h4>
                <ul className="space-y-2 ml-7">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                    <span>Outdated bankruptcies, evictions, or public records</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                    <span>Debt reinserted without consumer notification</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                    <span>Incorrect balance updates and payment histories</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                    <span>Collection agencies failing to validate under FCRA § 609</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                    <span>Accounts not verified within 30 days per FCRA § 611</span>
                  </li>
                </ul>
              </div>

              <div className="bg-accent/10 p-4 rounded-lg border-l-4 border-accent">
                <h4 className="font-semibold mb-3">Example Results:</h4>
                <div className="space-y-2 text-sm">
                  <p className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                    14 negative accounts removed in 32 days for an IT professional in Dallas
                  </p>
                  <p className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                    CFPB-backed removal of two reinserted accounts for a military veteran
                  </p>
                  <p className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                    Judgment and charge-off deleted using Section 611(b) verification failure
                  </p>
                </div>
              </div>

              <blockquote className="border-l-4 border-accent pl-4 italic text-muted-foreground">
                "We don't guess — we investigate. Every item is reviewed by certified credit law specialists."
              </blockquote>
            </div>
        };
      case 'legal':
        return {
          title: "What Our Clients Say About Express Credit",
          content: <div className="space-y-6">
              <div className="grid gap-6">
                <div className="bg-accent/5 p-4 rounded-lg border border-accent/20">
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-accent mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold">James B. – HOUSTON, TX</h4>
                      <p className="text-muted-foreground mt-1">
                        "I've tried 3 credit repair companies. This was the only one that actually filed the disputes right. They even found stuff I didn't know was hurting my score!"
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-accent/5 p-4 rounded-lg border border-accent/20">
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-accent mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold">Keisha R. – OMAHA, NE</h4>
                      <p className="text-muted-foreground mt-1">
                        "Express Credit took the legal route and removed 5 collections in 6 weeks. They quoted FCRA codes and backed everything up with real law."
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-accent/5 p-4 rounded-lg border border-accent/20">
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-accent mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold">Devon T. – ADDISON, TX</h4>
                      <p className="text-muted-foreground mt-1">
                        "I respect how transparent and precise they were. They didn't just send letters — they built a legal case around my reports."
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-accent/5 p-4 rounded-lg border border-accent/20">
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-accent mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold">Sandra L. – DALLAS, TX</h4>
                      <p className="text-muted-foreground mt-1">
                        "They showed me violations in my report that even my lawyer missed. Legal Dispute Precision is exactly what they deliver."
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-accent/5 p-4 rounded-lg border border-accent/20">
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-accent mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold">Victor M. – FRISCO, TX</h4>
                      <p className="text-muted-foreground mt-1">
                        "They got my repossession deleted using advanced tactics I'd never heard of. The law works when you know how to use it."
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
        };
      case 'rapid':
        return {
          title: "How We Deliver Results in Weeks — Not Months",
          content: <div className="space-y-6">
              <p className="text-muted-foreground leading-relaxed">
                We understand urgency. Our dispute strategy is designed to maximize speed without compromising compliance. Here's how:
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-accent mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Same-Day Dispute Initiation</h4>
                    <p className="text-muted-foreground">Once documents are uploaded</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Star className="h-5 w-5 text-accent mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Enhanced Dispute Letter Generation</h4>
                    <p className="text-muted-foreground">precision and law-based formatting</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-accent mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Automated Submission</h4>
                    <p className="text-muted-foreground">To all 3 bureaus within 24–48 hours</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Award className="h-5 w-5 text-accent mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Digital & Certified Mail Processing</h4>
                    <p className="text-muted-foreground">Included in All Paid Memberships</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-accent mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Weekly Monitoring</h4>
                    <p className="text-muted-foreground">Of response windows (14–30–45 day checkpoints)</p>
                  </div>
                </div>
              </div>

              <div className="bg-accent/10 p-4 rounded-lg border-l-4 border-accent">
                <h4 className="font-semibold mb-3">Typical Client Timeline:</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Week 1:</strong> Account analysis + dispute letters sent</p>
                  <p><strong>Week 2–3:</strong> Bureaus receive, process, and verify</p>
                  <p><strong>Week 3–5:</strong> Results posted → deletions, updates, or responses</p>
                  <p><strong>Week 5+:</strong> Next round begins (if needed)</p>
                </div>
              </div>

              <blockquote className="border-l-4 border-accent pl-4 italic text-muted-foreground text-center">
                "Time is credit. And we don't waste either."
              </blockquote>
            </div>
        };
      default:
        return {
          title: "",
          content: null
        };
    }
  };
  const {
    title,
    content: modalContent
  } = getContent();
  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-accent">{title}</DialogTitle>
          <DialogDescription asChild>
            <div className="mt-4">
              {modalContent}
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>;
};