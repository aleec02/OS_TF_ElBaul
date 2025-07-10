// Global variables for products listing page ONLY
let currentPage = 1;
let currentFilters = {};
let isLoading = false;
let isInitialized = false;

// DOM Elements
let productsContainer;
let loadingIndicator;
let paginationContainer;
let filtersForm;
let searchInput;
let categorySelect;
let priceMinInput;
let priceMaxInput;
let estadoCheckboxes;
let sortSelect;
let resultsInfo;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (isInitialized) return; // Prevent multiple initializations
    
    console.log('Products listing page loaded');
    isInitialized = true;
    
    initializeElements();
    initializeEventListeners();
    loadProducts();
    loadCategories();
});

function initializeElements() {
    productsContainer = document.getElementById('products-container');
    loadingIndicator = document.getElementById('loading-indicator');
    paginationContainer = document.getElementById('pagination-container');
    filtersForm = document.getElementById('filters-form');
    searchInput = document.getElementById('search-input');
    categorySelect = document.getElementById('category-select');
    priceMinInput = document.getElementById('price-min');
    priceMaxInput = document.getElementById('price-max');
    estadoCheckboxes = document.querySelectorAll('input[name="estado"]');
    sortSelect = document.getElementById('sort-select');
    resultsInfo = document.getElementById('results-info');

    console.log('Elements initialized:', {
        productsContainer: !!productsContainer,
        loadingIndicator: !!loadingIndicator,
        filtersForm: !!filtersForm,
        resultsInfo: !!resultsInfo
    });
}

function initializeEventListeners() {
    // Search functionality
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 500));
    }

    // Filters form
    if (filtersForm) {
        filtersForm.addEventListener('submit', handleFiltersSubmit);
    }

    // Clear filters button
    const clearFiltersBtn = document.getElementById('clear-filters');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearFilters);
    }

    // Sort select
    if (sortSelect) {
        sortSelect.addEventListener('change', handleSortChange);
    }

    // Category select
    if (categorySelect) {
        categorySelect.addEventListener('change', handleCategoryChange);
    }

    // Price inputs
    if (priceMinInput) {
        priceMinInput.addEventListener('change', handlePriceChange);
    }
    if (priceMaxInput) {
        priceMaxInput.addEventListener('change', handlePriceChange);
    }

    // Estado checkboxes
    estadoCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', handleEstadoChange);
    });
}

// Load products from API
async function loadProducts(page = 1, filters = {}) {
    if (isLoading) return;
    
    isLoading = true;
    showLoading();
    
    try {
        console.log('Loading products...', { page, filters });
        
        // Small delay to prevent rapid successive calls
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Build query parameters
        const params = new URLSearchParams({
            page: page.toString(),
            limit: '12',
            ...filters
        });

        const response = await fetch(`/api/productos?${params}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Products data received:', data);
        
        if (data.exito) {
            displayProducts(data.data.productos);
            updatePagination(data.data.paginacion);
            updateResultsInfo(data.data.paginacion, data.data.filtros_aplicados);
            currentPage = page;
            currentFilters = filters;
        } else {
            throw new Error(data.mensaje || 'Error loading products');
        }
        
    } catch (error) {
        console.error('Error loading products:', error);
        showError('Error al cargar los productos: ' + error.message);
    } finally {
        hideLoading();
        isLoading = false;
    }
}

// Display products in the container
function displayProducts(products) {
    if (!productsContainer) {
        console.error('Products container not found');
        return;
    }

    if (!products || products.length === 0) {
        productsContainer.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info text-center">
                    <i class="fas fa-info-circle"></i>
                    No se encontraron productos con los filtros aplicados.
                </div>
            </div>
        `;
        return;
    }

    let html = '';
    products.forEach(product => {
        html += createProductCard(product);
    });
    
    productsContainer.innerHTML = html;
    
    // Initialize favorite buttons
    initializeFavoriteButtons();
}

// Update results info
function updateResultsInfo(pagination, filters) {
    if (!resultsInfo) return;
    
    const total = pagination.total;
    const currentPage = pagination.page;
    const limit = pagination.limit;
    const start = (currentPage - 1) * limit + 1;
    const end = Math.min(currentPage * limit, total);
    
    let infoText = `Mostrando ${start}-${end} de ${total} productos`;
    
    // Add filter info if any filters are applied
    const activeFilters = [];
    if (filters.categoria_id) activeFilters.push('categoría');
    if (filters.precio_min || filters.precio_max) activeFilters.push('precio');
    if (filters.estado) activeFilters.push('estado');
    if (filters.buscar) activeFilters.push('búsqueda');
    
    if (activeFilters.length > 0) {
        infoText += ` (filtros: ${activeFilters.join(', ')})`;
    }
    
    resultsInfo.textContent = infoText;
}

// Create HTML for a single product card
function createProductCard(product) {
    const imageUrl = product.imagenes && product.imagenes.length > 0 
        ? product.imagenes[0] 
        : '/img/placeholder.jpg';
    
    const estadoBadgeClass = getEstadoBadgeClass(product.estado);
    const isLoggedIn = window.user ? true : false;
    
    return `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card product-card h-100 shadow-sm">
                <div class="position-relative">
                    <img src="${imageUrl}" 
                         class="card-img-top product-image" 
                         alt="${product.titulo}"
                         style="height: 250px; object-fit: cover;"
                         onerror="this.src='/img/placeholder.jpg'">
                    <span class="badge ${estadoBadgeClass} position-absolute top-0 end-0 m-2">
                        ${formatEstado(product.estado)}
                    </span>
                    ${isLoggedIn ? `
                        <button class="btn btn-link position-absolute top-0 start-0 m-2 p-1 favorite-btn" 
                                data-product-id="${product.producto_id}"
                                title="Agregar a favoritos">
                            <i class="far fa-heart text-white"></i>
                        </button>
                    ` : ''}
                </div>
                <div class="card-body">
                    <h6 class="card-title">${product.titulo}</h6>
                    <p class="card-text text-muted small">
                        ${product.descripcion ? product.descripcion.substring(0, 100) + '...' : 'Sin descripción'}
                    </p>
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="product-price h5 text-primary mb-0">S/ ${product.precio}</span>
                        <small class="text-muted">${product.marca || ''}</small>
                    </div>
                    <div class="d-flex justify-content-between align-items-center">
                        <small class="text-muted">
                            <i class="fas fa-calendar"></i>
                            ${formatDate(product.fecha_publicacion)}
                        </small>
                        <small class="text-muted">Stock: ${product.stock || 0}</small>
                    </div>
                </div>
                <div class="card-footer bg-transparent">
                    <div class="d-grid gap-2">
                        <a href="/productos/${product.producto_id}" class="btn btn-primary btn-sm">
                            <i class="fas fa-eye"></i> Ver Detalles
                        </a>
                        ${isLoggedIn ? `
                            <button class="btn btn-outline-primary btn-sm add-to-cart-btn" 
                                    data-product-id="${product.producto_id}">
                                <i class="fas fa-shopping-cart"></i> Agregar al Carrito
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Load categories for filter dropdown
async function loadCategories() {
    try {
        const response = await fetch('/api/categorias');
        const data = await response.json();
        
        if (data.exito && categorySelect) {
            let options = '<option value="">Todas las categorías</option>';
            data.data.categorias.forEach(categoria => {
                options += `<option value="${categoria.categoria_id}">${categoria.nombre}</option>`;
            });
            categorySelect.innerHTML = options;
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Event Handlers
function handleSearch(event) {
    const searchTerm = event.target.value.trim();
    const filters = { ...currentFilters };
    
    if (searchTerm) {
        filters.q = searchTerm;
    } else {
        delete filters.q;
    }
    
    loadProducts(1, filters);
}

function handleFiltersSubmit(event) {
    event.preventDefault();
    applyFilters();
}

function handleSortChange(event) {
    const sortValue = event.target.value;
    const filters = { ...currentFilters };
    
    if (sortValue) {
        filters.orden = sortValue;
    } else {
        delete filters.orden;
    }
    
    loadProducts(1, filters);
}

function handleCategoryChange(event) {
    const categoryId = event.target.value;
    const filters = { ...currentFilters };
    
    if (categoryId) {
        filters.categoria_id = categoryId;
    } else {
        delete filters.categoria_id;
    }
    
    loadProducts(1, filters);
}

function handlePriceChange() {
    applyFilters();
}

function handleEstadoChange() {
    applyFilters();
}

function applyFilters() {
    const filters = {};
    
    // Search filter
    const searchTerm = searchInput ? searchInput.value.trim() : '';
    if (searchTerm) {
        filters.q = searchTerm;
    }
    
    // Category filter
    const categoryId = categorySelect ? categorySelect.value : '';
    if (categoryId) {
        filters.categoria_id = categoryId;
    }
    
    // Price filters
    const minPrice = priceMinInput ? priceMinInput.value : '';
    const maxPrice = priceMaxInput ? priceMaxInput.value : '';
    if (minPrice) filters.precio_min = minPrice;
    if (maxPrice) filters.precio_max = maxPrice;
    
    // Estado filters
    const checkedEstados = Array.from(estadoCheckboxes || []).filter(cb => cb.checked).map(cb => cb.value);
    if (checkedEstados.length > 0) {
        filters.estado = checkedEstados.join(',');
    }
    
    // Sort filter
    const sortValue = sortSelect ? sortSelect.value : '';
    if (sortValue) {
        filters.orden = sortValue;
    }
    
    loadProducts(1, filters);
}

function clearFilters() {
    // Clear form inputs
    if (filtersForm) filtersForm.reset();
    if (sortSelect) sortSelect.value = '';
    
    // Clear filters and reload
    currentFilters = {};
    loadProducts(1, {});
}

function updatePagination(paginationData) {
    if (!paginationContainer) return;
    
    const total = paginationData.total || 0;
    const totalPages = paginationData.totalPages || Math.ceil(total / 12);
    
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let paginationHTML = '<nav><ul class="pagination justify-content-center">';
    
    // Previous button
    paginationHTML += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1})">Anterior</a>
        </li>
    `;
    
    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
            </li>
        `;
    }
    
    // Next button
    paginationHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1})">Siguiente</a>
        </li>
    `;
    
    paginationHTML += '</ul></nav>';
    paginationContainer.innerHTML = paginationHTML;
}

function changePage(page) {
    if (page < 1) return;
    loadProducts(page, currentFilters);
}

function initializeFavoriteButtons() {
    // Add event listeners for favorite buttons
    document.querySelectorAll('.favorite-btn').forEach(btn => {
        btn.addEventListener('click', toggleFavorite);
    });
    
    // Add event listeners for add to cart buttons
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = this.getAttribute('data-product-id');
        addToCart(productId);
        });
    });
}

async function toggleFavorite(event) {
    if (!window.user) {
        showError('Debes iniciar sesión para agregar favoritos');
        return;
    }
    
    const productId = event.currentTarget.getAttribute('data-product-id');
    
    try {
        const response = await fetch('/api/favoritos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ producto_id: productId })
        });
        
        const data = await response.json();
        
        if (data.exito) {
            // Toggle heart icon
            const icon = event.currentTarget.querySelector('i');
            if (icon.classList.contains('far')) {
                icon.classList.remove('far');
                icon.classList.add('fas');
                icon.style.color = '#dc3545';
        } else {
                icon.classList.remove('fas');
                icon.classList.add('far');
                icon.style.color = 'white';
        }
        } else {
            showError(data.mensaje || 'Error al agregar a favoritos');
        }
    } catch (error) {
        console.error('Error toggling favorite:', error);
        showError('Error al agregar a favoritos');
    }
}

async function addToCart(productId) {
    if (!window.user) {
        showError('Debes iniciar sesión para agregar al carrito');
        return;
    }

    try {
        const response = await fetch('/api/carrito/items', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ 
                producto_id: productId,
                cantidad: 1
            })
        });
        
        const data = await response.json();
        
        if (data.exito) {
            showSuccess('Producto agregado al carrito');
            // Update cart count if function exists
            if (typeof updateCartCount === 'function') {
                updateCartCount();
            }
    } else {
            showError(data.mensaje || 'Error al agregar al carrito');
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        showError('Error al agregar al carrito');
    }
}

function showLoading() {
    if (loadingIndicator) {
        loadingIndicator.style.display = 'block';
    }
    // Don't replace products container content here - let the API response handle it
}

function hideLoading() {
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
}

function showError(message) {
    // Use common.js showAlert function if available
    if (typeof showAlert === 'function') {
        showAlert('danger', message);
    } else {
        // Fallback: show error in products container
    if (productsContainer) {
        productsContainer.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger text-center">
                    <i class="fas fa-exclamation-triangle"></i>
                    ${message}
                </div>
            </div>
        `;
        }
    }
}

function showSuccess(message) {
    // Use common.js showAlert function if available
    if (typeof showAlert === 'function') {
        showAlert('success', message);
    } else {
        alert(message);
    }
}

function getEstadoBadgeClass(estado) {
    switch (estado) {
        case 'nuevo': return 'bg-success';
        case 'como_nuevo': return 'bg-primary';
        case 'excelente': return 'bg-info';
        case 'bueno': return 'bg-warning';
        case 'regular': return 'bg-secondary';
        default: return 'bg-secondary';
    }
}

function formatEstado(estado) {
    switch (estado) {
        case 'nuevo': return 'Nuevo';
        case 'como_nuevo': return 'Como Nuevo';
        case 'excelente': return 'Excelente';
        case 'bueno': return 'Bueno';
        case 'regular': return 'Regular';
        default: return estado;
    }
}

function formatDate(dateString) {
    if (!dateString) return 'Fecha no disponible';
    
    try {
    const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (error) {
        return 'Fecha no disponible';
    }
}