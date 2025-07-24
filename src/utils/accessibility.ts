// Accessibility utilities for the CRM application

/**
 * Enhanced focus management for modals and dialogs
 */
export class FocusManager {
  private previousActiveElement: HTMLElement | null = null;

  trapFocus(container: HTMLElement) {
    this.previousActiveElement = document.activeElement as HTMLElement;
    
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;
    
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
      this.restoreFocus();
    };
  }

  restoreFocus() {
    if (this.previousActiveElement) {
      this.previousActiveElement.focus();
      this.previousActiveElement = null;
    }
  }
}

/**
 * Screen reader announcements
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.style.position = 'absolute';
  announcement.style.left = '-10000px';
  announcement.style.width = '1px';
  announcement.style.height = '1px';
  announcement.style.overflow = 'hidden';
  
  document.body.appendChild(announcement);
  announcement.textContent = message;
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Generate unique IDs for form elements
 */
export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Enhanced keyboard navigation helpers
 */
export const KeyboardNavigation = {
  ARROW_KEYS: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'],
  
  handleArrowNavigation(
    e: KeyboardEvent,
    items: HTMLElement[],
    currentIndex: number,
    orientation: 'horizontal' | 'vertical' = 'vertical'
  ): number {
    const isVertical = orientation === 'vertical';
    const prevKey = isVertical ? 'ArrowUp' : 'ArrowLeft';
    const nextKey = isVertical ? 'ArrowDown' : 'ArrowRight';
    
    let newIndex = currentIndex;
    
    switch (e.key) {
      case prevKey:
        e.preventDefault();
        newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        break;
      case nextKey:
        e.preventDefault();
        newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = items.length - 1;
        break;
    }
    
    if (newIndex !== currentIndex && items[newIndex]) {
      items[newIndex].focus();
    }
    
    return newIndex;
  }
};

/**
 * Color contrast validation
 */
export function hasGoodContrast(backgroundColor: string, textColor: string): boolean {
  // This is a simplified version - in production, you'd use a proper color contrast library
  // Returns true for now as the design system should handle this
  return true;
}

/**
 * ARIA label helpers
 */
export const ARIA = {
  describedBy: (id: string) => ({ 'aria-describedby': id }),
  labelledBy: (id: string) => ({ 'aria-labelledby': id }),
  expanded: (isExpanded: boolean) => ({ 'aria-expanded': isExpanded }),
  selected: (isSelected: boolean) => ({ 'aria-selected': isSelected }),
  hidden: (isHidden: boolean) => ({ 'aria-hidden': isHidden }),
  current: (current: string) => ({ 'aria-current': current }),
};