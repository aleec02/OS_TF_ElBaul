// Orders Page JS

document.addEventListener('DOMContentLoaded', function() {
    console.log('Orders page loaded');
    
    // Wait for common functions
    waitForCommonFunctions().then(() => {
        loadOrders();
    });
});

function waitForCommonFunctions() {
    return new Promise((resolve) => {
        const checkFunctions = () => {
            if (window.apiCall && window.showAlert) {
                resolve();
            } else {
                setTimeout(checkFunctions, 100);
            }
        };
        checkFunctions();
    });
}

async function loadOrders() {
    try {
        const response = await window.apiCall('/ordenes?limit=20');
        console.log('Orders response:', response);
        
        const container = document.getElementById('orders-container');
        
        if (response.exito && response.data.ordenes && response.data.ordenes.length > 0) {
            let html = '';
            response.data.ordenes.forEach(order => {
                html += `
                    <div class="card mb-3 border-0 shadow-sm">
                        <div class="card-body">
                            <div class="row align-items-center">
                                <div class="col-md-3">
                                    <h6 class="mb-1">Orden #${order.orden_id}</h6>
                                    <small class="text-muted">${new Date(order.fecha_creacion).toLocaleDateString('es-PE')}</small>
                                </div>
                                <div class="col-md-3">
                                    <span class="badge bg-${getStatusColor(order.estado)} fs-6">${order.estado}</span>
                                </div>
                                <div class="col-md-3">
                                    <strong>S/ ${order.total}</strong>
                                </div>
                                <div class="col-md-3 text-end">
                                    <a href="/orden/${order.orden_id}" class="btn btn-outline-primary btn-sm">
                                        <i class="fas fa-eye me-1"></i>Ver Detalle
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html;
        } else {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-shopping-bag fa-3x text-muted mb-3"></i>
                    <h4 class="text-muted">No tienes órdenes aún</h4>
                    <p class="text-muted">¡Comienza a comprar productos increíbles!</p>
                    <a href="/productos" class="btn btn-primary">
                        <i class="fas fa-shopping-cart me-2"></i>Explorar Productos
                    </a>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        
        const container = document.getElementById('orders-container');
        
        if (error.message && error.message.includes('Token inválido')) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                    <h4 class="text-warning">Sesión expirada</h4>
                    <p class="text-muted">Por favor, inicia sesión nuevamente para ver tus órdenes.</p>
                    <a href="/login" class="btn btn-primary">
                        <i class="fas fa-sign-in-alt me-2"></i>Iniciar Sesión
                    </a>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                    <h4 class="text-danger">Error al cargar órdenes</h4>
                    <p class="text-muted">Por favor, intenta de nuevo más tarde.</p>
                    <button onclick="loadOrders()" class="btn btn-primary">
                        <i class="fas fa-redo me-2"></i>Reintentar
                    </button>
                </div>
            `;
        }
    }
}

function getStatusColor(status) {
    switch (status) {
        case 'completada': return 'success';
        case 'en_proceso': return 'warning';
        case 'cancelada': return 'danger';
        case 'pendiente': return 'info';
        default: return 'secondary';
    }
} 