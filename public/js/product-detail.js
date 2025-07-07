// Global variables
let currentProduct = null;
let productReviews = [];
let currentUser = window.user || null;

// DOM Elements
let productContainer;
let reviewsContainer;
let reviewForm;
let addToCartBtn;
let favoriteBtn;
let quantityInput;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Product detail page loaded');
    initializeElements();
    initializeEventListeners();
    loadProductDetail();
});

function initializeElements() {
    productContainer = document.getElementById('product-container');
    reviewsContainer = document.getElementById('reviews-container');
    reviewForm = document.getElementById('review-form');
    addToCartBtn = document.getElementById('add-to-cart-btn');
    favoriteBtn = document.getElementById('favorite-btn');
    quantityInput = document.getElementById('quantity-input');

    console.log('Product detail elements initialized');
}

function initializeEventListeners() {
    // Add to cart button
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', handleAddToCart);
    }

    // Favorite button
    if (favoriteBtn) {
        favoriteBtn.addEventListener('click', handleToggleFavorite);
    }

    // Review form
    if (reviewForm) {
        reviewForm.addEventListener('submit', handleReviewSubmit);
    }

    // Image gallery
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('product-thumbnail')) {
            handleImageSelect(event);
        }
    });

    // Quantity controls
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('quantity-btn')) {
            handleQuantityChange(event);
        }
    });
}

// Load product detail from API
async function loadProductDetail() {
    const productId = getProductIdFromURL();
    if (!productId) {
        showError('ID de producto no válido');
        return;
    }

    try {
        showLoading();
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
            loadProductReviews(productId);
            
            // Check if user has favorited this product
            if (currentUser) {
                checkIfFavorited(productId);
                checkUserReview(productId);
            }
        } else {
            throw new Error(data.mensaje || 'Error al cargar el producto');
        }

    } catch (error) {
        console.error('Error loading product detail:', error);
        showError(error.message);
    } finally {
        hideLoading();
    }
}

// Display product detail
function displayProductDetail(product) {
    if (!productContainer) {
        console.error('Product container not found');
        return;
    }

    const images = product.imagenes && product.imagenes.length > 0 
        ? product.imagenes 
        : ['/img/placeholder.jpg'];

    const mainImage = images[0];
    const estadoBadgeClass = getEstadoBadgeClass(product.estado);
    const isLoggedIn = currentUser ? true : false;
    const maxStock = product.stock || 1;

    const html = `
        <div class="row">
            <!-- Product Images -->
            <div class="col-md-6">
                <div class="product-images">
                    <!-- Main Image -->
                    <div class="main-image-container mb-3">
                        <img id="main-product-image" 
                             src="${mainImage}" 
                             class="img-fluid rounded shadow-sm" 
                             alt="${product.titulo}"
                             style="width: 100%; height: 400px; object-fit: cover;"
                             onerror="this.src='/img/placeholder.jpg'">
                        <span class="badge ${estadoBadgeClass} position-absolute top-0 end-0 m-3">
                            ${formatEstado(product.estado)}
                        </span>
                    </div>

                    <!-- Thumbnail Images -->
                    ${images.length > 1 ? `
                        <div class="thumbnail-images">
                            <div class="row g-2">
                                ${images.map((img, index) => `
                                    <div class="col-3">
                                        <img src="${img}" 
                                             class="img-fluid rounded product-thumbnail ${index === 0 ? 'active' : ''}" 
                                             style="height: 80px; object-fit: cover; cursor: pointer;"
                                             data-image="${img}"
                                             onerror="this.src='/img/placeholder.jpg'">
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
                    <!-- Title and Price -->
                    <div class="mb-3">
                        <h1 class="h2 mb-2">${product.titulo}</h1>
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span class="h3 text-primary mb-0">S/ ${product.precio}</span>
                            ${isLoggedIn ? `
                                <button id="favorite-btn" 
                                        class="btn btn-outline-danger"
                                        data-product-id="${product.producto_id}">
                                    <i class="far fa-heart"></i>
                                    <span class="favorite-text">Favorito</span>
                                </button>
                            ` : ''}
                        </div>
                        <div class="text-muted mb-3">
                            <small>
                                <i class="fas fa-tag"></i> ${product.categoria?.nombre || 'Sin categoría'}
                                • <i class="fas fa-calendar"></i> ${formatDate(product.fecha_publicacion)}
                            </small>
                        </div>
                    </div>

                    <!-- Product Details -->
                    <div class="product-details mb-4">
                        <h5>Descripción</h5>
                        <p class="text-muted">${product.descripcion || 'Sin descripción disponible'}</p>
                        
                        <div class="row g-3">
                            ${product.marca ? `
                                <div class="col-6">
                                    <strong>Marca:</strong> ${product.marca}
                                </div>
                            ` : ''}
                            ${product.modelo ? `
                                <div class="col-6">
                                    <strong>Modelo:</strong> ${product.modelo}
                                </div>
                            ` : ''}
                            ${product.año_fabricacion ? `
                                <div class="col-6">
                                    <strong>Año:</strong> ${product.año_fabricacion}
                                </div>
                            ` : ''}
                            <div class="col-6">
                                <strong>Estado:</strong> 
                                <span class="badge ${estadoBadgeClass}">${formatEstado(product.estado)}</span>
                            </div>
                            <div class="col-6">
                                <strong>Stock:</strong> ${product.stock || 0} disponibles
                            </div>
                            <div class="col-6">
                                <strong>ID:</strong> ${product.producto_id}
                            </div>
                        </div>
                    </div>

                    <!-- Add to Cart Section -->
                    ${isLoggedIn && product.stock > 0 ? `
                        <div class="add-to-cart-section mb-4">
                            <div class="row g-3 align-items-center">
                                <div class="col-md-4">
                                    <label for="quantity-input" class="form-label">Cantidad:</label>
                                    <div class="input-group">
                                        <button class="btn btn-outline-secondary quantity-btn" type="button" data-action="decrease">
                                            <i class="fas fa-minus"></i>
                                        </button>
                                        <input type="number" 
                                               id="quantity-input" 
                                               class="form-control text-center" 
                                               value="1" 
                                               min="1" 
                                               max="${maxStock}">
                                        <button class="btn btn-outline-secondary quantity-btn" type="button" data-action="increase">
                                            <i class="fas fa-plus"></i>
                                        </button>
                                    </div>
                                </div>
                                <div class="col-md-8">
                                    <button id="add-to-cart-btn" 
                                            class="btn btn-primary btn-lg w-100"
                                            data-product-id="${product.producto_id}">
                                        <i class="fas fa-shopping-cart"></i>
                                        Agregar al Carrito
                                    </button>
                                </div>
                            </div>
                        </div>
                    ` : !isLoggedIn ? `
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle"></i>
                            <a href="/login" class="alert-link">Inicia sesión</a> para agregar productos al carrito
                        </div>
                    ` : `
                        <div class="alert alert-warning">
                            <i class="fas fa-exclamation-triangle"></i>
                            Producto agotado
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
                        <button class="nav-link active" id="reviews-tab" data-bs-toggle="tab" data-bs-target="#reviews" type="button" role="tab">
                            <i class="fas fa-star"></i> Reseñas
                        </button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="details-tab" data-bs-toggle="tab" data-bs-target="#details" type="button" role="tab">
                            <i class="fas fa-info-circle"></i> Detalles
                        </button>
                    </li>
                </ul>
                <div class="tab-content" id="productTabsContent">
                    <div class="tab-pane fade show active" id="reviews" role="tabpanel">
                        <div class="p-4">
                            <div id="reviews-container">
                                <div class="text-center">
                                    <div class="spinner-border" role="status">
                                        <span class="visually-hidden">Cargando reseñas...</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="tab-pane fade" id="details" role="tabpanel">
                        <div class="p-4">
                            <h5>Información adicional</h5>
                            <table class="table table-striped">
                                <tbody>
                                    ${product.marca ? `<tr><td><strong>Marca</strong></td><td>${product.marca}</td></tr>` : ''}
                                    ${product.modelo ? `<tr><td><strong>Modelo</strong></td><td>${product.modelo}</td></tr>` : ''}
                                    ${product.año_fabricacion ? `<tr><td><strong>Año de fabricación</strong></td><td>${product.año_fabricacion}</td></tr>` : ''}
                                    <tr><td><strong>Estado</strong></td><td>${formatEstado(product.estado)}</td></tr>
                                    <tr><td><strong>Stock</strong></td><td>${product.stock || 0}</td></tr>
                                    <tr><td><strong>Fecha de publicación</strong></td><td>${formatDate(product.fecha_publicacion)}</td></tr>
                                    ${product.ubicacion_almacen ? `<tr><td><strong>Ubicación</strong></td><td>${product.ubicacion_almacen}</td></tr>` : ''}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    productContainer.innerHTML = html;

    // Update page title
    document.title = `${product.titulo} - ElBaul`;

    // Re-initialize elements after DOM update
    setTimeout(() => {
        addToCartBtn = document.getElementById('add-to-cart-btn');
        favoriteBtn = document.getElementById('favorite-btn');
        quantityInput = document.getElementById('quantity-input');
    }, 100);
}

// Load product reviews
async function loadProductReviews(productId) {
    try {
        const response = await fetch(`/api/productos/${productId}/resenas`);
        
        if (response.ok) {
            const data = await response.json();
            if (data.exito) {
                productReviews = data.data.resenas || [];
                displayReviews(productReviews, data.data.estadisticas);
            }
        }
    } catch (error) {
        console.error('Error loading reviews:', error);
    }
}

// Display reviews
function displayReviews(reviews, stats) {
    if (!reviewsContainer) return;

    let html = '';

    // Reviews statistics
    if (stats) {
        html += `
            <div class="reviews-stats mb-4">
                <div class="row">
                    <div class="col-md-6">
                        <div class="d-flex align-items-center">
                            <div class="rating-display me-3">
                                <span class="h4 mb-0">${stats.promedio_puntuacion || 0}</span>
                                <div class="stars">
                                    ${generateStarsHTML(stats.promedio_puntuacion || 0)}
                                </div>
                            </div>
                            <div>
                                <div class="text-muted">${stats.total_resenas || 0} reseñas</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Review form (if user is logged in)
    if (currentUser) {
        html += `
            <div class="review-form-section mb-4">
                <h5>Escribir una reseña</h5>
                <form id="review-form">
                    <div class="mb-3">
                        <label class="form-label">Puntuación</label>
                        <div class="rating-input">
                            ${[5,4,3,2,1].map(star => `
                                <input type="radio" name="rating" value="${star}" id="star${star}">
                                <label for="star${star}"><i class="fas fa-star"></i></label>
                            `).join('')}
                        </div>
                    </div>
                    <div class="mb-3">
                        <label for="review-comment" class="form-label">Comentario</label>
                        <textarea class="form-control" id="review-comment" rows="3" placeholder="Comparte tu experiencia con este producto..."></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-paper-plane"></i> Enviar Reseña
                    </button>
                </form>
            </div>
        `;
    }

    // Reviews list
    if (reviews.length > 0) {
        html += '<div class="reviews-list">';
        reviews.forEach(review => {
            html += `
                <div class="review-item border-bottom py-3">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div>
                            <strong>${review.usuario?.nombre || 'Usuario'}</strong>
                            <div class="stars small">
                                ${generateStarsHTML(review.puntuacion)}
                            </div>
                        </div>
                        <small class="text-muted">${formatDate(review.fecha_creacion)}</small>
                    </div>
                    <p class="mb-0">${review.comentario}</p>
                </div>
            `;
        });
        html += '</div>';
    } else {
        html += `
            <div class="no-reviews text-center py-4">
                <i class="fas fa-comments fa-3x text-muted mb-3"></i>
                <h5>Sin reseñas aún</h5>
                <p class="text-muted">Sé el primero en reseñar este producto</p>
            </div>
        `;
    }

    reviewsContainer.innerHTML = html;

    // Re-initialize review form
    setTimeout(() => {
        reviewForm = document.getElementById('review-form');
        if (reviewForm) {
            reviewForm.addEventListener('submit', handleReviewSubmit);
        }
    }, 100);
}

// Event Handlers
async function handleAddToCart(event) {
    event.preventDefault();
    
    if (!currentUser) {
        window.location.href = '/login';
        return;
    }

    const productId = currentProduct.producto_id;
    const quantity = parseInt(quantityInput?.value || 1);

    try {
        addToCartBtn.disabled = true;
        addToCartBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Agregando...';

        const response = await fetch('/api/carrito/items', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                producto_id: productId,
                cantidad: quantity
            })
        });

        if (response.ok) {
            showNotification('Producto agregado al carrito', 'success');
            updateCartCount();
        } else {
            const data = await response.json();
            throw new Error(data.mensaje || 'Error al agregar al carrito');
        }

    } catch (error) {
        console.error('Error adding to cart:', error);
        showNotification(error.message, 'error');
    } finally {
        addToCartBtn.disabled = false;
        addToCartBtn.innerHTML = '<i class="fas fa-shopping-cart"></i> Agregar al Carrito';
    }
}

async function handleToggleFavorite(event) {
    event.preventDefault();
    
    if (!currentUser) {
        window.location.href = '/login';
        return;
    }

    const productId = currentProduct.producto_id;
    const icon = favoriteBtn.querySelector('i');
    const text = favoriteBtn.querySelector('.favorite-text');
    const isFavorited = icon.classList.contains('fas');

    try {
        if (isFavorited) {
            await removeFavorite(productId);
            icon.classList.replace('fas', 'far');
            favoriteBtn.classList.replace('btn-danger', 'btn-outline-danger');
            text.textContent = 'Favorito';
        } else {
            await addFavorite(productId);
            icon.classList.replace('far', 'fas');
            favoriteBtn.classList.replace('btn-outline-danger', 'btn-danger');
            text.textContent = 'En Favoritos';
        }
    } catch (error) {
        console.error('Error toggling favorite:', error);
        showNotification('Error al actualizar favoritos', 'error');
    }
}

async function handleReviewSubmit(event) {
    event.preventDefault();
    
    if (!currentUser) {
        window.location.href = '/login';
        return;
    }

    const rating = document.querySelector('input[name="rating"]:checked')?.value;
    const comment = document.getElementById('review-comment')?.value;

    if (!rating || !comment.trim()) {
        showNotification('Por favor completa todos los campos', 'error');
        return;
    }

    try {
        const response = await fetch(`/api/productos/${currentProduct.producto_id}/resenas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                puntuacion: parseInt(rating),
                comentario: comment.trim()
            })
        });

        if (response.ok) {
            showNotification('Reseña enviada exitosamente', 'success');
            reviewForm.reset();
            loadProductReviews(currentProduct.producto_id);
        } else {
            const data = await response.json();
            throw new Error(data.mensaje || 'Error al enviar reseña');
        }

    } catch (error) {
        console.error('Error submitting review:', error);
        showNotification(error.message, 'error');
    }
}

function handleImageSelect(event) {
    const newImage = event.target.dataset.image;
    const mainImage = document.getElementById('main-product-image');
    
    if (mainImage && newImage) {
        mainImage.src = newImage;
        
        // Update active thumbnail
        document.querySelectorAll('.product-thumbnail').forEach(thumb => {
            thumb.classList.remove('active');
        });
        event.target.classList.add('active');
    }
}

function handleQuantityChange(event) {
    const action = event.target.closest('.quantity-btn').dataset.action;
    const input = quantityInput;
    
    if (!input) return;

    let currentValue = parseInt(input.value) || 1;
    const min = parseInt(input.min) || 1;
    const max = parseInt(input.max) || 999;

    if (action === 'increase' && currentValue < max) {
        input.value = currentValue + 1;
    } else if (action === 'decrease' && currentValue > min) {
        input.value = currentValue - 1;
    }
}

// Utility Functions
function getProductIdFromURL() {
    const path = window.location.pathname;
    const matches = path.match(/\/productos\/([^\/]+)/);
    return matches ? matches[1] : null;
}

function showLoading() {
    if (productContainer) {
        productContainer.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando producto...</span>
                </div>
                <p class="mt-2">Cargando detalles del producto...</p>
            </div>
        `;
    }
}

function hideLoading() {
    // Loading is hidden when content is displayed
}

function showError(message) {
    if (productContainer) {
        productContainer.innerHTML = `
            <div class="alert alert-danger text-center">
                <i class="fas fa-exclamation-triangle"></i>
                <h4>Error</h4>
                <p>${message}</p>
                <a href="/productos" class="btn btn-primary">
                    <i class="fas fa-arrow-left"></i> Volver a Productos
                </a>
            </div>
        `;
    }
}

async function checkIfFavorited(productId) {
    try {
        const response = await fetch(`/api/favoritos/verificar/${productId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.exito && data.data.es_favorito && favoriteBtn) {
                const icon = favoriteBtn.querySelector('i');
                const text = favoriteBtn.querySelector('.favorite-text');
                icon.classList.replace('far', 'fas');
                favoriteBtn.classList.replace('btn-outline-danger', 'btn-danger');
                text.textContent = 'En Favoritos';
            }
        }
    } catch (error) {
        console.error('Error checking favorite status:', error);
    }
}

async function checkUserReview(productId) {
    try {
        const response = await fetch(`/api/productos/${productId}/resenas/mi-resena`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.exito && data.data.resena) {
                // User already has a review, hide the form or show edit option
                const reviewFormSection = document.querySelector('.review-form-section');
                if (reviewFormSection) {
                    reviewFormSection.innerHTML = `
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle"></i>
                            Ya has enviado una reseña para este producto.
                        </div>
                    `;
                }
            }
        }
    } catch (error) {
        console.error('Error checking user review:', error);
    }
}

async function addFavorite(productId) {
    const response = await fetch('/api/favoritos', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ producto_id: productId })
    });
    
    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.mensaje || 'Error adding to favorites');
    }
}

async function removeFavorite(productId) {
    const response = await fetch(`/api/favoritos/producto/${productId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });
    
    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.mensaje || 'Error removing from favorites');
    }
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

function getEstadoBadgeClass(estado) {
    const badgeClasses = {
        'nuevo': 'bg-success',
        'como_nuevo': 'bg-info',
        'excelente': 'bg-primary',
        'bueno': 'bg-warning',
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

function shareProduct() {
    if (navigator.share) {
        navigator.share({
            title: currentProduct.titulo,
            text: currentProduct.descripcion,
            url: window.location.href
        });
    } else {
        // Fallback - copy to clipboard
        navigator.clipboard.writeText(window.location.href).then(() => {
            showNotification('Enlace copiado al portapapeles', 'success');
        });
    }
}

function reportProduct() {
    // Implement report functionality
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

async function updateCartCount() {
    try {
        const response = await fetch('/api/carrito', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.exito) {
                const cartCount = data.data.items.reduce((total, item) => total + item.cantidad, 0);
                const cartBadge = document.querySelector('.cart-count');
                if (cartBadge) {
                    cartBadge.textContent = cartCount;
                    cartBadge.style.display = cartCount > 0 ? 'inline' : 'none';
                }
            }
        }
    } catch (error) {
        console.error('Error updating cart count:', error);
    }
}