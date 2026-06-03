import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { generateFAQSchema } from '@/utils/seo';
import { useEffect } from 'react';

const faqs = [
  {
    question: "How long does credit repair take?",
    answer: "Most clients see improvements within 30-45 days. Complete credit restoration typically takes 3-6 months depending on the number of negative items and complexity of your credit report. Our Fast-5 service delivers results in just 5 days for urgent cases."
  },
  {
    question: "Is credit repair legal in Texas?",
    answer: "Yes, credit repair is 100% legal. The Credit Repair Organizations Act (CROA) and Fair Credit Reporting Act (FCRA) give you the right to dispute inaccurate, incomplete, or unverifiable information on your credit reports. We operate in full compliance with all federal and Texas state laws."
  },
  {
    question: "What is Metro 2 compliance?",
    answer: "Metro 2 is the industry-standard format for reporting credit information to credit bureaus. Our Metro 2 compliant dispute strategies ensure proper formatting and compliance with credit reporting standards, significantly increasing the success rate of disputes."
  },
  {
    question: "How much does credit repair cost in Dallas?",
    answer: "Our packages start at $99.99 for the Gold Basic Package. We offer flexible payment plans through Klarna, Affirm, and CashApp. Professional credit repair is an investment in your financial future that pays for itself through better loan rates and credit opportunities."
  },
  {
    question: "Can you guarantee credit score improvements?",
    answer: "While we cannot guarantee specific score increases (no legitimate company can), 94% of our clients see score improvements within 60 days. We focus on removing inaccurate negative items that are dragging down your score, which naturally leads to score increases."
  },
  {
    question: "What types of negative items can be removed?",
    answer: "We can dispute late payments, collections, charge-offs, repossessions, foreclosures, bankruptcies, judgments, tax liens, and credit inquiries. Any item that is inaccurate, incomplete, outdated, or unverifiable can be challenged under FCRA guidelines."
  },
  {
    question: "Do I need to visit your office in Dallas?",
    answer: "No, everything is done remotely through our secure online portal. However, we're based in Dallas, TX and available for in-person consultations by appointment for local clients who prefer face-to-face service."
  },
  {
    question: "What is the difference between credit repair and credit counseling?",
    answer: "Credit repair focuses on removing inaccurate negative items from your credit report through FCRA dispute processes. Credit counseling focuses on budgeting and debt management. We offer both credit restoration services and financial guidance."
  },
  {
    question: "Will credit repair hurt my credit score?",
    answer: "No, legitimate credit repair cannot hurt your score. Disputing inaccurate information is your legal right. In fact, removing negative items and correcting errors will improve your score. We never recommend actions that could harm your credit."
  },
  {
    question: "What documents do I need to get started?",
    answer: "You'll need a copy of your credit reports from all three bureaus (Equifax, Experian, TransUnion), a government-issued ID, and proof of address. We'll guide you through obtaining your reports if you don't have them yet."
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
    <section className="py-24 px-6 sm:px-12" style={{ backgroundColor: 'transparent' }}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-12 text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] mb-3" style={{ color: '#c9a84c' }}>The Knowledge Index</p>
          <h2 className="font-serif-display text-4xl md:text-6xl tracking-tight" style={{ color: '#f5f0e0' }}>
            Frequently Asked <span className="italic" style={{ color: '#c9a84c' }}>Questions</span>
          </h2>
          <p className="text-base max-w-2xl mx-auto mt-4 font-light" style={{ color: 'rgba(245,240,224,0.65)' }}>
            Answers to the questions our most discerning clients ask before they enroll.
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
                <AccordionTrigger className="text-left font-work text-base font-medium py-6 hover:no-underline" style={{ color: '#f5f0e0' }}>
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="font-light pb-6 text-sm leading-relaxed" style={{ color: 'rgba(245,240,224,0.7)' }}>
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
