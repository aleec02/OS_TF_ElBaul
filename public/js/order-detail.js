// Order Detail Page JS

document.addEventListener('DOMContentLoaded', function() {
    console.log('Order detail page loaded');
    
    // Wait for common functions
    waitForCommonFunctions().then(() => {
        loadOrderDetail();
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

async function loadOrderDetail() {
    const container = document.getElementById('order-detail-container');
    const orderId = window.orderId || (window.location.pathname.split('/').pop());
    if (!orderId) {
        container.innerHTML = '<div class="alert alert-danger">ID de orden no especificado.</div>';
        return;
    }
    container.innerHTML = '<div class="text-center py-4"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando orden...</span></div></div>';
    try {
        const response = await window.apiCall(`/ordenes/${orderId}`);
        if (response.exito && response.data.orden) {
            renderOrderDetail(response.data.orden);
        } else {
            container.innerHTML = `<div class="alert alert-danger">${response.mensaje || 'No se pudo cargar la orden.'}</div>`;
        }
    } catch (error) {
        container.innerHTML = `<div class="alert alert-danger">Error al cargar la orden: ${error.message}</div>`;
    }
}

function renderOrderDetail(orden) {
    const container = document.getElementById('order-detail-container');
    let html = `<div class="card shadow-sm mb-4">
        <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0"><i class="fas fa-receipt me-2"></i>Orden #${orden.orden_id || orden._id}</h5>
            <span class="badge bg-${orden.estado === 'pendiente' ? 'warning' : 'success'}">${orden.estado}</span>
        </div>
        <div class="card-body">
            <p><strong>Fecha:</strong> ${window.formatDate ? window.formatDate(orden.fecha_creacion || orden.createdAt) : (orden.fecha_creacion || orden.createdAt)}</p>
            <p><strong>Método de pago:</strong> ${orden.metodo_pago || 'N/A'}</p>
            <p><strong>Dirección de envío:</strong> ${orden.direccion_envio || 'N/A'}</p>
            <hr>
            <h6>Productos:</h6>
            <ul class="list-group mb-3">
                ${(orden.items || orden.productos || []).map(item => `
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        <span>${item.producto?.titulo || item.titulo || 'Producto'}</span>
                        <span>${item.cantidad || 1} x S/ ${item.precio_unitario || item.precio || 0}</span>
                    </li>
                `).join('')}
            </ul>
            <div class="d-flex justify-content-between">
                <strong>Total:</strong>
                <span class="h5 text-primary">S/ ${orden.total || orden.total_precio || 0}</span>
            </div>
        </div>
    </div>`;
    container.innerHTML = html;
} 