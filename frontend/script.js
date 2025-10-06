// Main JavaScript for Wellness Website

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    initializeApp();
});

async function initializeApp() {
    try {
        // Load and display services
        await loadServices();
        
        // Initialize navigation
        initializeNavigation();
        
        // Initialize smooth scrolling
        initializeSmoothScrolling();
        
    } catch (error) {
        console.error('Error initializing app:', error);
        showError('Fehler beim Laden der Services. Bitte versuchen Sie es später erneut.');
    }
}

// Load all services and display them
async function loadServices() {
    try {
        const response = await fetch('/api/services');
        if (!response.ok) {
            throw new Error('Failed to fetch services');
        }
        
        const services = await response.json();
        displayServices(services);
        
    } catch (error) {
        console.error('Error loading services:', error);
        showError('Services konnten nicht geladen werden.');
    }
}

// Display services in the grid
function displayServices(services) {
    const servicesGrid = document.getElementById('servicesGrid');
    if (!servicesGrid) return;
    
    // Group services by category
    const servicesByCategory = {};
    services.forEach(service => {
        if (!servicesByCategory[service.category_name]) {
            servicesByCategory[service.category_name] = [];
        }
        servicesByCategory[service.category_name].push(service);
    });
    
    // Create HTML for all services
    let html = '';
    
    Object.keys(servicesByCategory).forEach(categoryName => {
        const categoryServices = servicesByCategory[categoryName];
        
        categoryServices.forEach(service => {
            html += createServiceCard(service);
        });
    });
    
    servicesGrid.innerHTML = html;
    
    // Add click event listeners to service cards
    addServiceCardListeners();
}

// Create HTML for a single service card
function createServiceCard(service) {
    const shortDescription = truncateText(stripHtml(service.description), 120);
    
    return `
        <div class="service-card" data-service-id="${service.id}" data-seo-url="${service.seo_url}">
            <div class="service-header">
                <span class="service-category">${service.category_name}</span>
                <span class="service-price">€${service.price}</span>
            </div>
            <h3 class="service-title">${service.name}</h3>
            <div class="service-duration">
                <i class="fas fa-clock"></i> ${service.duration} Minuten
            </div>
            <p class="service-description">${shortDescription}</p>
            <div class="service-footer">
                <span class="service-cta">
                    Mehr erfahren <i class="fas fa-arrow-right"></i>
                </span>
            </div>
        </div>
    `;
}

// Add click event listeners to service cards
function addServiceCardListeners() {
    const serviceCards = document.querySelectorAll('.service-card');
    
    serviceCards.forEach(card => {
        card.addEventListener('click', function() {
            const seoUrl = this.dataset.seoUrl;
            if (seoUrl) {
                window.location.href = `/service/${seoUrl}`;
            }
        });
        
        // Add hover effect
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}

// Initialize navigation functionality
function initializeNavigation() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            this.classList.toggle('active');
        });
    }
    
    // Close mobile menu when clicking on links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
        });
    });
}

// Initialize smooth scrolling for anchor links
function initializeSmoothScrolling() {
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    
    anchorLinks.forEach(link => {
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

// Utility function to strip HTML tags
function stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
}

// Utility function to truncate text
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
}

// Show error message to user
function showError(message) {
    const servicesGrid = document.getElementById('servicesGrid');
    if (servicesGrid) {
        servicesGrid.innerHTML = `
            <div class="error-message" style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #666;">
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: #e74c3c; margin-bottom: 1rem;"></i>
                <p>${message}</p>
                <button onclick="location.reload()" class="btn btn-primary" style="margin-top: 1rem;">
                    Seite neu laden
                </button>
            </div>
        `;
    }
}

// Add scroll effect to header
window.addEventListener('scroll', function() {
    const header = document.querySelector('.header');
    if (window.scrollY > 100) {
        header.style.background = 'rgba(255, 255, 255, 0.98)';
        header.style.boxShadow = '0 2px 30px rgba(0, 0, 0, 0.15)';
    } else {
        header.style.background = 'rgba(255, 255, 255, 0.95)';
        header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
    }
});

// Add animation on scroll for service cards
function addScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    // Observe service cards when they're loaded
    setTimeout(() => {
        const serviceCards = document.querySelectorAll('.service-card');
        serviceCards.forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(card);
        });
    }, 100);
}

// Call scroll animations after services are loaded
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(addScrollAnimations, 500);
});