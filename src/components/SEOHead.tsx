import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { DEFAULT_SEO, PAGE_SEO, generateLocalBusinessSchema, generateOrganizationSchema, generateReviewSchema } from '@/utils/seo';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  canonical?: string;
  ogImage?: string;
  structuredData?: any;
}

export const SEOHead = ({ 
  title, 
  description, 
  keywords, 
  canonical,
  ogImage,
  structuredData 
}: SEOHeadProps) => {
  const location = useLocation();
  
  // Get page-specific SEO or use defaults
  const pagePath = location.pathname.substring(1) || 'home';
  const pageSEO = PAGE_SEO[pagePath] || PAGE_SEO.home;
  
  const finalTitle = title || pageSEO.title;
  const finalDescription = description || pageSEO.description;
  const finalKeywords = keywords || pageSEO.keywords || DEFAULT_SEO.keywords;
  const finalCanonical = canonical || pageSEO.canonical || `https://expresscreditfinancials.org${location.pathname}`;
  const finalOgImage = ogImage || 'https://expresscreditfinancials.org/og-image.png';

  useEffect(() => {
    // Update document title
    document.title = finalTitle;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      
      element.content = content;
    };

    // Basic meta tags
    updateMetaTag('description', finalDescription);
    updateMetaTag('keywords', finalKeywords.join(', '));
    updateMetaTag('author', DEFAULT_SEO.companyName);
    updateMetaTag('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    
    // Mobile optimization
    updateMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=5');
    updateMetaTag('theme-color', '#00C3E8');
    updateMetaTag('mobile-web-app-capable', 'yes');
    updateMetaTag('apple-mobile-web-app-capable', 'yes');
    updateMetaTag('apple-mobile-web-app-status-bar-style', 'black-translucent');
    
    // OpenGraph tags
    updateMetaTag('og:title', finalTitle, true);
    updateMetaTag('og:description', finalDescription, true);
    updateMetaTag('og:type', 'website', true);
    updateMetaTag('og:url', finalCanonical, true);
    updateMetaTag('og:image', finalOgImage, true);
    updateMetaTag('og:image:url', finalOgImage, true);
    updateMetaTag('og:image:secure_url', finalOgImage, true);
    updateMetaTag('og:image:type', 'image/png', true);
    updateMetaTag('og:image:width', '1200', true);
    updateMetaTag('og:image:height', '630', true);
    updateMetaTag('og:site_name', DEFAULT_SEO.siteName, true);
    updateMetaTag('og:locale', 'en_US', true);
    
    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', finalTitle);
    updateMetaTag('twitter:description', finalDescription);
    updateMetaTag('twitter:image', finalOgImage);
    updateMetaTag('twitter:site', '@expresscredit');
    
    // Additional SEO tags
    updateMetaTag('geo.region', 'US-TX');
    updateMetaTag('geo.placename', 'Dallas');
    updateMetaTag('geo.position', '32.7767;-96.7970');
    updateMetaTag('ICBM', '32.7767, -96.7970');
    
    // Business info
    updateMetaTag('locality', 'Dallas');
    updateMetaTag('region', 'TX');
    updateMetaTag('country-name', 'USA');
    
    // Update canonical link
    let canonicalElement = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalElement) {
      canonicalElement = document.createElement('link');
      canonicalElement.rel = 'canonical';
      document.head.appendChild(canonicalElement);
    }
    canonicalElement.href = finalCanonical;

    // Add alternate for mobile
    let alternateElement = document.querySelector('link[rel="alternate"][media]') as HTMLLinkElement;
    if (!alternateElement) {
      alternateElement = document.createElement('link');
      alternateElement.rel = 'alternate';
      alternateElement.media = 'only screen and (max-width: 640px)';
      document.head.appendChild(alternateElement);
    }
    alternateElement.href = finalCanonical;

    // Add structured data
    const addStructuredData = (id: string, data: any) => {
      let script = document.querySelector(`script[data-schema="${id}"]`);
      if (!script) {
        script = document.createElement('script');
        script.setAttribute('type', 'application/ld+json');
        script.setAttribute('data-schema', id);
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(data);
    };

    // Always add core schemas
    addStructuredData('local-business', generateLocalBusinessSchema());
    addStructuredData('organization', generateOrganizationSchema());
    addStructuredData('reviews', generateReviewSchema());

    // Add custom structured data if provided
    if (structuredData) {
      addStructuredData('custom', structuredData);
    }

  }, [finalTitle, finalDescription, finalKeywords, finalCanonical, finalOgImage, structuredData]);

  return null; // This is a utility component that doesn't render anything
};
