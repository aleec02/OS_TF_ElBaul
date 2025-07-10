// Checkout JavaScript for ElBaul
// Handles checkout process, payment methods, and order completion

class Checkout {
    constructor() {
        this.cart = [];
        this.shippingCost = 15; // Default shipping cost
        this.discount = 0;
        this.discountCode = null;
        this.isProcessing = false;
        
        this.init();
    }

    async init() {
        console.log('Checkout initializing...');
        
        // Wait for common functions
        await this.waitForCommonFunctions();
        
        // Initialize components
        this.initializeEventListeners();
        this.loadCartData();
        this.loadUserData();
        this.setupPaymentMethodToggle();
        
        console.log('Checkout initialized');
    }

    async waitForCommonFunctions() {
        return new Promise((resolve) => {
            const checkFunctions = () => {
                if (window.apiCall && window.showAlert && window.updateAuthUI) {
                    resolve();
                } else {
                    setTimeout(checkFunctions, 100);
                }
            };
            checkFunctions();
        });
    }

    initializeEventListeners() {
        // Form submission
        const checkoutForm = document.getElementById('checkoutForm');
        if (checkoutForm) {
            checkoutForm.addEventListener('submit', (e) => this.handleFormSubmission(e));
        }

        // Payment method toggle
        const paymentMethods = document.querySelectorAll('input[name="metodoPago"]');
        paymentMethods.forEach(method => {
            method.addEventListener('change', () => this.togglePaymentInfo());
        });

        // Shipping method toggle
        const shippingMethods = document.querySelectorAll('input[name="metodoEnvio"]');
        shippingMethods.forEach(method => {
            method.addEventListener('change', () => this.updateShippingCost());
        });

        // Coupon application
        const aplicarCuponBtn = document.getElementById('aplicarCupon');
        if (aplicarCuponBtn) {
            aplicarCuponBtn.addEventListener('click', () => this.applyCoupon());
        }

        // Confirm purchase
        const confirmarCompraBtn = document.getElementById('confirmarCompra');
        if (confirmarCompraBtn) {
            confirmarCompraBtn.addEventListener('click', () => this.processPurchase());
        }

        // Form validation
        this.setupFormValidation();
    }

    async loadCartData() {
        try {
            const response = await window.apiCall('/carrito');
            
            if (response.exito) {
                this.cart = response.data.items || [];
                this.renderOrderSummary();
                this.updateTotals();
            } else {
                throw new Error(response.mensaje || 'Error cargando carrito');
            }
        } catch (error) {
            console.error('Error loading cart:', error);
            window.showAlert('danger', 'Error cargando carrito: ' + error.message);
        }
    }

    async loadUserData() {
        try {
            const response = await window.apiCall('/usuarios/perfil');
            
            if (response.exito) {
                const user = response.data.usuario;
                this.populateUserData(user);
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    populateUserData(user) {
        const nombreField = document.getElementById('nombre');
        const apellidoField = document.getElementById('apellido');
        const direccionField = document.getElementById('direccion');
        const telefonoField = document.getElementById('telefono');

        if (nombreField) nombreField.value = user.nombre || '';
        if (apellidoField) apellidoField.value = user.apellido || '';
        if (direccionField) direccionField.value = user.direccion || '';
        if (telefonoField) telefonoField.value = user.telefono || '';
    }

    renderOrderSummary() {
        const orderSummary = document.getElementById('orderSummary');
        if (!orderSummary) return;

        if (this.cart.length === 0) {
            orderSummary.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-shopping-cart fa-3x text-muted mb-3"></i>
                    <p class="text-muted">Tu carrito está vacío</p>
                    <a href="/productos" class="btn btn-primary">Continuar Comprando</a>
                </div>
            `;
            return;
        }

        const itemsHtml = this.cart.map(item => `
            <div class="d-flex align-items-center mb-3">
                <img src="${item.producto.imagen_principal || '/img/default-product.png'}" 
                     class="rounded me-3" width="50" height="50" alt="${item.producto.titulo}">
                <div class="flex-grow-1">
                    <h6 class="mb-1">${item.producto.titulo}</h6>
                    <small class="text-muted">Cantidad: ${item.cantidad}</small>
                </div>
                <div class="text-end">
                    <strong>S/ ${(item.producto.precio * item.cantidad).toFixed(2)}</strong>
                </div>
            </div>
        `).join('');

        orderSummary.innerHTML = `
            <div class="mb-3">
                <h6>Productos (${this.cart.length})</h6>
                ${itemsHtml}
            </div>
        `;
    }

    updateTotals() {
        const subtotal = this.cart.reduce((sum, item) => sum + (item.producto.precio * item.cantidad), 0);
        const igv = (subtotal + this.shippingCost) * 0.18;
        const total = subtotal + this.shippingCost + igv - this.discount;

        // Update display
        document.getElementById('subtotal').textContent = `S/ ${subtotal.toFixed(2)}`;
        document.getElementById('costoEnvio').textContent = `S/ ${this.shippingCost.toFixed(2)}`;
        document.getElementById('igv').textContent = `S/ ${igv.toFixed(2)}`;
        document.getElementById('total').textContent = `S/ ${total.toFixed(2)}`;

        // Update modal total
        const modalTotal = document.getElementById('modalTotal');
        if (modalTotal) {
            modalTotal.textContent = `S/ ${total.toFixed(2)}`;
        }

        // Show/hide discount row
        const descuentoRow = document.getElementById('descuentoRow');
        const descuentoElement = document.getElementById('descuento');
        if (this.discount > 0) {
            descuentoRow.style.display = 'flex';
            descuentoElement.textContent = `-S/ ${this.discount.toFixed(2)}`;
        } else {
            descuentoRow.style.display = 'none';
        }
    }

    updateShippingCost() {
        const envioEstandar = document.getElementById('envioEstandar');
        const envioExpress = document.getElementById('envioExpress');

        if (envioExpress.checked) {
            this.shippingCost = 25;
        } else {
            this.shippingCost = 15;
        }

        this.updateTotals();
    }

    setupPaymentMethodToggle() {
        const tarjetaCredito = document.getElementById('tarjetaCredito');
        const transferencia = document.getElementById('transferencia');
        const tarjetaInfo = document.getElementById('tarjetaInfo');
        const transferenciaInfo = document.getElementById('transferenciaInfo');

        if (tarjetaCredito && transferencia && tarjetaInfo && transferenciaInfo) {
            tarjetaCredito.addEventListener('change', () => {
                tarjetaInfo.style.display = 'block';
                transferenciaInfo.style.display = 'none';
            });

            transferencia.addEventListener('change', () => {
                tarjetaInfo.style.display = 'none';
                transferenciaInfo.style.display = 'block';
            });
        }
    }

    async applyCoupon() {
        const codigoCupon = document.getElementById('codigoCupon').value.trim();
        const cuponMensaje = document.getElementById('cuponMensaje');

        if (!codigoCupon) {
            window.showAlert('warning', 'Por favor ingresa un código de descuento');
            return;
        }

        try {
            const response = await window.apiCall('/cupones/validar', {
                method: 'POST',
                body: JSON.stringify({ codigo: codigoCupon })
            });

            if (response.exito) {
                this.discount = response.data.descuento;
                this.discountCode = codigoCupon;
                this.updateTotals();
                
                cuponMensaje.innerHTML = `
                    <div class="alert alert-success py-2">
                        <i class="fas fa-check me-2"></i>${response.mensaje}
                    </div>
                `;
            } else {
                cuponMensaje.innerHTML = `
                    <div class="alert alert-danger py-2">
                        <i class="fas fa-times me-2"></i>${response.mensaje}
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error applying coupon:', error);
            cuponMensaje.innerHTML = `
                <div class="alert alert-danger py-2">
                    <i class="fas fa-times me-2"></i>Error aplicando cupón
                </div>
            `;
        }
    }

    setupFormValidation() {
        // Credit card number formatting
        const numeroTarjeta = document.getElementById('numeroTarjeta');
        if (numeroTarjeta) {
            numeroTarjeta.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
                value = value.replace(/(\d{4})/g, '$1 ').trim();
                e.target.value = value.substring(0, 19);
            });
        }

        // Expiry date formatting
        const fechaVencimiento = document.getElementById('fechaVencimiento');
        if (fechaVencimiento) {
            fechaVencimiento.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length >= 2) {
                    value = value.substring(0, 2) + '/' + value.substring(2, 4);
                }
                e.target.value = value.substring(0, 5);
            });
        }

        // CVV formatting
        const cvv = document.getElementById('cvv');
        if (cvv) {
            cvv.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/\D/g, '').substring(0, 4);
            });
        }
    }

    validateForm() {
        const requiredFields = [
            'nombre', 'apellido', 'direccion', 'ciudad', 'telefono'
        ];

        for (const fieldId of requiredFields) {
            const field = document.getElementById(fieldId);
            if (!field || !field.value.trim()) {
                window.showAlert('warning', `El campo ${fieldId} es requerido`);
                field?.focus();
                return false;
            }
        }

        // Validate payment method
        const metodoPago = document.querySelector('input[name="metodoPago"]:checked');
        if (!metodoPago) {
            window.showAlert('warning', 'Por favor selecciona un método de pago');
            return false;
        }

        // Validate credit card if selected
        if (metodoPago.value === 'tarjeta_credito') {
            const numeroTarjeta = document.getElementById('numeroTarjeta').value.replace(/\s/g, '');
            const fechaVencimiento = document.getElementById('fechaVencimiento').value;
            const cvv = document.getElementById('cvv').value;
            const nombreTarjeta = document.getElementById('nombreTarjeta').value;

            if (!numeroTarjeta || numeroTarjeta.length < 13) {
                window.showAlert('warning', 'Número de tarjeta inválido');
                return false;
            }

            if (!fechaVencimiento || fechaVencimiento.length !== 5) {
                window.showAlert('warning', 'Fecha de vencimiento inválida');
                return false;
            }

            if (!cvv || cvv.length < 3) {
                window.showAlert('warning', 'CVV inválido');
                return false;
            }

            if (!nombreTarjeta.trim()) {
                window.showAlert('warning', 'Nombre en la tarjeta es requerido');
                return false;
            }
        }

        // Validate terms acceptance
        const aceptarTerminos = document.getElementById('aceptarTerminos');
        if (!aceptarTerminos.checked) {
            window.showAlert('warning', 'Debes aceptar los términos y condiciones');
            return false;
        }

        return true;
    }

    handleFormSubmission(e) {
        e.preventDefault();

        if (!this.validateForm()) {
            return;
        }

        if (this.cart.length === 0) {
            window.showAlert('warning', 'Tu carrito está vacío');
            return;
        }

        // Show confirmation modal
        const modal = new bootstrap.Modal(document.getElementById('confirmacionModal'));
        modal.show();
    }

    async processPurchase() {
        if (this.isProcessing) return;

        this.isProcessing = true;
        
        // Hide confirmation modal
        const confirmacionModal = bootstrap.Modal.getInstance(document.getElementById('confirmacionModal'));
        confirmacionModal.hide();

        // Show processing modal
        const procesamientoModal = new bootstrap.Modal(document.getElementById('procesamientoModal'));
        procesamientoModal.show();

        try {
            // Collect form data
            const formData = this.collectFormData();

            // Process checkout
            const response = await window.apiCall('/ordenes/checkout', {
                method: 'POST',
                body: JSON.stringify(formData)
            });

            if (response.exito) {
                procesamientoModal.hide();
                
                // Show success message
                window.showAlert('success', '¡Compra realizada exitosamente!', null, 5000);
                
                // Redirect to order confirmation
                setTimeout(() => {
                    window.location.href = `/ordenes/${response.data.orden.orden_id}`;
                }, 2000);
            } else {
                throw new Error(response.mensaje || 'Error procesando la compra');
            }
        } catch (error) {
            console.error('Error processing purchase:', error);
            procesamientoModal.hide();
            window.showAlert('danger', 'Error procesando la compra: ' + error.message);
        } finally {
            this.isProcessing = false;
        }
    }

    collectFormData() {
        const form = document.getElementById('checkoutForm');
        const formData = new FormData(form);

        return {
            // Shipping information
            nombre: formData.get('nombre'),
            apellido: formData.get('apellido'),
            direccion: formData.get('direccion'),
            ciudad: formData.get('ciudad'),
            codigoPostal: formData.get('codigoPostal'),
            telefono: formData.get('telefono'),

            // Shipping method
            metodo_envio: formData.get('metodoEnvio'),

            // Payment method
            metodo_pago: formData.get('metodoPago'),

            // Payment details (if credit card)
            numero_tarjeta: formData.get('numeroTarjeta')?.replace(/\s/g, ''),
            fecha_vencimiento: formData.get('fechaVencimiento'),
            cvv: formData.get('cvv'),
            nombre_tarjeta: formData.get('nombreTarjeta'),

            // Additional information
            notas: formData.get('notas'),

            // Discount
            codigo_cupon: this.discountCode,
            descuento: this.discount,

            // Cart items
            items: this.cart.map(item => ({
                producto_id: item.producto.producto_id,
                cantidad: item.cantidad,
                precio_unitario: item.producto.precio
            }))
        };
    }
}

// Initialize checkout when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.checkout = new Checkout();
});

// Export for global access
window.Checkout = Checkout; 