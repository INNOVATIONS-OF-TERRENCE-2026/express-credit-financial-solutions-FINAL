import { ChevronRight, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { generateBreadcrumbSchema } from '@/utils/seo';

const routeNameMap: Record<string, string> = {
  '': 'Home',
  'membership': 'Membership Plans',
  'dispute-center': 'Dispute Center',
  'credit-building': 'Credit Building',
  'education': 'Education Center',
  'data-freeze': 'Data Freeze Center',
  'document-center': 'Document Center',
  'sba-portal': 'SBA Loan Portal',
  'admin': 'Admin Dashboard',
  'onboarding': 'Client Onboarding'
};

export const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    ...pathnames.map((path, index) => {
      const url = `/${pathnames.slice(0, index + 1).join('/')}`;
      return {
        name: routeNameMap[path] || path.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        url
      };
    })
  ];

  useEffect(() => {
    // Add breadcrumb structured data
    if (breadcrumbs.length > 1) {
      let script = document.querySelector('script[data-schema="breadcrumbs"]');
      if (!script) {
        script = document.createElement('script');
        script.setAttribute('type', 'application/ld+json');
        script.setAttribute('data-schema', 'breadcrumbs');
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(generateBreadcrumbSchema(breadcrumbs));
    }
  }, [location.pathname]);

  if (pathnames.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="py-3 px-4 bg-fintech-secondary/30 backdrop-blur-sm border-b border-fintech-accent/20">
      <ol className="flex items-center space-x-2 text-sm text-fintech-light/80">
        <li className="flex items-center">
          <Link to="/" className="hover:text-fintech-accent transition-colors flex items-center gap-1">
            <Home className="w-4 h-4" />
            <span>Home</span>
          </Link>
        </li>
        {breadcrumbs.slice(1).map((crumb, index) => (
          <li key={crumb.url} className="flex items-center">
            <ChevronRight className="w-4 h-4 mx-2 text-fintech-light/50" />
            {index === breadcrumbs.length - 2 ? (
              <span className="text-fintech-accent font-medium" aria-current="page">
                {crumb.name}
              </span>
            ) : (
              <Link to={crumb.url} className="hover:text-fintech-accent transition-colors">
                {crumb.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};
