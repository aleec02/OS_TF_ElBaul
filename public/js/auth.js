// Auth-specific JavaScript for ElBaul
// This file extends the common functionality for authentication pages

// Wait for common.js to be ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Auth.js loaded - initializing...');
    
    // Use common functions from common.js
    const { apiCall, showAlert, updateAuthUI, syncUserSession } = window.ElBaulCommon || {};
    
    // Make functions available globally for auth pages
    window.ElBaulAuth = {
        validatePasswordStrength,
        validateEmail,
        validatePhone,
        enhancedLogout,
        initializeLoginForm,
        validateLoginForm
    };
    
    // Also make common functions available if not already set
    if (!window.apiCall && apiCall) {
        window.apiCall = apiCall;
    }
    if (!window.showAlert && showAlert) {
        window.showAlert = showAlert;
    }
    
    // Initialize login form if we're on the login page
    if (document.getElementById('loginForm')) {
        console.log('Login form detected, initializing...');
        initializeLoginForm();
    }
    
    console.log('Auth.js initialization complete');
});

// Login form validation
function validateLoginForm(email, password) {
    let isValid = true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email || !emailRegex.test(email)) {
        showFieldError('email', 'Por favor ingresa un correo válido');
        isValid = false;
    }
    
    if (!password || password.length < 6) {
        showFieldError('password', 'La contraseña debe tener al menos 6 caracteres');
        isValid = false;
    }
    
    return isValid;
}

function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorDiv = document.getElementById(fieldId + '-error');
    
    if (field) {
        field.classList.add('is-invalid');
    }
    if (errorDiv) {
        errorDiv.textContent = message;
    }
}

function clearErrors() {
    const fields = ['email', 'password'];
    fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        const errorDiv = document.getElementById(fieldId + '-error');
        
        if (field) {
            field.classList.remove('is-invalid');
        }
        if (errorDiv) {
            errorDiv.textContent = '';
        }
    });
}

function setLoadingState(loading) {
    const loginBtn = document.getElementById('loginBtn');
    if (!loginBtn) return;
    
    const loginText = loginBtn.querySelector('.login-text');
    const loadingSpinner = loginBtn.querySelector('.loading-spinner');
    
    if (loading) {
        loginBtn.disabled = true;
        if (loginText) loginText.classList.add('d-none');
        if (loadingSpinner) loadingSpinner.classList.remove('d-none');
    } else {
        loginBtn.disabled = false;
        if (loginText) loginText.classList.remove('d-none');
        if (loadingSpinner) loadingSpinner.classList.add('d-none');
    }
}

// Initialize login form functionality
function initializeLoginForm() {
    console.log('Initializing login form...');
    
    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    
    console.log('Login form found:', !!loginForm);
    console.log('Login button found:', !!loginBtn);
    
    if (!loginForm) {
        console.log('Login form not found, retrying in 500ms...');
        setTimeout(initializeLoginForm, 500);
        return;
    }
    
    // Toggle password visibility
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            const icon = this.querySelector('i');
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });
    }
    
    // Wait for common functions to be available
    function waitForCommonFunctions() {
        return new Promise((resolve) => {
            const checkFunctions = () => {
                console.log('Checking for common functions:', {
                    apiCall: typeof window.apiCall,
                    showAlert: typeof window.showAlert,
                    updateAuthUI: typeof window.updateAuthUI
                });
                
                if (window.apiCall && window.showAlert && window.updateAuthUI) {
                    console.log('Common functions are available');
                    resolve();
                } else {
                    console.log('Common functions not ready, retrying...');
                    setTimeout(checkFunctions, 100);
                }
            };
            checkFunctions();
        });
    }
    
    // Initialize login handler
    waitForCommonFunctions().then(() => {
        console.log('Attaching login form event listener');
        
        // Handle form submission
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('Login form submitted');
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const rememberMe = document.getElementById('rememberMe').checked;
            
            console.log('Login attempt:', { email, hasPassword: !!password, rememberMe });
            
            // Clear previous errors
            clearErrors();
            
            // Validate form
            if (!validateLoginForm(email, password)) {
                return;
            }
            
            // Show loading state
            setLoadingState(true);
            
            try {
                console.log('Making API call to login...');
                
                const response = await window.apiCall('/usuarios/login', {
                    method: 'POST',
                    body: JSON.stringify({ 
                        email: email, 
                        contrasena: password 
                    })
                });
                
                console.log('Login response:', response);
                
                if (response.exito) {
                    const token = response.data.token;
                    const userData = response.data.usuario;
                    
                    console.log('Login successful, storing data...');
                    
                    // Store in localStorage
                    localStorage.setItem('authToken', token);
                    localStorage.setItem('user', JSON.stringify(userData));
                    
                    if (rememberMe) {
                        localStorage.setItem('rememberMe', 'true');
                    }
                    
                    // Update global variables
                    if (typeof window.updateAuthState === 'function') {
                        window.updateAuthState(token, userData);
                    } else {
                        window.authToken = token;
                        window.currentUser = userData;
                    }
                    
                    // Sync with backend session
                    if (typeof window.syncUserSession === 'function') {
                        await window.syncUserSession(userData);
                    }
                    
                    // Update UI
                    if (typeof window.updateAuthUI === 'function') {
                        window.updateAuthUI(userData);
                    }
                    
                    // Show success message
                    window.showAlert('success', '¡Bienvenido! Redirigiendo...');
                    
                    setTimeout(() => {
                        window.location.href = '/perfil';
                    }, 1500);
                } else {
                    throw new Error(response.mensaje || 'Error al iniciar sesión');
                }
            } catch (error) {
                console.error('Login error:', error);
                window.showAlert('danger', error.message || 'Error al iniciar sesión. Verifica tus credenciales.');
                setLoadingState(false);
            }
        });
        
        console.log('Login form event listener attached successfully');
    });
}

// Auth-specific utility functions
function validatePasswordStrength(password) {
    const minLength = 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const strength = {
        length: password.length >= minLength,
        upperCase: hasUpperCase,
        lowerCase: hasLowerCase,
        numbers: hasNumbers,
        specialChar: hasSpecialChar
    };
    
    const score = Object.values(strength).filter(Boolean).length;
    
    return {
        isValid: score >= 3 && strength.length,
        score: score,
        feedback: {
            length: strength.length ? '✓' : `Mínimo ${minLength} caracteres`,
            upperCase: hasUpperCase ? '✓' : 'Incluir mayúscula',
            lowerCase: hasLowerCase ? '✓' : 'Incluir minúscula',
            numbers: hasNumbers ? '✓' : 'Incluir número',
            specialChar: hasSpecialChar ? '✓' : 'Incluir carácter especial'
        }
    };
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePhone(phone) {
    const phoneRegex = /^\d{9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

// Enhanced logout function for auth pages
async function enhancedLogout() {
    try {
        // Call API logout endpoint
        const token = localStorage.getItem('authToken');
        if (token) {
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
        
        // Update UI
        updateAuthUI(null);
        
        return { success: true };
    }
}
