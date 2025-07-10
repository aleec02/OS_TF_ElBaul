// Common JavaScript functions for ElBaul
// This file is loaded on all pages

// Global variables - will be properly initialized after DOM load
let authToken = null;
let currentUser = null;
let isCommonInitialized = false;
let uiUpdateTimeout = null;

// API base URL
const API_BASE_URL = '/api';

// Initialize authentication state from localStorage
function initializeAuthState() {
    authToken = localStorage.getItem('authToken');
    currentUser = JSON.parse(localStorage.getItem('user') || 'null');
    
    // Update global window variables
    window.authToken = authToken;
    window.currentUser = currentUser;
    
    console.log('Auth state initialized:', { 
        hasToken: !!authToken, 
        hasUser: !!currentUser,
        userName: currentUser?.nombre 
    });
}

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
    
    // Add auth token if available (use the global authToken, not localStorage directly)
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
    // Remove existing alerts with same message to prevent duplicates
    const existingAlerts = document.querySelectorAll('.auth-alert');
    existingAlerts.forEach(alert => {
        if (alert.textContent.includes(message)) {
            alert.remove();
        }
    });
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show auth-alert`;
    alertDiv.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' || type === 'danger' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Insert at the top of the container
    const targetContainer = container || document.querySelector('#alerts-container') || document.querySelector('.container') || document.body;
    if (targetContainer) {
        targetContainer.insertBefore(alertDiv, targetContainer.firstChild);
    }
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

// Update authentication UI elements (DEBOUNCED)
function updateAuthUI(userData) {
    // Clear any pending UI updates
    if (uiUpdateTimeout) {
        clearTimeout(uiUpdateTimeout);
    }
    
    // Debounce UI updates to prevent multiple rapid calls
    uiUpdateTimeout = setTimeout(() => {
        performAuthUIUpdate(userData);
    }, 50);
}

function performAuthUIUpdate(userData) {
    console.log('Updating auth UI with user:', userData?.nombre || 'null');
    
    // Update navbar user info
    const userDropdown = document.querySelector('.navbar-nav .dropdown-toggle');
    const authLinks = document.querySelectorAll('.nav-link[href="/login"], .nav-link[href="/registro"]');
    const userMenu = document.querySelector('.navbar-nav .dropdown');
    const cartLink = document.querySelector('.nav-link[href="/carrito"]');
    const favoritesLink = document.querySelector('.nav-link[href="/favoritos"]');
    
    if (userData) {
        // User is logged in
        if (userDropdown) {
            const userNameSpan = userDropdown.querySelector('.user-name');
            if (userNameSpan) {
                userNameSpan.textContent = userData.nombre;
            } else {
                userDropdown.innerHTML = `<i class="fas fa-user"></i> <span class="user-name">${userData.nombre}</span>`;
            }
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
        
        // Show cart and favorites links
        if (cartLink) {
            const listItem = cartLink.closest('li');
            if (listItem) listItem.style.display = 'block';
        }
        if (favoritesLink) {
            const listItem = favoritesLink.closest('li');
            if (listItem) listItem.style.display = 'block';
        }
        
        // Update cart count (debounced)
        debounce(updateCartCount, 500)();
    } else {
        // User is not logged in
        if (userDropdown) {
            userDropdown.innerHTML = `<i class="fas fa-user"></i> Usuario`;
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
        
        // Hide cart and favorites links
        if (cartLink) {
            const listItem = cartLink.closest('li');
            if (listItem) listItem.style.display = 'none';
        }
        if (favoritesLink) {
            const listItem = favoritesLink.closest('li');
            if (listItem) listItem.style.display = 'none';
        }
        
        // Clear cart count
        const cartBadge = document.querySelector('.cart-count');
        if (cartBadge) {
            cartBadge.style.display = 'none';
        }
    }
}

// Update authentication state (can be called from other parts of the app)
function updateAuthState(token, userData) {
    authToken = token;
    currentUser = userData;
    window.authToken = token;
    window.currentUser = userData;
    
    if (token && userData) {
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(userData));
    } else {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
    }
    
    console.log('Auth state updated:', { 
        hasToken: !!token, 
        hasUser: !!userData,
        userName: userData?.nombre 
    });
    
    updateAuthUI(userData);
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
                window.currentUser = currentUser;
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
    window.currentUser = null;
}

// Logout function
async function logout() {
    try {
        // Clear frontend data first
        clearAuthData();
        
        // Clear backend session
        await fetch('/clear-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        // Update UI
        updateAuthUI(null);
        
        // Redirect to home page
        window.location.href = '/';
        
    } catch (error) {
        console.error('Logout error:', error);
        // Even if there's an error, clear local data and redirect
        clearAuthData();
        updateAuthUI(null);
        window.location.href = '/';
    }
}

// Make logout function globally available
window.logout = logout;

// Update cart count (DEBOUNCED)
const updateCartCount = debounce(async function() {
    if (!authToken) return;
    
    try {
        const response = await apiCall('/carrito');
        if (response.exito && response.data.total_items > 0) {
            const cartBadge = document.querySelector('.cart-count');
            if (cartBadge) {
                cartBadge.textContent = response.data.total_items;
                cartBadge.style.display = 'inline';
            }
        } else {
            // Hide cart badge if no items
            const cartBadge = document.querySelector('.cart-count');
            if (cartBadge) {
                cartBadge.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error updating cart count:', error);
    }
}, 1000);

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
            authToken = storedToken;
            currentUser = userData;
            window.authToken = storedToken;
            window.currentUser = userData;
            
            console.log('Session synced successfully for user:', userData.nombre);
            
            // Update UI (DEBOUNCED to prevent flickering)
            setTimeout(() => {
                updateAuthUI(userData);
            }, 100);
            
            return true;
        } catch (error) {
            console.error('Error checking session:', error);
            return false;
        }
    }
    return false;
}

// Utility functions
function formatPrice(price) {
    return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN'
    }).format(price);
}

function formatDate(dateString) {
    try {
        if (!dateString) return 'Fecha no disponible';
        
        let date;
        
        // Handle different date formats
        if (dateString instanceof Date) {
            date = dateString;
        } else if (typeof dateString === 'string') {
            // Handle ISO format with or without Z
            if (dateString.includes('T')) {
                // Add Z if missing for proper ISO format
                const isoString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
                date = new Date(isoString);
            } else {
                date = new Date(dateString);
            }
        } else if (typeof dateString === 'number') {
            date = new Date(dateString);
        } else {
            return 'Formato de fecha inválido';
        }
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
            console.warn('Invalid date:', dateString);
            return 'Fecha inválida';
        }
        
        return date.toLocaleDateString('es-PE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
    } catch (error) {
        console.error('Error formatting date:', error, 'Input:', dateString);
        return 'Error en fecha';
    }
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
                window.location.href = `/productos?q=${encodeURIComponent(query)}`;
            }
        });
    }
}

// Initialize common functionality (PREVENT MULTIPLE CALLS)
document.addEventListener('DOMContentLoaded', async function() {
    if (isCommonInitialized) {
        console.log('Common.js already initialized, skipping...');
        return;
    }
    
    isCommonInitialized = true;
    console.log('Common.js loaded - initializing...');
    
    // Initialize auth state first
    initializeAuthState();
    
    // Check and sync session
    const sessionSynced = await checkAndSyncSession();
    
    // If session wasn't synced, check auth status
    if (!sessionSynced) {
        await checkAuthStatus();
    }
    
    // Setup search
    setupSearch();
    
    // Setup global auth variables
    window.apiCall = apiCall;
    window.showAlert = showAlert;
    window.updateAuthUI = updateAuthUI;
    window.updateAuthState = updateAuthState;
    window.syncUserSession = syncUserSession;
    window.formatPrice = formatPrice;
    window.formatDate = formatDate;
    window.debounce = debounce;
    window.updateCartCount = updateCartCount;
    
    console.log('Common.js initialization complete');
    
    // Ensure UI is updated after everything is loaded (SINGLE FINAL UPDATE)
    setTimeout(() => {
        if (currentUser) {
            console.log('Final UI update for user:', currentUser.nombre);
            updateAuthUI(currentUser);
        }
    }, 200);
});

// Export for use in other modules
window.ElBaulCommon = {
    apiCall,
    showAlert,
    updateAuthUI,
    updateAuthState,
    checkAuthStatus,
    clearAuthData,
    updateCartCount,
    syncUserSession,
    checkAndSyncSession,
    formatPrice,
    formatDate,
    debounce
};