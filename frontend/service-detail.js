// Service Detail Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeServiceDetail();
});

async function initializeServiceDetail() {
    try {
        // Get service SEO URL from current path
        const pathParts = window.location.pathname.split('/');
        const seoUrl = pathParts[pathParts.length - 1];
        
        if (!seoUrl || seoUrl === 'service') {
            showError('Service nicht gefunden.');
            return;
        }
        
        // Load service details
        await loadServiceDetail(seoUrl);
        
        // Load related services
        await loadRelatedServices();
        
        // Initialize navigation
        initializeNavigation();
        
    } catch (error) {
        console.error('Error initializing service detail:', error);
        showError('Fehler beim Laden der Service-Details.');
    }
}

async function loadServiceDetail(seoUrl) {
    try {
        const response = await fetch(`/api/services/url/${seoUrl}`);
        if (!response.ok) {
            throw new Error('Service not found');
        }
        
        const service = await response.json();
        displayServiceDetail(service);
        updatePageMeta(service);
        
    } catch (error) {
        console.error('Error loading service detail:', error);
        showError('Service konnte nicht geladen werden.');
    }
}

function displayServiceDetail(service) {
    const contentContainer = document.getElementById('serviceDetailContent');
    if (!contentContainer) return;
    
    // Update breadcrumb
    updateBreadcrumb(service);
    
    // Create service detail HTML
    const html = `
        <div class="service-detail-header">
            <div class="service-detail-info">
                <h1 class="service-detail-title">${service.name}</h1>
                <div class="service-detail-meta">
                    <div class="meta-item">
                        <i class="fas fa-clock"></i>
                        <span>${service.duration} Minuten</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-tag"></i>
                        <span>${service.category_name}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-calendar"></i>
                        <span>Terminbuchung erforderlich</span>
                    </div>
                </div>
            </div>
            <div class="service-detail-price">
                <span class="price-value">€${service.price}</span>
                <span class="price-label">pro Behandlung</span>
            </div>
        </div>
        
        <div class="service-detail-description">
            ${service.description}
        </div>
        
        <div class="service-features">
            <h3><i class="fas fa-star"></i> Behandlungsdetails</h3>
            <div class="features-grid">
                <div class="feature-item">
                    <i class="fas fa-check-circle"></i>
                    <span>Professionelle Durchführung</span>
                </div>
                <div class="feature-item">
                    <i class="fas fa-check-circle"></i>
                    <span>Qualifizierte Fachkräfte</span>
                </div>
                <div class="feature-item">
                    <i class="fas fa-check-circle"></i>
                    <span>Hochwertige Produkte</span>
                </div>
                <div class="feature-item">
                    <i class="fas fa-check-circle"></i>
                    <span>Entspannte Atmosphäre</span>
                </div>
                <div class="feature-item">
                    <i class="fas fa-check-circle"></i>
                    <span>Individuelle Beratung</span>
                </div>
                <div class="feature-item">
                    <i class="fas fa-check-circle"></i>
                    <span>Hygienische Standards</span>
                </div>
            </div>
        </div>
    `;
    
    contentContainer.innerHTML = html;
}

function updateBreadcrumb(service) {
    const breadcrumbCategory = document.getElementById('breadcrumbCategory');
    const breadcrumbService = document.getElementById('breadcrumbService');
    
    if (breadcrumbCategory) {
        breadcrumbCategory.textContent = service.category_name;
    }
    
    if (breadcrumbService) {
        breadcrumbService.textContent = service.name;
    }
}

function updatePageMeta(service) {
    // Update page title
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        pageTitle.textContent = service.meta_title || `${service.name} - Wellness Oase`;
    }
    
    // Update document title
    document.title = service.meta_title || `${service.name} - Wellness Oase`;
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription && service.meta_description) {
        metaDescription.setAttribute('content', service.meta_description);
    }
}

async function loadRelatedServices() {
    try {
        const response = await fetch('/api/services');
        if (!response.ok) {
            throw new Error('Failed to fetch related services');
        }
        
        const allServices = await response.json();
        
        // Get current service URL to exclude it
        const pathParts = window.location.pathname.split('/');
        const currentSeoUrl = pathParts[pathParts.length - 1];
        
        // Filter out current service and limit to 3 related services
        const relatedServices = allServices
            .filter(service => service.seo_url !== currentSeoUrl)
            .slice(0, 3);
        
        displayRelatedServices(relatedServices);
        
    } catch (error) {
        console.error('Error loading related services:', error);
        // Don't show error for related services, just hide the section
        const relatedSection = document.querySelector('.related-services');
        if (relatedSection) {
            relatedSection.style.display = 'none';
        }
    }
}

function displayRelatedServices(services) {
    const relatedGrid = document.getElementById('relatedServicesGrid');
    if (!relatedGrid || services.length === 0) {
        const relatedSection = document.querySelector('.related-services');
        if (relatedSection) {
            relatedSection.style.display = 'none';
        }
        return;
    }
    
    let html = '';
    services.forEach(service => {
        html += createServiceCard(service);
    });
    
    relatedGrid.innerHTML = html;
    
    // Add click event listeners
    addServiceCardListeners();
}

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

function addServiceCardListeners() {
    const serviceCards = document.querySelectorAll('.service-card');
    
    serviceCards.forEach(card => {
        card.addEventListener('click', function() {
            const seoUrl = this.dataset.seoUrl;
            if (seoUrl) {
                window.location.href = `/service/${seoUrl}`;
            }
        });
    });
}

function initializeNavigation() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            this.classList.toggle('active');
        });
    }
}

// Utility functions
function stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
}

function showError(message) {
    const contentContainer = document.getElementById('serviceDetailContent');
    if (contentContainer) {
        contentContainer.innerHTML = `
            <div class="error-message" style="text-align: center; padding: 4rem; color: #666;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #e74c3c; margin-bottom: 1rem;"></i>
                <h2 style="color: #333; margin-bottom: 1rem;">Fehler</h2>
                <p style="font-size: 1.1rem; margin-bottom: 2rem;">${message}</p>
                <div>
                    <a href="/" class="btn btn-primary" style="margin-right: 1rem;">
                        <i class="fas fa-home"></i> Zur Startseite
                    </a>
                    <button onclick="location.reload()" class="btn btn-outline">
                        <i class="fas fa-refresh"></i> Seite neu laden
                    </button>
                </div>
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