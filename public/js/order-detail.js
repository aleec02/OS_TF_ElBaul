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
        console.log('Order detail response:', response);
        
        if (response.exito && response.data.orden) {
            renderOrderDetail(response.data.orden, response.data.items);
        } else {
            container.innerHTML = `<div class="alert alert-danger">${response.mensaje || 'No se pudo cargar la orden.'}</div>`;
        }
    } catch (error) {
        console.error('Error loading order detail:', error);
        container.innerHTML = `<div class="alert alert-danger">Error al cargar la orden: ${error.message}</div>`;
    }
}

function renderOrderDetail(orden, items = []) {
    const container = document.getElementById('order-detail-container');
    
    // Format date properly
    let formattedDate = 'Fecha no disponible';
    if (orden.fecha_orden) {
        try {
            const date = new Date(orden.fecha_orden);
            if (!isNaN(date.getTime())) {
                formattedDate = date.toLocaleDateString('es-PE', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }
        } catch (error) {
            console.error('Error formatting date:', error);
        }
    }
    
    let html = `<div class="card shadow-sm mb-4">
        <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0"><i class="fas fa-receipt me-2"></i>Orden #${orden.orden_id || orden._id}</h5>
            <span class="badge bg-${orden.estado === 'pendiente' ? 'warning' : 'success'}">${orden.estado}</span>
        </div>
        <div class="card-body">
            <p><strong>Fecha:</strong> ${formattedDate}</p>
            <p><strong>Método de pago:</strong> ${orden.metodo_pago || 'N/A'}</p>
            <p><strong>Dirección de envío:</strong> ${orden.direccion_envio || 'N/A'}</p>
            <hr>
            <h6>Productos:</h6>`;
    
    if (items && items.length > 0) {
        html += `<ul class="list-group mb-3">`;
        items.forEach(item => {
            const productName = item.producto?.titulo || 'Producto sin nombre';
            const quantity = item.cantidad || 1;
            const price = item.precio_unitario || 0;
            const subtotal = item.subtotal || (quantity * price);
            
            html += `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${productName}</strong>
                        <br>
                        <small class="text-muted">Cantidad: ${quantity}</small>
                    </div>
                    <div class="text-end">
                        <div>S/ ${price.toFixed(2)} c/u</div>
                        <div class="text-primary"><strong>S/ ${subtotal.toFixed(2)}</strong></div>
                    </div>
                </li>
            `;
        });
        html += `</ul>`;
    } else {
        html += `<div class="alert alert-info">No se encontraron productos para esta orden.</div>`;
    }
    
    html += `
            <div class="d-flex justify-content-between">
                <strong>Total:</strong>
                <span class="h5 text-primary">S/ ${(orden.total || 0).toFixed(2)}</span>
            </div>
        </div>
    </div>`;
    
    container.innerHTML = html;
} 