import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { generateFAQSchema } from '@/utils/seo';
import { useEffect } from 'react';

const faqs = [
  {
    question: "How long does credit repair take?",
    answer: "Timelines vary based on profile complexity, documentation, and creditor response. Most engagements span 90–180 days, with the first dispute round typically prepared within the opening weeks of enrollment. Results vary by client profile, documentation, creditor response, and reporting accuracy."
  },
  {
    question: "Is credit repair legal? Do you serve all 50 states?",
    answer: "Yes. Credit restoration services are legal and Express Credit & Financial Solutions supports clients in all 50 states. The Credit Repair Organizations Act (CROA) and the Fair Credit Reporting Act (FCRA) give every U.S. consumer the right to dispute inaccurate, incomplete, or unverifiable information on their credit reports. Our process is structured around those federal frameworks and applicable state credit-services regulations."
  },
  {
    question: "Do you help clients get approved for a home loan or mortgage?",
    answer: "We provide mortgage readiness support: reviewing your credit profile against mortgage scorecards (FICO 2/4/5), guiding utilization and account-mix decisions, and coordinating documentation with your selected loan officer through the application process. Approval decisions are made by lenders. Results vary by client profile, documentation, creditor response, and reporting accuracy."
  },
  {
    question: "Do you work with realtors and lenders?",
    answer: "Yes. Our featured Texas real estate partner is Tiara Smith (Tiara Has The Key). We also coordinate with agents from United Real Estate, Keller Williams Realty, Coldwell Banker, eXp Realty, and Compass, and maintain working relationships with banks and credit unions for mortgage, auto, and business financing conversations."
  },
  {
    question: "Can you help me qualify for an auto loan?",
    answer: "We offer auto financing preparation: reviewing your credit profile against auto scorecards, guiding debt and utilization decisions, and preparing documentation for the lender conversation. Final approval, rate, and term decisions are made by the dealer or credit union."
  },
  {
    question: "What is Metro 2 compliance?",
    answer: "Metro 2 is the industry-standard format furnishers use to report account information to the credit bureaus. Our dispute preparation reviews account data against Metro 2 formatting and FCRA requirements so that inaccurate, incomplete, or unverifiable items can be properly challenged."
  },
  {
    question: "How much does professional credit repair cost?",
    answer: "Our ChexSystems Removal service is $349.99, Full Credit Restoration is $1,499.99, and Tradeline placement support ranges from $499 to $1,499. Flexible payment options are available. Service options are selected based on the scope of your credit profile and goals."
  },
  {
    question: "Can you guarantee credit score improvements?",
    answer: "No legitimate provider can guarantee a specific credit score outcome, and we do not. Our work focuses on disputing inaccurate, incomplete, or unverifiable items and supporting a healthier credit profile over time. Results vary by client profile, documentation, creditor response, and reporting accuracy."
  },
  {
    question: "What types of negative items can be removed?",
    answer: "Items that may be disputed include late payments, collections, charge-offs, repossessions, foreclosures, bankruptcies, judgments, tax liens, and credit inquiries. Under FCRA guidelines, any item that is inaccurate, incomplete, outdated, or unverifiable can be challenged. Removal is determined by the furnisher and bureau response."
  },
  {
    question: "Do I have to live near your office to work with you?",
    answer: "No. Express Credit & Financial Solutions supports clients nationwide through our secure online portal. We are headquartered in Frisco, Texas, and offer in-person consultations by appointment for local clients. All services are available remotely across the United States."
  },
  {
    question: "What is the difference between credit repair and credit counseling?",
    answer: "Credit restoration focuses on identifying and disputing inaccurate, incomplete, or unverifiable items on your credit report under FCRA guidelines. Credit counseling focuses on budgeting and debt management. We provide credit restoration and structured financial guidance, not debt-management plans."
  },
  {
    question: "Will credit repair hurt my credit score?",
    answer: "Disputing inaccurate information is a consumer right protected under the FCRA and does not, by itself, lower your credit score. We do not recommend strategies that would intentionally harm your credit profile."
  },
  {
    question: "What documents do I need to get started?",
    answer: "To begin, you will need recent credit reports from all three bureaus (Equifax, Experian, TransUnion), a government-issued ID, and proof of address. Our onboarding team will guide you through securely obtaining your reports if you do not have them yet."
  }
];

export const FAQSection = () => {
  useEffect(() => {
    // Add FAQ structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-schema', 'faq');
    script.textContent = JSON.stringify(generateFAQSchema(faqs));
    document.head.appendChild(script);

    return () => {
      const existingScript = document.querySelector('script[data-schema="faq"]');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

  return (
    <section className="py-16 sm:py-20 md:py-24 px-5 sm:px-10 md:px-12" style={{ backgroundColor: 'transparent' }}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-10 sm:mb-12 text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] mb-3" style={{ color: '#c9a84c' }}>Questions & Answers</p>
          <h2 className="font-serif-display text-3xl sm:text-4xl md:text-6xl tracking-tight leading-[1.05]" style={{ color: '#f5f0e0' }}>
            Frequently Asked <span className="italic" style={{ color: '#c9a84c' }}>Questions</span>
          </h2>
          <p className="text-sm sm:text-base max-w-2xl mx-auto mt-4 font-light leading-relaxed" style={{ color: 'rgba(245,240,224,0.65)' }}>
            Clear answers to the questions clients ask before beginning their credit readiness review.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Accordion type="single" collapsible className="space-y-0">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border-0 border-t px-2 last:border-b"
                style={{ borderColor: 'rgba(201,168,76,0.18)' }}
              >
                <AccordionTrigger className="text-left font-work text-sm sm:text-base font-medium py-5 sm:py-6 leading-snug hover:no-underline" style={{ color: '#f5f0e0' }}>
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="font-light pb-6 text-sm sm:text-[15px] leading-[1.7]" style={{ color: 'rgba(245,240,224,0.7)' }}>
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};
