// Global variables
let currentProduct = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Product detail page loaded');
    loadProductDetail();
});

// Load product detail from API
async function loadProductDetail() {
    const productId = getProductIdFromURL();
    if (!productId) {
        showError('ID de producto no válido');
        return;
    }

    try {
        console.log('Loading product detail for:', productId);

        const response = await fetch(`/api/productos/${productId}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Producto no encontrado');
            }
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Product detail data received:', data);

        if (data.exito && data.data.producto) {
            currentProduct = data.data.producto;
            displayProductDetail(currentProduct);
        } else {
            throw new Error(data.mensaje || 'Error al cargar el producto');
        }

    } catch (error) {
        console.error('Error loading product detail:', error);
        showError(error.message);
    }
}

// Display product detail
function displayProductDetail(product) {
    const productContainer = document.getElementById('product-container');
    if (!productContainer) {
        console.error('Product container not found');
        return;
    }

    const images = product.imagenes && product.imagenes.length > 0 
        ? product.imagenes 
        : ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZjNzU3ZCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlbiBubyBkaXNwb25pYmxlPC90ZXh0Pjwvc3ZnPg=='];

    const mainImage = images[0];
    const estadoBadgeClass = getEstadoBadgeClass(product.estado);
    const isLoggedIn = window.user ? true : false;

    const html = `
        <div class="row">
            <!-- Product Images -->
            <div class="col-md-6">
                <div class="product-images">
                    <!-- Main Image -->
                    <div class="main-image-container mb-3 position-relative">
                        <img id="main-product-image" 
                             src="${mainImage}" 
                             class="img-fluid rounded shadow-sm" 
                             alt="${product.titulo}"
                             style="width: 100%; height: 400px; object-fit: cover;"
                             onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZjNzU3ZCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlbiBubyBkaXNwb25pYmxlPC90ZXh0Pjwvc3ZnPg=='">
                        <span class="badge ${estadoBadgeClass} position-absolute top-0 end-0 m-3">
                            ${formatEstado(product.estado)}
                        </span>
                    </div>

                    <!-- Thumbnail Images -->
                    ${images.length > 1 ? `
                        <div class="thumbnail-images">
                            <div class="row g-2">
                                ${images.slice(0, 4).map((img, index) => `
                                    <div class="col-3">
                                        <img src="${img}" 
                                             class="img-fluid rounded product-thumbnail ${index === 0 ? 'active' : ''}" 
                                             style="height: 80px; object-fit: cover; cursor: pointer; border: 2px solid ${index === 0 ? '#0d6efd' : 'transparent'};"
                                             data-image="${img}"
                                             onclick="changeMainImage('${img}', this)"
                                             onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZjNzU3ZCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlbiBubyBkaXNwb25pYmxlPC90ZXh0Pjwvc3ZnPg=='">
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>

            <!-- Product Info -->
            <div class="col-md-6">
                <div class="product-info">
                    <!-- Breadcrumb -->
                    <nav aria-label="breadcrumb" class="mb-3">
                        <ol class="breadcrumb">
                            <li class="breadcrumb-item"><a href="/">Inicio</a></li>
                            <li class="breadcrumb-item"><a href="/productos">Productos</a></li>
                            <li class="breadcrumb-item active">${product.titulo}</li>
                        </ol>
                    </nav>

                    <!-- Title and Price -->
                    <div class="mb-4">
                        <h1 class="h2 mb-3">${product.titulo}</h1>
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <span class="h3 text-primary mb-0">S/ ${product.precio.toLocaleString()}</span>
                            ${isLoggedIn ? `
                                <button id="favorite-btn" 
                                        class="btn btn-outline-danger"
                                        data-product-id="${product.producto_id}"
                                        onclick="toggleFavorite()">
                                    <i class="far fa-heart"></i>
                                    <span class="ms-1">Favorito</span>
                                </button>
                            ` : ''}
                        </div>
                        
                        <!-- Product Meta -->
                        <div class="row g-2 mb-3">
                            <div class="col-auto">
                                <span class="badge bg-light text-dark">
                                    <i class="fas fa-tag"></i> ${product.categoria?.nombre || 'Sin categoría'}
                                </span>
                            </div>
                            <div class="col-auto">
                                <span class="badge bg-light text-dark">
                                    <i class="fas fa-calendar"></i> ${formatDate(product.fecha_publicacion)}
                                </span>
                            </div>
                            <div class="col-auto">
                                <span class="badge bg-light text-dark">
                                    <i class="fas fa-boxes"></i> ${product.stock || 0} disponibles
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Product Details -->
                    <div class="product-details mb-4">
                        <h5 class="mb-3">Descripción</h5>
                        <p class="text-muted mb-4">${product.descripcion || 'Sin descripción disponible'}</p>
                        
                        <h6 class="mb-3">Especificaciones</h6>
                        <div class="row g-3">
                            ${product.marca ? `
                                <div class="col-6">
                                    <strong>Marca:</strong><br>
                                    <span class="text-muted">${product.marca}</span>
                                </div>
                            ` : ''}
                            ${product.modelo ? `
                                <div class="col-6">
                                    <strong>Modelo:</strong><br>
                                    <span class="text-muted">${product.modelo}</span>
                                </div>
                            ` : ''}
                            ${product.año_fabricacion ? `
                                <div class="col-6">
                                    <strong>Año:</strong><br>
                                    <span class="text-muted">${product.año_fabricacion}</span>
                                </div>
                            ` : ''}
                            <div class="col-6">
                                <strong>Estado:</strong><br>
                                <span class="badge ${estadoBadgeClass}">${formatEstado(product.estado)}</span>
                            </div>
                            <div class="col-6">
                                <strong>Código:</strong><br>
                                <span class="text-muted">${product.producto_id}</span>
                            </div>
                            ${product.ubicacion_almacen ? `
                                <div class="col-6">
                                    <strong>Ubicación:</strong><br>
                                    <span class="text-muted">${product.ubicacion_almacen}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <!-- Stock Alert -->
                    ${product.stock <= 5 && product.stock > 0 ? `
                        <div class="alert alert-warning mb-4">
                            <i class="fas fa-exclamation-triangle"></i>
                            ¡Solo quedan ${product.stock} unidades disponibles!
                        </div>
                    ` : ''}

                    <!-- Add to Cart Section -->
                    ${isLoggedIn && product.stock > 0 ? `
                        <div class="add-to-cart-section mb-4">
                            <div class="card border-primary">
                                <div class="card-body">
                                    <div class="row g-3 align-items-center">
                                        <div class="col-md-4">
                                            <label for="quantity-input" class="form-label fw-bold">Cantidad:</label>
                                            <div class="input-group">
                                                <button class="btn btn-outline-secondary" type="button" onclick="changeQuantity(-1)">
                                                    <i class="fas fa-minus"></i>
                                                </button>
                                                <input type="number" 
                                                       id="quantity-input" 
                                                       class="form-control text-center" 
                                                       value="1" 
                                                       min="1" 
                                                       max="${product.stock}"
                                                       onchange="validateQuantity()">
                                                <button class="btn btn-outline-secondary" type="button" onclick="changeQuantity(1)">
                                                    <i class="fas fa-plus"></i>
                                                </button>
                                            </div>
                                        </div>
                                        <div class="col-md-8">
                                            <button id="add-to-cart-btn" 
                                                    class="btn btn-primary btn-lg w-100"
                                                    onclick="addToCart()">
                                                <i class="fas fa-shopping-cart"></i>
                                                Agregar al Carrito
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ` : !isLoggedIn ? `
                        <div class="alert alert-info mb-4">
                            <i class="fas fa-info-circle"></i>
                            <a href="/login" class="alert-link fw-bold">Inicia sesión</a> para agregar productos al carrito
                        </div>
                    ` : `
                        <div class="alert alert-warning mb-4">
                            <i class="fas fa-exclamation-triangle"></i>
                            <strong>Producto agotado</strong> - No hay stock disponible
                        </div>
                    `}

                    <!-- Additional Actions -->
                    <div class="additional-actions">
                        <div class="row g-2">
                            <div class="col-6">
                                <button class="btn btn-outline-primary w-100" onclick="shareProduct()">
                                    <i class="fas fa-share"></i> Compartir
                                </button>
                            </div>
                            <div class="col-6">
                                <button class="btn btn-outline-secondary w-100" onclick="reportProduct()">
                                    <i class="fas fa-flag"></i> Reportar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Product Tabs -->
        <div class="row mt-5">
            <div class="col-12">
                <ul class="nav nav-tabs" id="productTabs" role="tablist">
                    <li class="nav-item" role="presentation">
                        <button class="nav-link active" id="description-tab" data-bs-toggle="tab" data-bs-target="#description" type="button" role="tab">
                            <i class="fas fa-info-circle"></i> Descripción
                        </button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="specifications-tab" data-bs-toggle="tab" data-bs-target="#specifications" type="button" role="tab">
                            <i class="fas fa-list"></i> Especificaciones
                        </button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="reviews-tab" data-bs-toggle="tab" data-bs-target="#reviews" type="button" role="tab">
                            <i class="fas fa-star"></i> Reseñas
                        </button>
                    </li>
                </ul>
                <div class="tab-content border border-top-0" id="productTabsContent">
                    <div class="tab-pane fade show active p-4" id="description" role="tabpanel">
                        <h5>Descripción completa</h5>
                        <p>${product.descripcion || 'Sin descripción disponible'}</p>
                        
                        ${product.marca || product.modelo ? `
                            <h6 class="mt-4">Información del producto</h6>
                            <ul>
                                ${product.marca ? `<li><strong>Marca:</strong> ${product.marca}</li>` : ''}
                                ${product.modelo ? `<li><strong>Modelo:</strong> ${product.modelo}</li>` : ''}
                                ${product.año_fabricacion ? `<li><strong>Año de fabricación:</strong> ${product.año_fabricacion}</li>` : ''}
                            </ul>
                        ` : ''}
                    </div>
                    <div class="tab-pane fade p-4" id="specifications" role="tabpanel">
                        <h5>Especificaciones técnicas</h5>
                        <table class="table table-striped">
                            <tbody>
                                ${product.marca ? `<tr><td><strong>Marca</strong></td><td>${product.marca}</td></tr>` : ''}
                                ${product.modelo ? `<tr><td><strong>Modelo</strong></td><td>${product.modelo}</td></tr>` : ''}
                                ${product.año_fabricacion ? `<tr><td><strong>Año de fabricación</strong></td><td>${product.año_fabricacion}</td></tr>` : ''}
                                <tr><td><strong>Estado</strong></td><td>${formatEstado(product.estado)}</td></tr>
                                <tr><td><strong>Stock disponible</strong></td><td>${product.stock || 0}</td></tr>
                                <tr><td><strong>Fecha de publicación</strong></td><td>${formatDate(product.fecha_publicacion)}</td></tr>
                                <tr><td><strong>Código del producto</strong></td><td>${product.producto_id}</td></tr>
                                ${product.ubicacion_almacen ? `<tr><td><strong>Ubicación en almacén</strong></td><td>${product.ubicacion_almacen}</td></tr>` : ''}
                            </tbody>
                        </table>
                    </div>
                    <div class="tab-pane fade p-4" id="reviews" role="tabpanel">
                        <div id="reviews-container">
                            <div class="text-center py-4">
                                <div class="spinner-border" role="status">
                                    <span class="visually-hidden">Cargando reseñas...</span>
                                </div>
                                <p class="mt-2">Cargando reseñas...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    productContainer.innerHTML = html;

    // Update page title
    document.title = `${product.titulo} - ElBaul`;

    // Load reviews
    loadProductReviews(product.producto_id);
}

// Image gallery functions
function changeMainImage(imageSrc, thumbnailElement) {
    const mainImage = document.getElementById('main-product-image');
    if (mainImage) {
        mainImage.src = imageSrc;
    }
    
    // Update thumbnail borders
    document.querySelectorAll('.product-thumbnail').forEach(thumb => {
        thumb.style.border = '2px solid transparent';
    });
    thumbnailElement.style.border = '2px solid #0d6efd';
}

// Quantity functions
function changeQuantity(delta) {
    const quantityInput = document.getElementById('quantity-input');
    if (!quantityInput) return;

    let currentValue = parseInt(quantityInput.value) || 1;
    let newValue = currentValue + delta;
    
    const min = parseInt(quantityInput.min) || 1;
    const max = parseInt(quantityInput.max) || 999;
    
    newValue = Math.max(min, Math.min(max, newValue));
    quantityInput.value = newValue;
}

function validateQuantity() {
    const quantityInput = document.getElementById('quantity-input');
    if (!quantityInput) return;

    let value = parseInt(quantityInput.value) || 1;
    const min = parseInt(quantityInput.min) || 1;
    const max = parseInt(quantityInput.max) || 999;
    
    value = Math.max(min, Math.min(max, value));
    quantityInput.value = value;
}

// Cart functions
async function addToCart() {
    if (!currentProduct) return;

    const quantityInput = document.getElementById('quantity-input');
    const quantity = quantityInput ? parseInt(quantityInput.value) || 1 : 1;
    const addToCartBtn = document.getElementById('add-to-cart-btn');

    // Check if user is logged in
    if (!window.currentUser) {
        showNotification('Debes iniciar sesión para agregar al carrito', 'warning');
        return;
    }

    try {
        if (addToCartBtn) {
            addToCartBtn.disabled = true;
            addToCartBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Agregando...';
        }

        // Call the real API
        const response = await window.apiCall('/carrito/items', {
            method: 'POST',
            body: JSON.stringify({ 
                producto_id: currentProduct.producto_id,
                cantidad: quantity
            })
        });
        
        if (response.exito) {
            showNotification(`${currentProduct.titulo} agregado al carrito (${quantity} unidad${quantity > 1 ? 's' : ''})`, 'success');
            
            // Update cart count if function exists
            if (typeof window.updateCartCount === 'function') {
                window.updateCartCount();
            }
        } else {
            showNotification(response.mensaje || 'Error al agregar al carrito', 'error');
        }

    } catch (error) {
        console.error('Error adding to cart:', error);
        showNotification('Error al agregar al carrito', 'error');
    } finally {
        if (addToCartBtn) {
            addToCartBtn.disabled = false;
            addToCartBtn.innerHTML = '<i class="fas fa-shopping-cart"></i> Agregar al Carrito';
        }
    }
}

// Favorite functions
async function toggleFavorite() {
    const favoriteBtn = document.getElementById('favorite-btn');
    if (!favoriteBtn) return;

    // Check if user is logged in
    if (!window.currentUser) {
        showNotification('Debes iniciar sesión para agregar favoritos', 'warning');
        return;
    }

    const icon = favoriteBtn.querySelector('i');
    const isFavorited = icon.classList.contains('fas');

    try {
        if (isFavorited) {
            // Remove from favorites
            const response = await window.apiCall(`/favoritos/producto/${currentProduct.producto_id}`, {
                method: 'DELETE'
            });
            
            if (response.exito) {
                icon.classList.replace('fas', 'far');
                favoriteBtn.classList.replace('btn-danger', 'btn-outline-danger');
                showNotification('Producto removido de favoritos', 'info');
            } else {
                showNotification(response.mensaje || 'Error al remover de favoritos', 'error');
            }
        } else {
            // Add to favorites
            const response = await window.apiCall('/favoritos', {
                method: 'POST',
                body: JSON.stringify({ producto_id: currentProduct.producto_id })
            });
            
            if (response.exito) {
                icon.classList.replace('far', 'fas');
                favoriteBtn.classList.replace('btn-outline-danger', 'btn-danger');
                showNotification('Producto agregado a favoritos', 'success');
            } else {
                showNotification(response.mensaje || 'Error al agregar a favoritos', 'error');
            }
        }
    } catch (error) {
        console.error('Error toggling favorite:', error);
        showNotification('Error al actualizar favoritos', 'error');
    }
}

// Reviews functions
async function loadProductReviews(productId) {
    const reviewsContainer = document.getElementById('reviews-container');
    if (!reviewsContainer) return;

    try {
        // Simulate loading delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mock reviews data
        const mockReviews = [
            {
                usuario: { nombre: 'Juan Pérez' },
                puntuacion: 5,
                comentario: 'Excelente producto, tal como se describe. Muy recomendado.',
                fecha_creacion: new Date().toISOString()
            },
            {
                usuario: { nombre: 'María García' },
                puntuacion: 4,
                comentario: 'Buen producto, entrega rápida. Solo le falta un poco más de documentación.',
                fecha_creacion: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];

        displayReviews(mockReviews);

    } catch (error) {
        console.error('Error loading reviews:', error);
        reviewsContainer.innerHTML = `
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle"></i>
                Error al cargar las reseñas
            </div>
        `;
    }
}

function displayReviews(reviews) {
    const reviewsContainer = document.getElementById('reviews-container');
    if (!reviewsContainer) return;

    if (!reviews || reviews.length === 0) {
        reviewsContainer.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-comments fa-3x text-muted mb-3"></i>
                <h5>Sin reseñas aún</h5>
                <p class="text-muted">Sé el primero en reseñar este producto</p>
            </div>
        `;
        return;
    }

    let html = '<h5 class="mb-4">Reseñas de clientes</h5>';
    
    reviews.forEach(review => {
        html += `
            <div class="review-item border-bottom py-3">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div>
                        <strong>${review.usuario?.nombre || 'Usuario'}</strong>
                        <div class="stars small mt-1">
                            ${generateStarsHTML(review.puntuacion)}
                        </div>
                    </div>
                    <small class="text-muted">${formatDate(review.fecha_creacion)}</small>
                </div>
                <p class="mb-0">${review.comentario}</p>
            </div>
        `;
    });

    reviewsContainer.innerHTML = html;
}

// Utility Functions
function getProductIdFromURL() {
    const path = window.location.pathname;
    const matches = path.match(/\/productos\/([^\/]+)/);
    return matches ? matches[1] : null;
}

function showError(message) {
    const productContainer = document.getElementById('product-container');
    if (productContainer) {
        productContainer.innerHTML = `
            <div class="text-center py-5">
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
                    <h4>Error</h4>
                    <p>${message}</p>
                    <a href="/productos" class="btn btn-primary">
                        <i class="fas fa-arrow-left"></i> Volver a Productos
                    </a>
                </div>
            </div>
        `;
    }
}

function getEstadoBadgeClass(estado) {
    const badgeClasses = {
        'nuevo': 'bg-success',
        'como_nuevo': 'bg-info',
        'excelente': 'bg-primary',
        'bueno': 'bg-warning text-dark',
        'regular': 'bg-secondary'
    };
    return badgeClasses[estado] || 'bg-secondary';
}

function formatEstado(estado) {
    const estados = {
        'nuevo': 'Nuevo',
        'como_nuevo': 'Como Nuevo',
        'excelente': 'Excelente',
        'bueno': 'Bueno',
        'regular': 'Regular'
    };
    return estados[estado] || estado;
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function generateStarsHTML(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            html += '<i class="fas fa-star text-warning"></i>';
        } else {
            html += '<i class="far fa-star text-muted"></i>';
        }
    }
    return html;
}

function shareProduct() {
    if (navigator.share && currentProduct) {
        navigator.share({
            title: currentProduct.titulo,
            text: currentProduct.descripcion,
            url: window.location.href
        }).catch(console.error);
    } else {
        // Fallback - copy to clipboard
        navigator.clipboard.writeText(window.location.href).then(() => {
            showNotification('Enlace copiado al portapapeles', 'success');
        }).catch(() => {
            showNotification('No se pudo copiar el enlace', 'error');
        });
    }
}

function reportProduct() {
    showNotification('Función de reporte próximamente', 'info');
}

function showNotification(message, type = 'info') {
    const alertClass = type === 'error' ? 'alert-danger' : 
                      type === 'success' ? 'alert-success' : 'alert-info';
    
    const notification = document.createElement('div');
    notification.className = `alert ${alertClass} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 1050; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}