// Register Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    console.log('Register page loaded');
    
    // Wait for common functions to be ready
    waitForCommonFunctions().then(() => {
        initializeRegisterForm();
    });
});

function waitForCommonFunctions() {
    return new Promise((resolve) => {
        const checkFunctions = () => {
            if (window.apiCall && window.showAlert) {
                console.log('Common functions ready for register page');
                resolve();
            } else {
                console.log('Waiting for common functions...');
                setTimeout(checkFunctions, 100);
            }
        };
        checkFunctions();
    });
}

function initializeRegisterForm() {
    console.log('Initializing register form...');
    
    const registerForm = document.getElementById('registerForm');
    const registerBtn = document.getElementById('registerBtn');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('contrasena');
    
    if (!registerForm) {
        console.error('Register form not found');
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
    
    // Password confirmation check
    const confirmPasswordInput = document.getElementById('confirmarContrasena');
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', function() {
            const password = passwordInput.value;
            const confirmPassword = this.value;
            
            if (confirmPassword && password !== confirmPassword) {
                showFieldError('confirmarContrasena', 'Las contraseñas no coinciden');
            } else {
                clearFieldError('confirmarContrasena');
            }
        });
    }
    
    // Handle form submission
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('Register form submitted');
        
        // Clear previous errors
        clearAllErrors();
        
        // Get form data
        const formData = getFormData();
        
        // Validate form
        if (!validateRegisterForm(formData)) {
            return;
        }
        
        // Show loading state
        setLoadingState(true);
        
        try {
            console.log('Attempting registration...');
            
            const response = await window.apiCall('/usuarios/registro', {
                method: 'POST',
                body: JSON.stringify({
                    nombre: formData.nombre,
                    apellido: formData.apellido,
                    email: formData.email,
                    telefono: formData.telefono,
                    direccion: formData.direccion,
                    contrasena: formData.contrasena
                })
            });
            
            console.log('Registration response:', response);
            
            if (response.exito) {
                window.showAlert('success', '¡Cuenta creada exitosamente! Redirigiendo al login...');
                
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            } else {
                throw new Error(response.mensaje || 'Error al crear la cuenta');
            }
        } catch (error) {
            console.error('Registration error:', error);
            
            // Handle specific error cases
            if (error.message && error.message.includes('EMAIL_EXISTS')) {
                showFieldError('email', 'Este email ya está registrado');
            } else if (error.message && error.message.includes('MISSING_FIELDS')) {
                window.showAlert('danger', 'Por favor completa todos los campos requeridos');
            } else {
                window.showAlert('danger', error.message || 'Error al crear la cuenta. Intenta de nuevo.');
            }
            
            setLoadingState(false);
        }
    });
    
    console.log('Register form initialized successfully');
}

function getFormData() {
    return {
        nombre: document.getElementById('nombre').value.trim(),
        apellido: document.getElementById('apellido').value.trim(),
        email: document.getElementById('email').value.trim(),
        telefono: document.getElementById('telefono').value.trim(),
        direccion: document.getElementById('direccion').value.trim(),
        contrasena: document.getElementById('contrasena').value,
        confirmarContrasena: document.getElementById('confirmarContrasena').value,
        aceptarTerminos: document.getElementById('aceptarTerminos').checked
    };
}

function validateRegisterForm(data) {
    let isValid = true;
    
    // Required fields
    if (!data.nombre) {
        showFieldError('nombre', 'El nombre es requerido');
        isValid = false;
    }
    
    if (!data.apellido) {
        showFieldError('apellido', 'El apellido es requerido');
        isValid = false;
    }
    
    if (!data.email || !validateEmail(data.email)) {
        showFieldError('email', 'Por favor ingresa un correo válido');
        isValid = false;
    }
    
    if (data.telefono && !validatePhone(data.telefono)) {
        showFieldError('telefono', 'El teléfono debe tener 9 dígitos');
        isValid = false;
    }
    
    if (!data.contrasena || data.contrasena.length < 6) {
        showFieldError('contrasena', 'La contraseña debe tener al menos 6 caracteres');
        isValid = false;
    }
    
    if (data.contrasena !== data.confirmarContrasena) {
        showFieldError('confirmarContrasena', 'Las contraseñas no coinciden');
        isValid = false;
    }
    
    if (!data.aceptarTerminos) {
        showFieldError('aceptarTerminos', 'Debes aceptar los términos y condiciones');
        isValid = false;
    }
    
    return isValid;
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePhone(phone) {
    const phoneRegex = /^\d{9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
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

function clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    const errorDiv = document.getElementById(fieldId + '-error');
    
    if (field) {
        field.classList.remove('is-invalid');
    }
    if (errorDiv) {
        errorDiv.textContent = '';
    }
}

function clearAllErrors() {
    const fields = ['nombre', 'apellido', 'email', 'telefono', 'direccion', 'contrasena', 'confirmarContrasena', 'aceptarTerminos'];
    fields.forEach(fieldId => clearFieldError(fieldId));
}

function setLoadingState(loading) {
    const registerBtn = document.getElementById('registerBtn');
    if (!registerBtn) return;
    
    const registerText = registerBtn.querySelector('.register-text');
    const loadingSpinner = registerBtn.querySelector('.loading-spinner');
    
    if (loading) {
        registerBtn.disabled = true;
        if (registerText) registerText.classList.add('d-none');
        if (loadingSpinner) loadingSpinner.classList.remove('d-none');
    } else {
        registerBtn.disabled = false;
        if (registerText) registerText.classList.remove('d-none');
        if (loadingSpinner) loadingSpinner.classList.add('d-none');
    }
} 