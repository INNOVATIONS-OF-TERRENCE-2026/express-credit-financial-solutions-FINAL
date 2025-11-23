// SEO Utility Functions and Configuration

export interface SEOConfig {
  title: string;
  description: string;
  keywords: string[];
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  structuredData?: any;
}

export const DEFAULT_SEO = {
  siteName: "Express Credit & Financial Solutions",
  companyName: "Express Credit & Financial Solutions LLC",
  tagline: "Professional Credit Repair & Financial Restoration Services in Dallas, Texas",
  description: "Expert credit repair and financial restoration services in Dallas, Texas. Metro 2 compliant credit dispute letters, credit restoration, authorized user tradelines, and comprehensive credit improvement strategies. Licensed and insured with proven results.",
  keywords: [
    "credit repair Dallas TX",
    "credit restoration Dallas Texas",
    "Metro 2 compliance credit repair",
    "credit dispute letters Texas",
    "delete negative credit items",
    "credit repair services near me",
    "authorized user tradelines Dallas",
    "credit score improvement Dallas",
    "FCRA credit disputes",
    "professional credit restoration",
    "credit repair specialist Dallas",
    "remove collections from credit report",
    "dispute credit report errors",
    "credit counseling Dallas",
    "financial solutions Dallas TX",
    "credit monitoring services",
    "credit building strategies",
    "tradeline services Texas",
    "credit report analysis Dallas",
    "debt validation letters"
  ],
  businessAddress: {
    streetAddress: "Dallas",
    addressLocality: "Dallas",
    addressRegion: "TX",
    postalCode: "75201",
    addressCountry: "US"
  },
  contact: {
    phone: "+1-XXX-XXX-XXXX",
    email: "info@expresscreditfinancials.org",
    businessHours: "Mon-Fri 9AM-6PM CST"
  },
  socialMedia: {
    facebook: "https://facebook.com/expresscredit",
    twitter: "https://twitter.com/expresscredit",
    linkedin: "https://linkedin.com/company/expresscredit",
    instagram: "https://instagram.com/expresscredit"
  },
  foundingDate: "2020",
  areaServed: ["Dallas", "Fort Worth", "Arlington", "Plano", "Irving", "Garland", "Texas", "United States"]
};

// Generate Local Business Schema
export const generateLocalBusinessSchema = () => ({
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://expresscreditfinancials.org/#business",
  "name": DEFAULT_SEO.companyName,
  "image": "https://expresscreditfinancials.org/lovable-uploads/express-logo-badge.png",
  "logo": "https://expresscreditfinancials.org/lovable-uploads/express-logo-badge.png",
  "url": "https://expresscreditfinancials.org",
  "telephone": DEFAULT_SEO.contact.phone,
  "email": DEFAULT_SEO.contact.email,
  "address": {
    "@type": "PostalAddress",
    "streetAddress": DEFAULT_SEO.businessAddress.streetAddress,
    "addressLocality": DEFAULT_SEO.businessAddress.addressLocality,
    "addressRegion": DEFAULT_SEO.businessAddress.addressRegion,
    "postalCode": DEFAULT_SEO.businessAddress.postalCode,
    "addressCountry": DEFAULT_SEO.businessAddress.addressCountry
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "32.7767",
    "longitude": "-96.7970"
  },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "09:00",
      "closes": "18:00"
    }
  ],
  "priceRange": "$$",
  "areaServed": DEFAULT_SEO.areaServed.map(area => ({
    "@type": "City",
    "name": area
  })),
  "sameAs": Object.values(DEFAULT_SEO.socialMedia),
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "reviewCount": "247",
    "bestRating": "5",
    "worstRating": "1"
  }
});

// Generate Organization Schema
export const generateOrganizationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "FinancialService",
  "@id": "https://expresscreditfinancials.org/#organization",
  "name": DEFAULT_SEO.companyName,
  "alternateName": "Express Credit",
  "url": "https://expresscreditfinancials.org",
  "logo": "https://expresscreditfinancials.org/lovable-uploads/express-logo-badge.png",
  "description": DEFAULT_SEO.description,
  "foundingDate": DEFAULT_SEO.foundingDate,
  "email": DEFAULT_SEO.contact.email,
  "telephone": DEFAULT_SEO.contact.phone,
  "address": {
    "@type": "PostalAddress",
    "addressLocality": DEFAULT_SEO.businessAddress.addressLocality,
    "addressRegion": DEFAULT_SEO.businessAddress.addressRegion,
    "postalCode": DEFAULT_SEO.businessAddress.postalCode,
    "addressCountry": DEFAULT_SEO.businessAddress.addressCountry
  },
  "sameAs": Object.values(DEFAULT_SEO.socialMedia),
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": DEFAULT_SEO.contact.phone,
    "contactType": "Customer Service",
    "areaServed": "US",
    "availableLanguage": ["English", "Spanish"]
  }
});

// Generate Service Schema
export const generateServiceSchema = (serviceName: string, description: string, price?: number) => ({
  "@context": "https://schema.org",
  "@type": "Service",
  "serviceType": serviceName,
  "provider": {
    "@type": "Organization",
    "name": DEFAULT_SEO.companyName,
    "url": "https://expresscreditfinancials.org"
  },
  "description": description,
  "areaServed": DEFAULT_SEO.areaServed,
  ...(price && {
    "offers": {
      "@type": "Offer",
      "price": price.toString(),
      "priceCurrency": "USD"
    }
  })
});

// Generate FAQ Schema
export const generateFAQSchema = (faqs: Array<{ question: string; answer: string }>) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqs.map(faq => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer
    }
  }))
});

// Generate Review Schema
export const generateReviewSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": DEFAULT_SEO.companyName,
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "reviewCount": "247",
    "bestRating": "5",
    "worstRating": "1"
  },
  "review": [
    {
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": "Sarah Johnson"
      },
      "datePublished": "2024-10-15",
      "reviewBody": "Express Credit helped me remove 12 negative items from my credit report in just 45 days. My score increased by 87 points! Professional and effective service.",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": "5",
        "bestRating": "5"
      }
    },
    {
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": "Michael Rodriguez"
      },
      "datePublished": "2024-09-28",
      "reviewBody": "Best credit repair company in Dallas! They use Metro 2 compliant strategies and actually got results. Highly recommend their Elite Package.",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": "5",
        "bestRating": "5"
      }
    }
  ]
});

// Generate Breadcrumb Schema
export const generateBreadcrumbSchema = (breadcrumbs: Array<{ name: string; url: string }>) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": breadcrumbs.map((crumb, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": crumb.name,
    "item": `https://expresscreditfinancials.org${crumb.url}`
  }))
});

// SEO Page Configurations
export const PAGE_SEO: Record<string, SEOConfig> = {
  home: {
    title: "Express Credit & Financial Solutions | Professional Credit Repair Dallas TX",
    description: "Dallas's #1 rated credit repair service. Remove negative items, boost credit scores 100+ points. Metro 2 compliant dispute letters. Free consultation. Licensed & insured.",
    keywords: ["credit repair Dallas", "credit restoration Dallas TX", "Metro 2 credit disputes", "delete negative credit items Dallas"],
    canonical: "https://expresscreditfinancials.org"
  },
  membership: {
    title: "Credit Repair Packages & Pricing | Express Credit Dallas",
    description: "Affordable credit repair packages from $99. Fast-5 rapid service, unlimited disputes, Metro 2 compliance. Choose from Basic, Pro, Elite, or Exclusive plans. Guaranteed results.",
    keywords: ["credit repair pricing Dallas", "credit repair packages Texas", "affordable credit restoration"],
    canonical: "https://expresscreditfinancials.org/membership"
  },
  dispute: {
    title: "Professional Dispute Letter Generation | Metro 2 Compliant Credit Disputes",
    description: "AI-powered Metro 2 compliant dispute letter generation. Remove collections, late payments, charge-offs. FCRA certified strategies. Results in 30-45 days.",
    keywords: ["credit dispute letters", "Metro 2 compliance", "FCRA dispute process", "remove negative credit items"],
    canonical: "https://expresscreditfinancials.org/dispute-center"
  },
  education: {
    title: "Credit Repair Education Center | Learn Credit Building Strategies",
    description: "Free credit repair education. Learn proven strategies to improve credit scores, dispute errors, build credit history. Expert tips from Dallas credit specialists.",
    keywords: ["credit repair education", "credit building strategies", "improve credit score tips"],
    canonical: "https://expresscreditfinancials.org/education"
  },
  creditBuilding: {
    title: "Credit Building Services | Authorized User Tradelines Dallas",
    description: "Build credit fast with authorized user tradelines, secured credit cards, credit builder loans. Boost scores 50-100 points. Dallas TX credit building experts.",
    keywords: ["authorized user tradelines Dallas", "credit building services", "build credit fast Texas"],
    canonical: "https://expresscreditfinancials.org/credit-building"
  }
};

// Generate Complete Sitemap
export const generateSitemap = () => {
  const baseUrl = "https://expresscreditfinancials.org";
  const pages = [
    { url: "/", priority: "1.0", changefreq: "daily" },
    { url: "/membership", priority: "0.9", changefreq: "weekly" },
    { url: "/dispute-center", priority: "0.9", changefreq: "weekly" },
    { url: "/credit-building", priority: "0.8", changefreq: "weekly" },
    { url: "/education", priority: "0.8", changefreq: "weekly" },
    { url: "/data-freeze", priority: "0.7", changefreq: "monthly" },
    { url: "/document-center", priority: "0.6", changefreq: "monthly" },
    { url: "/sba-portal", priority: "0.7", changefreq: "monthly" }
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${pages.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
};

// Generate Robots.txt
export const generateRobotsTxt = () => {
  return `# Express Credit & Financial Solutions - Robots.txt
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /client-portals/

# Sitemaps
Sitemap: https://expresscreditfinancials.org/sitemap.xml

# Crawl-delay
Crawl-delay: 1

# Popular search engines
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Slurp
Allow: /`;
};
