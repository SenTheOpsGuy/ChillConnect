// ChillConnect Landing Page JavaScript

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functionality
    initMobileMenu();
    initSmoothScrolling();
    initScrollEffects();
    initFormHandling();
    initAnalytics();
    
    // Log page load for analytics
    console.log('ChillConnect landing page loaded');
});

// Mobile Menu Toggle
function initMobileMenu() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuToggle && navLinks) {
        mobileMenuToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            mobileMenuToggle.classList.toggle('active');
            
            // Prevent body scroll when menu is open
            document.body.classList.toggle('menu-open');
        });
        
        // Close menu when clicking on a link
        navLinks.addEventListener('click', function(e) {
            if (e.target.classList.contains('nav-link')) {
                navLinks.classList.remove('active');
                mobileMenuToggle.classList.remove('active');
                document.body.classList.remove('menu-open');
            }
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!navLinks.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
                navLinks.classList.remove('active');
                mobileMenuToggle.classList.remove('active');
                document.body.classList.remove('menu-open');
            }
        });
    }
}

// Smooth Scrolling for Anchor Links
function initSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = targetElement.offsetTop - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Scroll Effects
function initScrollEffects() {
    const header = document.querySelector('.header');
    
    // Header background on scroll
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
    
    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animateElements = document.querySelectorAll('.feature-item, .step, .safety-feature');
    animateElements.forEach(el => observer.observe(el));
}

// Form Handling and CTAs
function initFormHandling() {
    // Track CTA clicks
    const ctaButtons = document.querySelectorAll('.cta-primary, .cta-secondary');
    
    ctaButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            const buttonText = this.textContent.trim();
            const buttonType = this.classList.contains('cta-primary') ? 'primary' : 'secondary';
            
            // Track click for analytics
            trackEvent('CTA Click', {
                button_text: buttonText,
                button_type: buttonType,
                page_section: getPageSection(this)
            });
            
            // Add visual feedback
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });
    
    // Handle learn more button
    const learnMoreBtn = document.getElementById('learn-more-btn');
    if (learnMoreBtn) {
        learnMoreBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Scroll to features section
            const featuresSection = document.getElementById('features');
            if (featuresSection) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = featuresSection.offsetTop - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    }
}

// Analytics and Tracking
function initAnalytics() {
    // Track page views
    trackPageView();
    
    // Track scroll depth
    let maxScrollDepth = 0;
    const trackScrollDepth = throttle(function() {
        const scrollPercentage = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
        
        if (scrollPercentage > maxScrollDepth) {
            maxScrollDepth = scrollPercentage;
            
            // Track milestone scroll depths
            if (scrollPercentage >= 25 && maxScrollDepth < 25) {
                trackEvent('Scroll Depth', { depth: '25%' });
            } else if (scrollPercentage >= 50 && maxScrollDepth < 50) {
                trackEvent('Scroll Depth', { depth: '50%' });
            } else if (scrollPercentage >= 75 && maxScrollDepth < 75) {
                trackEvent('Scroll Depth', { depth: '75%' });
            } else if (scrollPercentage >= 90 && maxScrollDepth < 90) {
                trackEvent('Scroll Depth', { depth: '90%' });
            }
        }
    }, 250);
    
    window.addEventListener('scroll', trackScrollDepth);
    
    // Track time on page
    const startTime = Date.now();
    window.addEventListener('beforeunload', function() {
        const timeOnPage = Math.round((Date.now() - startTime) / 1000);
        trackEvent('Time on Page', { duration: timeOnPage });
    });
}

// Utility Functions
function getPageSection(element) {
    const sections = ['hero', 'features', 'how-it-works', 'safety', 'cta-section'];
    
    for (let section of sections) {
        const sectionElement = element.closest(`.${section}`);
        if (sectionElement) {
            return section;
        }
    }
    
    return 'unknown';
}

function trackPageView() {
    trackEvent('Page View', {
        page: 'Landing Page',
        url: window.location.href,
        referrer: document.referrer,
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString()
    });
}

function trackEvent(eventName, properties = {}) {
    // Console log for development
    console.log('Analytics Event:', eventName, properties);
    
    // Google Analytics 4 (gtag) - Uncomment when GA is set up
    /*
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, properties);
    }
    */
    
    // Custom analytics endpoint - Uncomment when ready
    /*
    fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            event: eventName,
            properties: properties,
            timestamp: new Date().toISOString(),
            session_id: getSessionId()
        })
    }).catch(err => console.log('Analytics error:', err));
    */
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    }
}

// Performance monitoring
function measurePerformance() {
    if ('performance' in window) {
        window.addEventListener('load', function() {
            setTimeout(function() {
                const navigation = performance.getEntriesByType('navigation')[0];
                const paint = performance.getEntriesByType('paint');
                
                const metrics = {
                    dom_load_time: Math.round(navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart),
                    page_load_time: Math.round(navigation.loadEventEnd - navigation.loadEventStart),
                    first_paint: paint.find(p => p.name === 'first-paint')?.startTime,
                    first_contentful_paint: paint.find(p => p.name === 'first-contentful-paint')?.startTime
                };
                
                trackEvent('Performance', metrics);
            }, 0);
        });
    }
}

// Error tracking
window.addEventListener('error', function(e) {
    trackEvent('JavaScript Error', {
        message: e.message,
        filename: e.filename,
        line: e.lineno,
        column: e.colno
    });
});

// Initialize performance monitoring
measurePerformance();

// SEO and Social Sharing
function generateShareUrl(platform) {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent('ChillConnect - Connect, Book, Experience');
    const description = encodeURIComponent('Discover premium services and connections in India with ChillConnect');
    
    const shareUrls = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
        twitter: `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
        whatsapp: `https://wa.me/?text=${title}%20${url}`
    };
    
    return shareUrls[platform];
}

// Lazy loading for images (when images are added)
function initLazyLoading() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
}

// Feature detection and progressive enhancement
function checkFeatureSupport() {
    const features = {
        webp: false,
        intersection_observer: 'IntersectionObserver' in window,
        service_worker: 'serviceWorker' in navigator,
        local_storage: 'localStorage' in window
    };
    
    // WebP support detection
    const webp = new Image();
    webp.onload = webp.onerror = function() {
        features.webp = (webp.height === 2);
        document.documentElement.classList.toggle('webp', features.webp);
    };
    webp.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    
    return features;
}

// Initialize feature detection
const supportedFeatures = checkFeatureSupport();

// Cookie consent (GDPR compliance)
function initCookieConsent() {
    // Simple cookie consent implementation
    if (!localStorage.getItem('cookie_consent')) {
        // Show cookie banner (implement when needed)
        console.log('Cookie consent required');
    }
}

// Service Worker registration (for PWA features)
function registerServiceWorker() {
    if (supportedFeatures.service_worker) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('SW registered: ', registration);
                })
                .catch(registrationError => {
                    console.log('SW registration failed: ', registrationError);
                });
        });
    }
}

// Initialize additional features
document.addEventListener('DOMContentLoaded', function() {
    initLazyLoading();
    initCookieConsent();
    registerServiceWorker();
});

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        trackEvent,
        throttle,
        debounce,
        generateShareUrl
    };
}