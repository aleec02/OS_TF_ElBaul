document.addEventListener('DOMContentLoaded', function() {
    console.log('Cart page loaded');
    // Wait for common functions to be ready
    function waitForCommonFunctions() {
        return new Promise((resolve) => {
            const checkFunctions = () => {
                if (window.apiCall && window.showAlert) {
                    console.log('Common functions ready, loading cart');
                    resolve();
                } else {
                    console.log('Waiting for common functions...');
                    setTimeout(checkFunctions, 100);
                }
            };
            checkFunctions();
        });
    }
    waitForCommonFunctions().then(() => {
        loadCart();
    });
});

async function loadCart() {
    try {
        console.log('🛒 Loading cart from external cart.js...');
        const response = await window.apiCall('/carrito');
        console.log('🛒 Cart response:', response);
        console.log('🛒 Cart data:', response.data);
        console.log('🛒 Cart items:', response.data?.items);
        console.log('🛒 Cart items length:', response.data?.items?.length);
        const container = document.getElementById('cart-container');
        if (response.exito && response.data.items && response.data.items.length > 0) {
            const items = response.data.items;
            const totalItems = response.data.total_items;
            const totalPrice = response.data.total_precio;
            let html = `
                <div class="row">
                    <div class="col-lg-8">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0">Productos en tu carrito (${totalItems} ${totalItems === 1 ? 'artículo' : 'artículos'})</h5>
                            </div>
                            <div class="card-body p-0">
            `;
            items.forEach((item, index) => {
                const product = item.producto;
                let imageUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZjNzU3ZCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlbiBubyBkaXNwb25pYmxlPC90ZXh0Pjwvc3ZnPg==';
                if (product.imagenes && product.imagenes.length > 0) {
                    imageUrl = product.imagenes[0];
                } else if (product.imagen_url) {
                    imageUrl = product.imagen_url;
                }
                html += `
                    <div class="border-bottom p-3 ${index === items.length - 1 ? 'border-bottom-0' : ''}">
                        <div class="row align-items-center">
                            <div class="col-md-2">
                                <img src="${imageUrl}" 
                                     class="img-fluid rounded" 
                                     alt="${product.titulo}"
                                     style="height: 80px; width: 80px; object-fit: cover;"
                                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZjNzU3ZCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlbiBubyBkaXNwb25pYmxlPC90ZXh0Pjwvc3ZnPg=='">
                            </div>
                            <div class="col-md-4">
                                <h6 class="mb-1">${product.titulo}</h6>
                                <small class="text-muted">${product.marca || ''}</small>
                                <br>
                                <span class="badge bg-secondary">${product.estado}</span>
                            </div>
                            <div class="col-md-2">
                                <div class="input-group input-group-sm">
                                    <button class="btn btn-outline-secondary" type="button" onclick="updateQuantity('${item.item_carrito_id}', ${item.cantidad - 1})">-</button>
                                    <input type="text" class="form-control text-center" value="${item.cantidad}" readonly>
                                    <button class="btn btn-outline-secondary" type="button" onclick="updateQuantity('${item.item_carrito_id}', ${item.cantidad + 1})">+</button>
                                </div>
                            </div>
                            <div class="col-md-2 text-center">
                                <strong>S/ ${item.precio_unitario}</strong>
                            </div>
                            <div class="col-md-2 text-center">
                                <strong class="text-success">S/ ${item.subtotal}</strong>
                                <br>
                                <button class="btn btn-sm btn-outline-danger mt-1" onclick="removeItem('${item.item_carrito_id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            });
            html += `
                            </div>
                            <div class="card-footer">
                                <button class="btn btn-outline-warning" onclick="clearCart()">
                                    <i class="fas fa-trash me-1"></i>Vaciar Carrito
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-4">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0">Resumen del Pedido</h5>
                            </div>
                            <div class="card-body">
                                <div class="d-flex justify-content-between mb-2">
                                    <span>Subtotal:</span>
                                    <strong>S/ ${totalPrice}</strong>
                                </div>
                                <div class="d-flex justify-content-between mb-2">
                                    <span>Envío:</span>
                                    <span class="text-success">Gratis</span>
                                </div>
                                <hr>
                                <div class="d-flex justify-content-between mb-3">
                                    <strong>Total:</strong>
                                    <strong class="text-success">S/ ${totalPrice}</strong>
                                </div>
                                <div class="d-grid">
                                    <a href="/checkout" class="btn btn-success btn-lg">
                                        <i class="fas fa-credit-card me-2"></i>Proceder al Pago
                                    </a>
                                </div>
                            </div>
                        </div>
                        <div class="text-center mt-3">
                            <small class="text-muted">
                                <i class="fas fa-shield-alt me-1"></i>Compra segura y protegida
                            </small>
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
                    <p class="text-muted">¡Agrega productos para comenzar tu compra!</p>
                    <a href="/productos" class="btn btn-primary">
                        <i class="fas fa-shopping-bag me-2"></i>Explorar Productos
                    </a>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading cart:', error);
        const container = document.getElementById('cart-container');
        if (error.message && error.message.includes('Token inválido')) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                    <h4 class="text-warning">Sesión expirada</h4>
                    <p class="text-muted">Por favor, inicia sesión nuevamente para ver tu carrito.</p>
                    <a href="/login" class="btn btn-primary">
                        <i class="fas fa-sign-in-alt me-2"></i>Iniciar Sesión
                    </a>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                    <h4 class="text-danger">Error al cargar carrito</h4>
                    <p class="text-muted">Por favor, intenta de nuevo más tarde.</p>
                    <button onclick="loadCart()" class="btn btn-primary">
                        <i class="fas fa-redo me-2"></i>Reintentar
                    </button>
                </div>
            `;
        }
    }
}

async function updateQuantity(itemId, newQuantity) {
    if (newQuantity < 1) {
        removeItem(itemId);
        return;
    }
    try {
        console.log('Updating quantity:', itemId, newQuantity);
        const response = await window.apiCall(`/carrito/items/${itemId}`, {
            method: 'PUT',
            body: JSON.stringify({ cantidad: newQuantity })
        });
        if (response.exito) {
            loadCart();
        } else {
            window.showAlert('danger', response.mensaje || 'Error al actualizar cantidad');
        }
    } catch (error) {
        console.error('Error updating quantity:', error);
        window.showAlert('danger', 'Error al actualizar cantidad');
    }
}

async function removeItem(itemId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto del carrito?')) {
        return;
    }
    try {
        console.log('Removing item:', itemId);
        const response = await window.apiCall(`/carrito/items/${itemId}`, {
            method: 'DELETE'
        });
        if (response.exito) {
            window.showAlert('success', 'Producto eliminado del carrito');
            loadCart();
            if (window.updateCartCount) {
                window.updateCartCount();
            }
        } else {
            window.showAlert('danger', response.mensaje || 'Error al eliminar producto');
        }
    } catch (error) {
        console.error('Error removing item:', error);
        window.showAlert('danger', 'Error al eliminar producto del carrito');
    }
}

async function clearCart() {
    if (!confirm('¿Estás seguro de que quieres vaciar todo el carrito? Esta acción no se puede deshacer.')) {
        return;
    }
    try {
        console.log('Clearing cart...');
        const response = await window.apiCall('/carrito', {
            method: 'DELETE'
        });
        if (response.exito) {
            window.showAlert('success', 'Carrito vaciado exitosamente');
            loadCart();
            if (window.updateCartCount) {
                window.updateCartCount();
            }
        } else {
            window.showAlert('danger', response.mensaje || 'Error al vaciar carrito');
        }
    } catch (error) {
        console.error('Error clearing cart:', error);
        window.showAlert('danger', 'Error al vaciar carrito');
    }
} 