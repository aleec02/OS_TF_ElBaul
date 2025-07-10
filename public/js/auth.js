// Global auth variables
let authToken = localStorage.getItem('authToken');
let currentUser = null;

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
function showAlert(type, message) {
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
    const container = document.querySelector('.card-body') || document.querySelector('.container');
    if (container) {
        container.insertBefore(alertDiv, container.firstChild);
    }
}

// Authentication specific JavaScript for ElBaul
// Enhanced login function with better error handling
async function enhancedLogin(email, password, rememberMe = false) {
    try {
        const response = await apiCall('/usuarios/login', {
            method: 'POST',
            body: JSON.stringify({ email, contrasena: password })
        });
        
        if (response.exito) {
            // Store authentication data
            authToken = response.data.token;
            const userData = response.data.usuario;
            
            // Store in localStorage
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('user', JSON.stringify(userData));
            
            // Set remember me
            if (rememberMe) {
                localStorage.setItem('rememberMe', 'true');
            }
            
            // Sync with backend session
            await syncUserSession(userData);
            
            // Update global auth state
            window.authToken = authToken;
            
            // Update UI elements
            updateAuthUI(userData);
            
            return {
                success: true,
                user: userData,
                token: authToken
            };
        }
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

// Enhanced registration function
async function enhancedRegister(userData) {
    try {
        const response = await apiCall('/usuarios/registro', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        
        if (response.exito) {
            return {
                success: true,
                message: 'Cuenta creada exitosamente',
                user: response.data.usuario
            };
        }
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
}

// Enhanced logout function
async function enhancedLogout() {
    try {
        // Call API logout endpoint
        if (authToken) {
            await apiCall('/usuarios/logout', {
                method: 'POST'
            });
        }
    } catch (error) {
        console.error('Logout API error:', error);
        // Continue with logout even if API call fails
    } finally {
        // Clear all stored data
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem('rememberMe');
        
        // Clear session
        try {
            await fetch('/clear-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            console.error('Session clear error:', error);
        }
        
        // Reset global state
        window.authToken = null;
        authToken = null;
        currentUser = null;
        
        // Update UI
        updateAuthUI(null);
        
        return { success: true };
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
        // User is logged out
        // Show login/register links
        authLinks.forEach(link => {
            const listItem = link.closest('li');
            if (listItem) listItem.style.display = 'block';
        });
        
        // Hide user menu
        if (userMenu) {
            userMenu.style.display = 'none';
        }
        
        // Reset cart count
        const cartCount = document.getElementById('cart-count');
        if (cartCount) cartCount.textContent = '0';
    }
}

// Check authentication status on page load
function checkAuthStatus() {
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
        try {
            const userData = JSON.parse(storedUser);
            window.authToken = storedToken;
            authToken = storedToken;
            currentUser = userData;
            
            // Sync with session
            syncUserSession(userData);
            
            // Update UI
            updateAuthUI(userData);
            
            return { authenticated: true, user: userData };
        } catch (error) {
            console.error('Error parsing stored user data:', error);
            // Clear invalid data
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
        }
    }
    
    return { authenticated: false, user: null };
}

// Update cart count function
async function updateCartCount() {
    if (!authToken) return;
    
    try {
        const response = await apiCall('/carrito');
        if (response.exito && response.data.items) {
            const count = response.data.items.reduce((total, item) => total + item.cantidad, 0);
            const cartCount = document.querySelector('.cart-count');
            if (cartCount) {
                cartCount.textContent = count;
                cartCount.style.display = count > 0 ? 'inline' : 'none';
            }
        }
    } catch (error) {
        console.error('Error updating cart count:', error);
    }
}

// Password strength validator
function validatePasswordStrength(password) {
    const strength = {
        score: 0,
        feedback: [],
        isValid: false
    };
    
    if (password.length >= 6) {
        strength.score += 1;
    } else {
        strength.feedback.push('Debe tener al menos 6 caracteres');
    }
    
    if (/[a-z]/.test(password)) {
        strength.score += 1;
    } else {
        strength.feedback.push('Debe incluir letras minúsculas');
    }
    
    if (/[A-Z]/.test(password)) {
        strength.score += 1;
    } else {
        strength.feedback.push('Debe incluir letras mayúsculas');
    }
    
    if (/[0-9]/.test(password)) {
        strength.score += 1;
    } else {
        strength.feedback.push('Debe incluir números');
    }
    
    strength.isValid = strength.score >= 2; // Relaxed requirement
    return strength;
}

// Email validator
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Phone validator (Peruvian format)
function validatePhone(phone) {
    const phoneRegex = /^9\d{8}$/;
    const cleanPhone = phone.replace(/\s|-/g, '');
    return phoneRegex.test(cleanPhone);
}

// Initialize authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Auth.js loaded');
    
    // Check auth status
    const authStatus = checkAuthStatus();
    console.log('Auth status:', authStatus);
    
    // Handle remember me
    const rememberMe = localStorage.getItem('rememberMe');
    if (rememberMe === 'true') {
        const rememberCheckbox = document.getElementById('rememberMe');
        if (rememberCheckbox) {
            rememberCheckbox.checked = true;
        }
    }
});

// Override global logout function
window.logout = enhancedLogout;