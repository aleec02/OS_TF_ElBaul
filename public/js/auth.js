// Auth-specific JavaScript for ElBaul
// This file extends the common functionality for authentication pages

// Wait for common.js to be ready
document.addEventListener('DOMContentLoaded', function() {
    // Use common functions from common.js
    const { apiCall, showAlert, updateAuthUI, syncUserSession } = window.ElBaulCommon || {};
    
    // Make functions available globally for auth pages
    window.ElBaulAuth = {
        validatePasswordStrength,
        validateEmail,
        validatePhone,
        enhancedLogout
    };
    
    // Also make common functions available if not already set
    if (!window.apiCall && apiCall) {
        window.apiCall = apiCall;
    }
    if (!window.showAlert && showAlert) {
        window.showAlert = showAlert;
    }
});

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
// Functions are now exported in the DOMContentLoaded event above
