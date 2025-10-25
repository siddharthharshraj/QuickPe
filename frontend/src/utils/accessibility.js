// Accessibility utilities for better user experience
import { ACCESSIBILITY } from '../config/constants';

class AccessibilityManager {
  constructor() {
    this.announcements = [];
    this.focusHistory = [];
    this.keyboardShortcuts = new Map();
    this.init();
  }

  init() {
    this.createLiveRegion();
    this.setupKeyboardShortcuts();
    this.setupFocusManagement();
    this.setupColorContrastMonitoring();
  }

  // Screen reader announcements
  createLiveRegion() {
    // Create aria-live region for announcements
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.setAttribute('class', 'sr-only');
    liveRegion.setAttribute('id', 'live-region');
    document.body.appendChild(liveRegion);

    // Create assertive live region for urgent announcements
    const assertiveLiveRegion = document.createElement('div');
    assertiveLiveRegion.setAttribute('aria-live', 'assertive');
    assertiveLiveRegion.setAttribute('aria-atomic', 'true');
    assertiveLiveRegion.setAttribute('class', 'sr-only');
    assertiveLiveRegion.setAttribute('id', 'assertive-live-region');
    document.body.appendChild(assertiveLiveRegion);
  }

  announce(message, priority = 'polite') {
    const regionId = priority === 'assertive' ? 'assertive-live-region' : 'live-region';
    const liveRegion = document.getElementById(regionId);
    
    if (liveRegion) {
      // Clear previous announcement
      liveRegion.textContent = '';
      
      // Add new announcement after a brief delay
      setTimeout(() => {
        liveRegion.textContent = message;
        this.announcements.push({
          message,
          priority,
          timestamp: new Date().toISOString()
        });
      }, 100);
    }
  }

  // Keyboard navigation
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
      const { ctrlKey, altKey, shiftKey, key } = event;

      // Global shortcuts
      if (ctrlKey && key === 'k') {
        event.preventDefault();
        this.focusSearch();
        this.announce('Search focused');
      }

      if (ctrlKey && key === 'h') {
        event.preventDefault();
        this.showKeyboardShortcuts();
      }

      if (ctrlKey && shiftKey && key === 'P') {
        event.preventDefault();
        this.togglePerformanceMonitor();
      }

      // Navigation shortcuts
      if (altKey && key === 'd') {
        event.preventDefault();
        this.navigateTo('/dashboard');
        this.announce('Navigated to Dashboard');
      }

      if (altKey && key === 't') {
        event.preventDefault();
        this.navigateTo('/transaction-history');
        this.announce('Navigated to Transaction History');
      }

      if (altKey && key === 'a') {
        event.preventDefault();
        this.navigateTo('/analytics');
        this.announce('Navigated to Analytics');
      }

      // Escape key handling
      if (key === 'Escape') {
        this.handleEscape();
      }

      // Tab trapping for modals
      if (key === 'Tab') {
        this.handleTabTrapping(event);
      }
    });
  }

  focusSearch() {
    const searchInput = document.querySelector('[data-testid="search-input"], input[type="search"], input[placeholder*="search" i]');
    if (searchInput) {
      searchInput.focus();
    }
  }

  navigateTo(path) {
    // This would integrate with your router
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }

  showKeyboardShortcuts() {
    const shortcuts = Object.entries(ACCESSIBILITY.KEYBOARD_SHORTCUTS)
      .map(([action, key]) => `${action}: ${key}`)
      .join('\n');
    
    this.announce(`Keyboard shortcuts: ${shortcuts}`, 'assertive');
  }

  togglePerformanceMonitor() {
    // This would integrate with your performance monitor
    const event = new CustomEvent('toggle-performance-monitor');
    window.dispatchEvent(event);
  }

  // Focus management
  setupFocusManagement() {
    let lastFocusedElement = null;

    document.addEventListener('focusin', (event) => {
      if (lastFocusedElement !== event.target) {
        this.focusHistory.push(lastFocusedElement);
        lastFocusedElement = event.target;
        
        // Keep history manageable
        if (this.focusHistory.length > 10) {
          this.focusHistory = this.focusHistory.slice(-10);
        }
      }
    });
  }

  trapFocus(container) {
    const focusableElements = container.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (event) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }

  handleTabTrapping(event) {
    const modal = document.querySelector('[role="dialog"][aria-modal="true"]');
    if (modal) {
      const focusableElements = modal.querySelectorAll(
        'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length > 0) {
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }
  }

  handleEscape() {
    // Close modals, dropdowns, etc.
    const modal = document.querySelector('[role="dialog"][aria-modal="true"]');
    if (modal) {
      const closeButton = modal.querySelector('[data-testid="close-modal"], button[aria-label*="close" i]');
      if (closeButton) {
        closeButton.click();
      }
    }

    // Close dropdowns
    const dropdown = document.querySelector('[aria-expanded="true"]');
    if (dropdown) {
      dropdown.setAttribute('aria-expanded', 'false');
      dropdown.focus();
    }
  }

  restoreFocus() {
    const lastFocused = this.focusHistory.pop();
    if (lastFocused && document.contains(lastFocused)) {
      lastFocused.focus();
    }
  }

  // Color contrast monitoring
  setupColorContrastMonitoring() {
    if (process.env.NODE_ENV === 'development') {
      this.checkColorContrast();
    }
  }

  checkColorContrast() {
    // This is a simplified version - in production, use a proper contrast checking library
    const elements = document.querySelectorAll('*');
    const issues = [];

    elements.forEach(element => {
      const styles = window.getComputedStyle(element);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;

      if (color && backgroundColor && color !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'rgba(0, 0, 0, 0)') {
        // Simplified contrast check - replace with proper algorithm
        const contrast = this.calculateContrast(color, backgroundColor);
        if (contrast < 4.5) {
          issues.push({
            element,
            color,
            backgroundColor,
            contrast
          });
        }
      }
    });

    if (issues.length > 0) {
      console.warn('Color contrast issues detected:', issues);
    }
  }

  calculateContrast(color1, color2) {
    // Simplified contrast calculation - replace with proper WCAG algorithm
    return Math.random() * 10; // Mock implementation
  }

  // ARIA helpers
  setAriaLabel(element, label) {
    element.setAttribute('aria-label', label);
  }

  setAriaDescribedBy(element, describerId) {
    element.setAttribute('aria-describedby', describerId);
  }

  setAriaExpanded(element, expanded) {
    element.setAttribute('aria-expanded', expanded.toString());
  }

  setAriaHidden(element, hidden) {
    element.setAttribute('aria-hidden', hidden.toString());
  }

  // Loading states
  announceLoading(message = 'Loading content') {
    this.announce(message);
  }

  announceLoadingComplete(message = 'Content loaded') {
    this.announce(message);
  }

  // Error announcements
  announceError(message) {
    this.announce(`Error: ${message}`, 'assertive');
  }

  announceSuccess(message) {
    this.announce(`Success: ${message}`, 'assertive');
  }

  // Form validation
  announceFormErrors(errors) {
    const errorCount = errors.length;
    const message = errorCount === 1 
      ? `1 error found: ${errors[0]}`
      : `${errorCount} errors found: ${errors.join(', ')}`;
    
    this.announce(message, 'assertive');
  }

  // Utility methods
  isScreenReaderActive() {
    // Detect if screen reader is active
    return window.navigator.userAgent.includes('NVDA') || 
           window.navigator.userAgent.includes('JAWS') ||
           window.speechSynthesis?.speaking;
  }

  getAnnouncements() {
    return this.announcements;
  }

  clearAnnouncements() {
    this.announcements = [];
  }
}

// Create singleton instance
const accessibilityManager = new AccessibilityManager();

// Export utility functions
export const announce = (message, priority) => accessibilityManager.announce(message, priority);
export const trapFocus = (container) => accessibilityManager.trapFocus(container);
export const restoreFocus = () => accessibilityManager.restoreFocus();
export const announceLoading = (message) => accessibilityManager.announceLoading(message);
export const announceLoadingComplete = (message) => accessibilityManager.announceLoadingComplete(message);
export const announceError = (message) => accessibilityManager.announceError(message);
export const announceSuccess = (message) => accessibilityManager.announceSuccess(message);
export const announceFormErrors = (errors) => accessibilityManager.announceFormErrors(errors);

export default accessibilityManager;
