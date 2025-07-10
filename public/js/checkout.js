// Checkout functionality for ElBaul
let isCheckoutInitialized = false;

// Initialize when DOM is loaded (PROTECTED AGAINST MULTIPLE CALLS)
document.addEventListener('DOMContentLoaded', function() {
    console.log('🛒 Checkout.js DOMContentLoaded triggered');
    
    if (isCheckoutInitialized) {
        console.log('⚠️ Checkout.js already initialized, skipping...');
        return; // Prevent multiple initializations
    }
    
    console.log('✅ Checkout page loaded - initializing...');
    isCheckoutInitialized = true;
    
    // Wait for common functions to be ready
    waitForCommonFunctions().then(() => {
        console.log('🔧 Common functions ready, loading checkout');
        loadCheckout();
    });
});

// Wait for common functions to be available
function waitForCommonFunctions() {
    return new Promise((resolve) => {
        const checkFunctions = () => {
            if (window.apiCall && window.showAlert) {
                console.log('Common functions ready for checkout');
                resolve();
            } else {
                console.log('Waiting for common functions...');
                setTimeout(checkFunctions, 100);
            }
        };
        checkFunctions();
    });
}

async function loadCheckout() {
    try {
        console.log('Loading checkout...');
        
        const response = await window.apiCall('/carrito');
        console.log('Checkout response:', response);
        
        const container = document.getElementById('checkout-container');
        
        if (response.exito && response.data.items && response.data.items.length > 0) {
            let html = `
                <div class="row">
                    <div class="col-lg-8">
                        <div class="card mb-4">
                            <div class="card-header">
                                <h5 class="mb-0">Resumen del Pedido</h5>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table">
                                        <thead>
                                            <tr>
                                                <th>Producto</th>
                                                <th>Precio</th>
                                                <th>Cantidad</th>
                                                <th>Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
            `;
            
            response.data.items.forEach(item => {
                html += `
                    <tr>
                        <td>
                            <div class="d-flex align-items-center">
                                <img src="${item.producto.imagenes && item.producto.imagenes.length > 0 ? item.producto.imagenes[0] : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZjNzU3ZCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlbiBubyBkaXNwb25pYmxlPC90ZXh0Pjwvc3ZnPg=='}" 
                                     alt="${item.producto.titulo}" 
                                     style="width: 50px; height: 50px; object-fit: cover;"
                                     class="me-3">
                                <div>
                                    <h6 class="mb-0">${item.producto.titulo}</h6>
                                    <small class="text-muted">${item.producto.marca || ''}</small>
                                </div>
                            </div>
                        </td>
                        <td>S/ ${item.precio_unitario}</td>
                        <td>${item.cantidad}</td>
                        <td>S/ ${item.subtotal}</td>
                    </tr>
                `;
            });
            
            html += `
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0">Información de Envío</h5>
                            </div>
                            <div class="card-body">
                                <form id="shipping-form">
                                    <div class="row">
                                        <div class="col-md-6 mb-3">
                                            <label for="nombre" class="form-label">Nombre completo</label>
                                            <input type="text" class="form-control" id="nombre" required>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label for="telefono" class="form-label">Teléfono</label>
                                            <input type="tel" class="form-control" id="telefono" required>
                                        </div>
                                    </div>
                                    <div class="mb-3">
                                        <label for="direccion" class="form-label">Dirección de envío</label>
                                        <textarea class="form-control" id="direccion" rows="3" required></textarea>
                                    </div>
                                    <div class="row">
                                        <div class="col-md-6 mb-3">
                                            <label for="ciudad" class="form-label">Ciudad</label>
                                            <input type="text" class="form-control" id="ciudad" required>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label for="codigo_postal" class="form-label">Código Postal</label>
                                            <input type="text" class="form-control" id="codigo_postal" required>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-lg-4">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0">Resumen de Pago</h5>
                            </div>
                            <div class="card-body">
                                <div class="d-flex justify-content-between mb-2">
                                    <span>Subtotal:</span>
                                    <span>S/ ${response.data.total_precio}</span>
                                </div>
                                <div class="d-flex justify-content-between mb-2">
                                    <span>Envío:</span>
                                    <span>Gratis</span>
                                </div>
                                <hr>
                                <div class="d-flex justify-content-between mb-3">
                                    <strong>Total:</strong>
                                    <strong class="text-primary">S/ ${response.data.total_precio}</strong>
                                </div>
                                
                                <div class="d-grid">
                                    <button class="btn btn-primary btn-lg" onclick="processOrder()">
                                        <i class="fas fa-lock me-2"></i>Procesar Pedido
                                    </button>
                                </div>
                                
                                <div class="text-center mt-3">
                                    <small class="text-muted">
                                        <i class="fas fa-shield-alt me-1"></i>
                                        Pago seguro con encriptación SSL
                                    </small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            container.innerHTML = html;
        } else {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-shopping-cart fa-3x text-muted mb-3"></i>
                    <h4 class="text-muted">Tu carrito está vacío</h4>
                    <p class="text-muted">Agrega productos a tu carrito para continuar con la compra.</p>
                    <a href="/productos" class="btn btn-primary">
                        <i class="fas fa-shopping-cart me-2"></i>Explorar Productos
                    </a>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading checkout:', error);
        
        const container = document.getElementById('checkout-container');
        
        if (error.message && error.message.includes('Token inválido')) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                    <h4 class="text-warning">Sesión expirada</h4>
                    <p class="text-muted">Por favor, inicia sesión nuevamente para continuar.</p>
                    <a href="/login" class="btn btn-primary">
                        <i class="fas fa-sign-in-alt me-2"></i>Iniciar Sesión
                    </a>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                    <h4 class="text-danger">Error al cargar checkout</h4>
                    <p class="text-muted">Por favor, intenta de nuevo más tarde.</p>
                    <button onclick="loadCheckout()" class="btn btn-primary">
                        <i class="fas fa-redo me-2"></i>Reintentar
                    </button>
                </div>
            `;
        }
    }
}

async function processOrder() {
    try {
        const shippingForm = document.getElementById('shipping-form');
        
        // Validate form
        if (!shippingForm.checkValidity()) {
            shippingForm.reportValidity();
            return;
        }
        
        const orderData = {
            direccion_envio: {
                nombre: document.getElementById('nombre').value,
                telefono: document.getElementById('telefono').value,
                direccion: document.getElementById('direccion').value,
                ciudad: document.getElementById('ciudad').value,
                codigo_postal: document.getElementById('codigo_postal').value
            },
            metodo_pago: 'efectivo', // Default payment method
            notas: 'Pedido procesado desde checkout'
        };
        
        console.log('Processing order with data:', orderData);
        
        // Show loading state
        const processButton = document.querySelector('button[onclick="processOrder()"]');
        const originalText = processButton.innerHTML;
        processButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Procesando...';
        processButton.disabled = true;
        
        const response = await window.apiCall('/ordenes/checkout', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
        
        console.log('Order processing response:', response);
        
        if (response.exito) {
            window.showAlert('success', '¡Pedido procesado exitosamente!');
            
            // Redirect to order confirmation
            setTimeout(() => {
                window.location.href = `/orden/${response.data.orden.orden_id}`;
            }, 2000);
        } else {
            window.showAlert('danger', response.mensaje || 'Error al procesar el pedido');
            
            // Reset button
            processButton.innerHTML = originalText;
            processButton.disabled = false;
        }
    } catch (error) {
        console.error('Error processing order:', error);
        window.showAlert('danger', 'Error de conexión al procesar el pedido');
        
        // Reset button
        const processButton = document.querySelector('button[onclick="processOrder()"]');
        processButton.innerHTML = '<i class="fas fa-lock me-2"></i>Procesar Pedido';
        processButton.disabled = false;
    }
}

// Make functions globally available
window.loadCheckout = loadCheckout;
window.processOrder = processOrder; 