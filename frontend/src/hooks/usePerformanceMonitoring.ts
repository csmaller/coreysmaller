import { useEffect } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  domContentLoaded: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  firstInputDelay?: number;
  cumulativeLayoutShift?: number;
}

export const usePerformanceMonitoring = () => {
  useEffect(() => {
    const measurePerformance = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      const metrics: PerformanceMetrics = {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      };

      // Web Vitals
      if ('PerformanceObserver' in window) {
        // First Contentful Paint
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const fcp = entries.find(entry => entry.name === 'first-contentful-paint');
          if (fcp) {
            metrics.firstContentfulPaint = fcp.startTime;
          }
        });
        fcpObserver.observe({ entryTypes: ['paint'] });

        // Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          if (lastEntry) {
            metrics.largestContentfulPaint = lastEntry.startTime;
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const firstInput = entries[0] as any; // Type assertion for FID entry
          if (firstInput && firstInput.processingStart) {
            metrics.firstInputDelay = firstInput.processingStart - firstInput.startTime;
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // Cumulative Layout Shift
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          metrics.cumulativeLayoutShift = clsValue;
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

        // Log metrics after page load
        setTimeout(() => {
          console.log('Performance Metrics:', metrics);
          
          // Send to analytics service if available
          if (window.gtag) {
            window.gtag('event', 'page_performance', {
              custom_map: {
                metric1: 'load_time',
                metric2: 'fcp',
                metric3: 'lcp',
                metric4: 'fid',
                metric5: 'cls'
              }
            });
            
            window.gtag('event', 'load_time', {
              metric1: metrics.loadTime
            });
            
            if (metrics.firstContentfulPaint) {
              window.gtag('event', 'fcp', {
                metric2: metrics.firstContentfulPaint
              });
            }
            
            if (metrics.largestContentfulPaint) {
              window.gtag('event', 'lcp', {
                metric3: metrics.largestContentfulPaint
              });
            }
            
            if (metrics.firstInputDelay) {
              window.gtag('event', 'fid', {
                metric4: metrics.firstInputDelay
              });
            }
            
            if (metrics.cumulativeLayoutShift) {
              window.gtag('event', 'cls', {
                metric5: metrics.cumulativeLayoutShift
              });
            }
          }
        }, 3000);
      }
    };

    // Measure performance when page is fully loaded
    if (document.readyState === 'complete') {
      measurePerformance();
    } else {
      window.addEventListener('load', measurePerformance);
    }

    return () => {
      window.removeEventListener('load', measurePerformance);
    };
  }, []);
};

// Global type declaration for gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}