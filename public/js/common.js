// Common JavaScript functions for ElBaul
// This file is loaded on all pages

// Global variables
let authToken = localStorage.getItem('authToken');
let currentUser = JSON.parse(localStorage.getItem('user') || 'null');

// API base URL
const API_BASE_URL = '/api';

// Generic API call function
async function apiCall(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    };
    
    // Add auth token if available
    if (authToken) {
        config.headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    try {
        const response = await fetch(url, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.mensaje || `HTTP error! status: ${response.status}`);
        }
        
        return data;
    } catch (error) {
        console.error('API call error:', error);
        throw error;
    }
}

// Show alert function
function showAlert(type, message, container = null) {
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.auth-alert, .alert');
    existingAlerts.forEach(alert => alert.remove());
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show auth-alert`;
    alertDiv.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' || type === 'danger' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Insert at the top of the container
    const targetContainer = container || document.querySelector('.card-body') || document.querySelector('.container') || document.body;
    if (targetContainer) {
        targetContainer.insertBefore(alertDiv, targetContainer.firstChild);
    }
}

// Update authentication UI elements
function updateAuthUI(userData) {
    // Update navbar user info
    const userDropdown = document.querySelector('.navbar-nav .dropdown-toggle');
    const authLinks = document.querySelectorAll('.nav-link[href="/login"], .nav-link[href="/registro"]');
    const userMenu = document.querySelector('.navbar-nav .dropdown');
    
    if (userData) {
        // User is logged in
        if (userDropdown) {
            userDropdown.innerHTML = `<i class="fas fa-user-circle me-1"></i>${userData.nombre}`;
        }
        
        // Hide login/register links
        authLinks.forEach(link => {
            const listItem = link.closest('li');
            if (listItem) listItem.style.display = 'none';
        });
        
        // Show user menu
        if (userMenu) {
            userMenu.style.display = 'block';
        }
        
        // Update cart count
        updateCartCount();
    } else {
        // User is not logged in
        if (userDropdown) {
            userDropdown.innerHTML = `<i class="fas fa-user-circle me-1"></i>Usuario`;
        }
        
        // Show login/register links
        authLinks.forEach(link => {
            const listItem = link.closest('li');
            if (listItem) listItem.style.display = 'block';
        });
        
        // Hide user menu
        if (userMenu) {
            userMenu.style.display = 'none';
        }
        
        // Clear cart count
        const cartBadge = document.querySelector('.cart-count');
        if (cartBadge) {
            cartBadge.style.display = 'none';
        }
    }
}

// Check authentication status on page load
async function checkAuthStatus() {
    if (authToken && currentUser) {
        try {
            // Verify token is still valid
            const response = await apiCall('/usuarios/perfil');
            if (response.exito) {
                currentUser = response.data.usuario;
                localStorage.setItem('user', JSON.stringify(currentUser));
                updateAuthUI(currentUser);
                return true;
            }
        } catch (error) {
            console.log('Token invalid, clearing auth data');
            clearAuthData();
        }
    }
    
    updateAuthUI(null);
    return false;
}

// Clear authentication data
function clearAuthData() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('rememberMe');
    authToken = null;
    currentUser = null;
    window.authToken = null;
}

// Update cart count
async function updateCartCount() {
    if (!authToken) return;
    
    try {
        const response = await apiCall('/carrito');
        if (response.exito && response.data.total_items > 0) {
            const cartBadge = document.querySelector('.cart-count');
            if (cartBadge) {
                cartBadge.textContent = response.data.total_items;
                cartBadge.style.display = 'inline';
            }
        }
    } catch (error) {
        console.error('Error updating cart count:', error);
    }
}

// Sync user session with backend
async function syncUserSession(userData) {
    try {
        const response = await fetch('/sync-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user: userData })
        });
        const result = await response.json();
        return result.success;
    } catch (error) {
        console.error('Session sync error:', error);
        return false;
    }
}

// Check and sync user session on page load
async function checkAndSyncSession() {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('authToken');
    
    if (storedUser && storedToken) {
        try {
            const userData = JSON.parse(storedUser);
            await syncUserSession(userData);
            
            // Update global variables
            window.currentUser = userData;
            window.authToken = storedToken;
            
            // Update UI
            updateAuthUI(userData);
        } catch (error) {
            console.error('Error checking session:', error);
        }
    }
}

// Utility functions
function formatPrice(price) {
    return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN'
    }).format(price);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('es-PE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Search functionality
function setupSearch() {
    const searchForm = document.getElementById('nav-search-form');
    const searchInput = document.getElementById('nav-search-input');
    
    if (searchForm && searchInput) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const query = searchInput.value.trim();
            if (query.length >= 2) {
                window.location.href = `/buscar?q=${encodeURIComponent(query)}`;
            }
        });
    }
}

// Initialize common functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('Common.js loaded');
    
    // Check and sync session first
    checkAndSyncSession();
    
    // Check auth status
    checkAuthStatus();
    
    // Setup search
    setupSearch();
    
    // Setup global auth variables
    window.authToken = authToken;
    window.currentUser = currentUser;
    window.apiCall = apiCall;
    window.showAlert = showAlert;
    window.updateAuthUI = updateAuthUI;
    window.syncUserSession = syncUserSession;
    window.formatPrice = formatPrice;
    window.formatDate = formatDate;
});

// Export for use in other modules
window.ElBaulCommon = {
    apiCall,
    showAlert,
    updateAuthUI,
    checkAuthStatus,
    clearAuthData,
    updateCartCount,
    syncUserSession,
    checkAndSyncSession,
    formatPrice,
    formatDate,
    debounce
}; 