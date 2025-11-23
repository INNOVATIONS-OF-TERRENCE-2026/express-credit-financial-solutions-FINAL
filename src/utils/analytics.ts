// SEO Analytics and Tracking Utilities

interface AnalyticsEvent {
  event: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
}

// Track page views for SEO analytics
export const trackPageView = (page: string, title: string) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('config', 'GA_MEASUREMENT_ID', {
      page_path: page,
      page_title: title,
    });
  }
  
  console.log(`[SEO Analytics] Page View: ${page} - ${title}`);
};

// Track custom events for user engagement
export const trackEvent = ({ event, category, action, label, value }: AnalyticsEvent) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
  
  console.log(`[SEO Analytics] Event: ${event} | ${category} | ${action}`, { label, value });
};

// Track form submissions
export const trackFormSubmission = (formName: string, formType: 'contact' | 'signup' | 'dispute' | 'consultation') => {
  trackEvent({
    event: 'form_submission',
    category: 'Engagement',
    action: 'Form Submit',
    label: `${formType} - ${formName}`,
    value: 1
  });
};

// Track button clicks for conversion tracking
export const trackButtonClick = (buttonName: string, buttonType: 'cta' | 'navigation' | 'social') => {
  trackEvent({
    event: 'button_click',
    category: 'Engagement',
    action: 'Button Click',
    label: `${buttonType} - ${buttonName}`
  });
};

// Track document downloads
export const trackDownload = (documentName: string, documentType: string) => {
  trackEvent({
    event: 'file_download',
    category: 'Content',
    action: 'Download',
    label: `${documentType} - ${documentName}`,
    value: 1
  });
};

// Track outbound links
export const trackOutboundLink = (url: string, linkText: string) => {
  trackEvent({
    event: 'outbound_link',
    category: 'External',
    action: 'Click',
    label: `${linkText} - ${url}`
  });
};

// Track scroll depth for engagement metrics
export const trackScrollDepth = (depth: number) => {
  trackEvent({
    event: 'scroll_depth',
    category: 'Engagement',
    action: 'Scroll',
    label: `${depth}%`,
    value: depth
  });
};

// Track time on page
export const trackTimeOnPage = (pageName: string, seconds: number) => {
  trackEvent({
    event: 'time_on_page',
    category: 'Engagement',
    action: 'Time Spent',
    label: pageName,
    value: seconds
  });
};

// SEO Health Check - Monitor Core Web Vitals
export const trackCoreWebVitals = () => {
  if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
    // Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as any;
      const lcp = lastEntry.renderTime || lastEntry.loadTime || 0;
      
      trackEvent({
        event: 'core_web_vitals',
        category: 'Performance',
        action: 'LCP',
        label: `${Math.round(lcp)}ms`,
        value: Math.round(lcp)
      });
    });
    
    try {
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      console.warn('LCP observation not supported');
    }
    
    // First Input Delay (FID)
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        const fid = entry.processingStart - entry.startTime;
        
        trackEvent({
          event: 'core_web_vitals',
          category: 'Performance',
          action: 'FID',
          label: `${Math.round(fid)}ms`,
          value: Math.round(fid)
        });
      });
    });
    
    try {
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      console.warn('FID observation not supported');
    }
    
    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      
      trackEvent({
        event: 'core_web_vitals',
        category: 'Performance',
        action: 'CLS',
        label: clsValue.toFixed(3),
        value: Math.round(clsValue * 1000)
      });
    });
    
    try {
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      console.warn('CLS observation not supported');
    }
  }
};

// Initialize analytics on app load
export const initializeAnalytics = () => {
  trackCoreWebVitals();
  
  // Track scroll depth at intervals
  let scrollDepths = [25, 50, 75, 100];
  let trackedDepths = new Set<number>();
  
  const handleScroll = () => {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.scrollY;
    const scrollPercent = (scrollTop / (documentHeight - windowHeight)) * 100;
    
    scrollDepths.forEach(depth => {
      if (scrollPercent >= depth && !trackedDepths.has(depth)) {
        trackScrollDepth(depth);
        trackedDepths.add(depth);
      }
    });
  };
  
  window.addEventListener('scroll', handleScroll, { passive: true });
  
  // Track time on page
  const startTime = Date.now();
  
  window.addEventListener('beforeunload', () => {
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    trackTimeOnPage(document.title, timeSpent);
  });
};

// Generate SEO performance report
export const generateSEOReport = () => {
  const report = {
    timestamp: new Date().toISOString(),
    page: window.location.pathname,
    title: document.title,
    metaDescription: document.querySelector('meta[name="description"]')?.getAttribute('content'),
    canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    hasStructuredData: !!document.querySelector('script[type="application/ld+json"]'),
    imageCount: document.querySelectorAll('img').length,
    imagesWithAlt: document.querySelectorAll('img[alt]').length,
    internalLinks: document.querySelectorAll('a[href^="/"]').length,
    externalLinks: document.querySelectorAll('a[href^="http"]').length,
    headingStructure: {
      h1: document.querySelectorAll('h1').length,
      h2: document.querySelectorAll('h2').length,
      h3: document.querySelectorAll('h3').length,
    }
  };
  
  console.log('[SEO Report]', report);
  return report;
};
