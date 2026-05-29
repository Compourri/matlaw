document.addEventListener('DOMContentLoaded', function() {
    document.body.classList.add('js-enabled');
    initMobileNav();
    initSmoothScroll();
    initFormValidation();
    initScrollReveal();
});

function initMobileNav() {
    const header = document.getElementById('site-header');
    if (!header) return;
    
    let navToggle = header.querySelector('.nav-toggle');
    
    if (!navToggle) {
        navToggle = document.createElement('button');
        navToggle.className = 'nav-toggle';
        navToggle.setAttribute('aria-label', 'Toggle navigation menu');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.innerHTML = '<span class="hamburger"></span>';
        
        const headerInner = header.querySelector('.header-inner');
        if (headerInner) {
            headerInner.insertBefore(navToggle, headerInner.firstChild);
        }
    }
    
    navToggle.addEventListener('click', function() {
        const isExpanded = this.getAttribute('aria-expanded') === 'true';
        this.setAttribute('aria-expanded', !isExpanded);
        header.classList.toggle('nav-active');
        this.classList.toggle('active');
    });
    
    document.addEventListener('click', function(e) {
        if (!header.contains(e.target) && header.classList.contains('nav-active')) {
            header.classList.remove('nav-active');
            navToggle.classList.remove('active');
            navToggle.setAttribute('aria-expanded', 'false');
        }
    });
    
    const hasSubmenuLinks = header.querySelectorAll('nav .has-submenu > a');
    hasSubmenuLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            if (window.innerWidth <= 992) {
                e.preventDefault();
                const parent = this.parentElement;
                parent.classList.toggle('submenu-active');
            }
        });
    });
    
    const navLinks = header.querySelectorAll('nav a:not(.has-submenu > a)');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 992) {
                header.classList.remove('nav-active');
                navToggle.classList.remove('active');
                navToggle.setAttribute('aria-expanded', 'false');
            }
        });
    });
}

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const headerHeight = document.getElementById('site-header')?.offsetHeight || 0;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

function initFormValidation() {
    const forms = document.querySelectorAll('form[data-validate]');
    
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
        
        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                validateField(this);
            });
            
            input.addEventListener('input', function() {
                if (this.classList.contains('error')) {
                    validateField(this);
                }
            });
        });
        
        form.addEventListener('submit', function(e) {
            let isValid = true;
            
            inputs.forEach(input => {
                if (!validateField(input)) {
                    isValid = false;
                }
            });
            
            if (!isValid) {
                e.preventDefault();
                const firstError = form.querySelector('.error');
                if (firstError) {
                    firstError.focus();
                }
            }
        });
    });
}

function validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';
    
    field.classList.remove('error');
    field.setCustomValidity('');
    
    if (field.hasAttribute('required') && !value) {
        isValid = false;
        errorMessage = 'This field is required';
    } else if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid email address';
        }
    } else if (field.type === 'tel' && value) {
        const phoneRegex = /^[\d\s\+\-\(\)]{7,20}$/;
        if (!phoneRegex.test(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid phone number';
        }
    } else if (field.minLength && value.length < field.minLength) {
        isValid = false;
        errorMessage = `Please enter at least ${field.minLength} characters`;
    }
    
    if (!isValid) {
        field.classList.add('error');
        field.setCustomValidity(errorMessage);
        showFieldError(field, errorMessage);
    } else {
        hideFieldError(field);
    }
    
    return isValid;
}

function showFieldError(field, message) {
    hideFieldError(field);
    
    const errorSpan = document.createElement('span');
    errorSpan.className = 'field-error';
    errorSpan.setAttribute('role', 'alert');
    errorSpan.textContent = message;
    
    field.parentNode.appendChild(errorSpan);
}

function hideFieldError(field) {
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
}

function initScrollReveal() {
    var selectors = [
        'section:not(.hero-slider)',
        '.history-layout > *',
        '.service-hero > *',
        '.footer-inner > *',
        '.contact-section',
        '.contact-section-mini',
        '.map-section'
    ];

    var elements = document.querySelectorAll(selectors.join(','));

    if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        elements.forEach(function(el) {
            el.classList.add('reveal');
            observer.observe(el);
        });
    } else {
        elements.forEach(function(el) {
            el.classList.add('visible');
        });
    }
}

window.addEventListener('load', function() {
    document.body.classList.add('loaded');
});

const lightbox = document.getElementById('lightbox');
if (lightbox) {
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && lightbox.classList.contains('active')) {
            lightbox.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}
