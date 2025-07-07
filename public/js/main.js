// Main JavaScript for ElBaul frontend

// Global configuration
const API_BASE_URL = '/api';
let authToken = localStorage.getItem('authToken');

// Set default headers for all fetch requests
const defaultHeaders = {
    'Content-Type': 'application/json'
};

if (authToken) {
    defaultHeaders['Authorization'] = `Bearer ${authToken}`;
}

// Utility function for API calls
async function apiCall(endpoint, options = {}) {
    const config = {
        method: 'GET',
        headers: { ...defaultHeaders },
        ...options
    };
    
    // Always include current token if available
    const currentToken = localStorage.getItem('authToken');
    if (currentToken && !config.headers['Authorization']) {
        config.headers['Authorization'] = `Bearer ${currentToken}`;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.mensaje || 'Error en la petición');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Authentication functions (basic versions - enhanced versions in auth.js)
async function login(email, password) {
    try {
        const response = await apiCall('/usuarios/login', {
            method: 'POST',
            body: JSON.stringify({ email, contrasena: password })
        });
        
        if (response.exito) {
            authToken = response.data.token;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('user', JSON.stringify(response.data.usuario));
            
            // Sync with session
            await syncUserSession(response.data.usuario);
            
            showAlert('success', 'Sesión iniciada correctamente');
            setTimeout(() => {
                window.location.href = '/';
            }, 1500);
        }
    } catch (error) {
        showAlert('error', error.message || 'Error al iniciar sesión');
    }
}

async function logout() {
    try {
        await apiCall('/usuarios/logout', { method: 'POST' });
        
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        authToken = null;
        
        // Clear session
        await fetch('/clear-session', { method: 'POST' });
        
        showAlert('success', 'Sesión cerrada correctamente');
        setTimeout(() => {
            window.location.href = '/login';
        }, 1500);
    } catch (error) {
        // Even if API call fails, clear local storage
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
    }
}

// Sync user data with backend session
async function syncUserSession(userData) {
    try {
        await fetch('/sync-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user: userData })
        });
    } catch (error) {
        console.error('Session sync error:', error);
    }
}

// Cart functions
async function addToCart(productId, cantidad = 1) {
    try {
        if (!authToken) {
            showAlert('warning', 'Debes iniciar sesión para agregar productos al carrito');
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
            return;
        }
        
        const response = await apiCall('/carrito/items', {
            method: 'POST',
            body: JSON.stringify({ producto_id: productId, cantidad })
        });
        
        if (response.exito) {
            showAlert('success', 'Producto agregado al carrito');
            updateCartCount();
        }
    } catch (error) {
        showAlert('error', error.message || 'Error al agregar al carrito');
    }
}

async function updateCartCount() {
    try {
        if (!authToken) return;
        
        const response = await apiCall('/carrito');
        if (response.exito && response.data.carrito) {
            const count = response.data.carrito.items ? response.data.carrito.items.length : 0;
            const cartCountElement = document.getElementById('cart-count');
            if (cartCountElement) {
                cartCountElement.textContent = count;
                // Show/hide badge based on count
                if (count > 0) {
                    cartCountElement.style.display = 'inline';
                } else {
                    cartCountElement.style.display = 'none';
                }
            }
        }
    } catch (error) {
        console.error('Error updating cart count:', error);
    }
}

// Favorites functions
async function toggleFavorite(productId) {
    try {
        if (!authToken) {
            showAlert('warning', 'Debes iniciar sesión para agregar favoritos');
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
            return;
        }
        
        const response = await apiCall('/favoritos', {
            method: 'POST',
            body: JSON.stringify({ producto_id: productId })
        });
        
        if (response.exito) {
            const heartIcon = document.querySelector(`[data-product-id="${productId}"] i`);
            if (heartIcon) {
                heartIcon.classList.toggle('fas');
                heartIcon.classList.toggle('far');
            }
            showAlert('success', 'Favorito actualizado');
        }
    } catch (error) {
        showAlert('error', error.message || 'Error al actualizar favorito');
    }
}

// Search functionality
function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    
    if (searchInput && searchBtn) {
        searchBtn.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
        
        // Auto-complete functionality
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const term = this.value.trim();
                if (term.length >= 2) {
                    showSearchSuggestions(term);
                } else {
                    hideSearchSuggestions();
                }
            }, 300);
        });
    }
}

function performSearch() {
    const searchTerm = document.getElementById('searchInput').value.trim();
    if (searchTerm) {
        window.location.href = `/productos?q=${encodeURIComponent(searchTerm)}`;
    }
}

async function showSearchSuggestions(term) {
    try {
        const response = await apiCall(`/productos/buscar?q=${encodeURIComponent(term)}&limit=5`);
        if (response.exito && response.data.productos.length > 0) {
            displaySearchSuggestions(response.data.productos);
        }
    } catch (error) {
        console.error('Search suggestions error:', error);
    }
}

function displaySearchSuggestions(products) {
    // Create suggestions dropdown if it doesn't exist
    let suggestionsDiv = document.getElementById('search-suggestions');
    if (!suggestionsDiv) {
        suggestionsDiv = document.createElement('div');
        suggestionsDiv.id = 'search-suggestions';
        suggestionsDiv.className = 'position-absolute bg-white border rounded shadow-sm w-100';
        suggestionsDiv.style.zIndex = '1000';
        suggestionsDiv.style.top = '100%';
        
        const searchContainer = document.querySelector('.input-group');
        searchContainer.style.position = 'relative';
        searchContainer.appendChild(suggestionsDiv);
    }
    
    const suggestionsHTML = products.map(product => `
        <div class="p-2 border-bottom search-suggestion" style="cursor: pointer;" 
             onclick="selectSuggestion('${product.titulo}')">
            <small><strong>${product.titulo}</strong> - S/ ${product.precio}</small>
        </div>
    `).join('');
    
    suggestionsDiv.innerHTML = suggestionsHTML;
    suggestionsDiv.style.display = 'block';
}

function selectSuggestion(title) {
    document.getElementById('searchInput').value = title;
    hideSearchSuggestions();
    performSearch();
}

function hideSearchSuggestions() {
    const suggestionsDiv = document.getElementById('search-suggestions');
    if (suggestionsDiv) {
        suggestionsDiv.style.display = 'none';
    }
}

// Utility functions
function showAlert(type, message) {
    const alertClass = type === 'success' ? 'alert-success' : 
                     type === 'warning' ? 'alert-warning' : 'alert-danger';
    const alertIcon = type === 'success' ? 'fas fa-check-circle' : 
                     type === 'warning' ? 'fas fa-exclamation-triangle' : 'fas fa-exclamation-circle';
    
    const alertHtml = `
        <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
            <i class="${alertIcon} me-2"></i>${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    
    const container = document.getElementById('alerts-container');
    if (container) {
        container.innerHTML = alertHtml;
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            const alert = container.querySelector('.alert');
            if (alert) {
                const bsAlert = new bootstrap.Alert(alert);
                bsAlert.close();
            }
        }, 5000);
    }
}

function formatPrice(price) {
    return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN',
        minimumFractionDigits: 0
    }).format(price);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('es-PE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Hace 1 día';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.ceil(diffDays / 7)} semanas`;
    return formatDate(dateString);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize search
    initializeSearch();
    
    // Update cart count if user is logged in
    if (authToken) {
        updateCartCount();
    }
    
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Check if user data in localStorage matches session
    const storedUser = localStorage.getItem('user');
    if (storedUser && authToken) {
        try {
            const userData = JSON.parse(storedUser);
            syncUserSession(userData);
        } catch (error) {
            console.error('Error parsing stored user data:', error);
        }
    }
    
    // Hide search suggestions when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.input-group')) {
            hideSearchSuggestions();
        }
    });
});

// Global error handler
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
});

// Handle unauthorized responses globally
window.addEventListener('unhandledrejection', function(e) {
    if (e.reason && e.reason.message && e.reason.message.includes('Token inválido')) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
    }
});