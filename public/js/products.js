// Global variables for products listing page ONLY
let currentPage = 1;
let currentFilters = {};
let isLoading = false;

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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Products listing page loaded');
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

    console.log('Elements initialized:', {
        productsContainer: !!productsContainer,
        loadingIndicator: !!loadingIndicator,
        filtersForm: !!filtersForm
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
    const filters = { ...currentFilters };
    
    // Price filters
    const priceMin = priceMinInput?.value;
    const priceMax = priceMaxInput?.value;
    
    if (priceMin) {
        filters.precio_min = priceMin;
    } else {
        delete filters.precio_min;
    }
    
    if (priceMax) {
        filters.precio_max = priceMax;
    } else {
        delete filters.precio_max;
    }
    
    // Estado filters
    const selectedEstados = Array.from(estadoCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);
    
    if (selectedEstados.length > 0) {
        filters.estado = selectedEstados.join(',');
    } else {
        delete filters.estado;
    }
    
    loadProducts(1, filters);
}

function clearFilters() {
    // Reset form
    if (filtersForm) {
        filtersForm.reset();
    }
    
    // Reset search
    if (searchInput) {
        searchInput.value = '';
    }
    
    // Reset sort
    if (sortSelect) {
        sortSelect.value = '';
    }
    
    // Reset category
    if (categorySelect) {
        categorySelect.value = '';
    }
    
    // Load products without filters
    loadProducts(1, {});
}

// Pagination
function updatePagination(paginationData) {
    if (!paginationContainer) return;
    
    const { page, totalPages, total } = paginationData;
    
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let html = '<nav aria-label="Product pagination"><ul class="pagination justify-content-center">';
    
    // Previous button
    html += `
        <li class="page-item ${page <= 1 ? 'disabled' : ''}">
            <button class="page-link" onclick="changePage(${page - 1})" ${page <= 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"></i>
            </button>
        </li>
    `;
    
    // Page numbers
    const startPage = Math.max(1, page - 2);
    const endPage = Math.min(totalPages, page + 2);
    
    if (startPage > 1) {
        html += `<li class="page-item"><button class="page-link" onclick="changePage(1)">1</button></li>`;
        if (startPage > 2) {
            html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        html += `
            <li class="page-item ${i === page ? 'active' : ''}">
                <button class="page-link" onclick="changePage(${i})">${i}</button>
            </li>
        `;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
        html += `<li class="page-item"><button class="page-link" onclick="changePage(${totalPages})">${totalPages}</button></li>`;
    }
    
    // Next button
    html += `
        <li class="page-item ${page >= totalPages ? 'disabled' : ''}">
            <button class="page-link" onclick="changePage(${page + 1})" ${page >= totalPages ? 'disabled' : ''}>
                <i class="fas fa-chevron-right"></i>
            </button>
        </li>
    `;
    
    html += '</ul></nav>';
    
    // Add results info
    html += `
        <div class="text-center mt-2">
            <small class="text-muted">
                Mostrando ${((page - 1) * 12) + 1} - ${Math.min(page * 12, total)} de ${total} productos
            </small>
        </div>
    `;
    
    paginationContainer.innerHTML = html;
}

function changePage(page) {
    if (page < 1 || page === currentPage) return;
    loadProducts(page, currentFilters);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Favorite functionality
function initializeFavoriteButtons() {
    const favoriteButtons = document.querySelectorAll('.favorite-btn');
    favoriteButtons.forEach(btn => {
        btn.addEventListener('click', toggleFavorite);
    });
    
    // Check existing favorites if user is logged in
    if (window.user) {
        checkExistingFavorites();
    }
}

async function toggleFavorite(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const productId = button.dataset.productId;
    const icon = button.querySelector('i');
    
    try {
        if (icon.classList.contains('fas')) {
            // Remove from favorites - simulate API call
            await new Promise(resolve => setTimeout(resolve, 300));
            icon.classList.replace('fas', 'far');
            icon.classList.replace('text-danger', 'text-white');
        } else {
            // Add to favorites - simulate API call
            await new Promise(resolve => setTimeout(resolve, 300));
            icon.classList.replace('far', 'fas');
            icon.classList.replace('text-white', 'text-danger');
        }
    } catch (error) {
        console.error('Error toggling favorite:', error);
        showNotification('Error al actualizar favoritos', 'error');
    }
}

async function checkExistingFavorites() {
    // Simulate checking existing favorites
    console.log('Checking existing favorites...');
}

// Add to cart functionality
document.addEventListener('click', function(event) {
    if (event.target.closest('.add-to-cart-btn')) {
        event.preventDefault();
        const button = event.target.closest('.add-to-cart-btn');
        const productId = button.dataset.productId;
        addToCart(productId);
    }
});

async function addToCart(productId) {
    try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        showNotification('Producto agregado al carrito', 'success');
    } catch (error) {
        console.error('Error adding to cart:', error);
        showNotification('Error al agregar al carrito', 'error');
    }
}

// Utility functions
function showLoading() {
    if (loadingIndicator) {
        loadingIndicator.style.display = 'block';
    }
    if (productsContainer) {
        productsContainer.innerHTML = `
            <div class="col-12 text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando productos...</span>
                </div>
                <p class="mt-2">Cargando productos...</p>
            </div>
        `;
    }
}

function hideLoading() {
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
}

function showError(message) {
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



// Global variables for products listing page ONLY
let currentPage = 1;
let currentFilters = {};
let isLoading = false;

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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Products listing page loaded');
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

    console.log('Elements initialized:', {
        productsContainer: !!productsContainer,
        loadingIndicator: !!loadingIndicator,
        filtersForm: !!filtersForm
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
    const filters = { ...currentFilters };
    
    // Price filters
    const priceMin = priceMinInput?.value;
    const priceMax = priceMaxInput?.value;
    
    if (priceMin) {
        filters.precio_min = priceMin;
    } else {
        delete filters.precio_min;
    }
    
    if (priceMax) {
        filters.precio_max = priceMax;
    } else {
        delete filters.precio_max;
    }
    
    // Estado filters
    const selectedEstados = Array.from(estadoCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);
    
    if (selectedEstados.length > 0) {
        filters.estado = selectedEstados.join(',');
    } else {
        delete filters.estado;
    }
    
    loadProducts(1, filters);
}

function clearFilters() {
    // Reset form
    if (filtersForm) {
        filtersForm.reset();
    }
    
    // Reset search
    if (searchInput) {
        searchInput.value = '';
    }
    
    // Reset sort
    if (sortSelect) {
        sortSelect.value = '';
    }
    
    // Reset category
    if (categorySelect) {
        categorySelect.value = '';
    }
    
    // Load products without filters
    loadProducts(1, {});
}

// Pagination
function updatePagination(paginationData) {
    if (!paginationContainer) return;
    
    const { page, totalPages, total } = paginationData;
    
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let html = '<nav aria-label="Product pagination"><ul class="pagination justify-content-center">';
    
    // Previous button
    html += `
        <li class="page-item ${page <= 1 ? 'disabled' : ''}">
            <button class="page-link" onclick="changePage(${page - 1})" ${page <= 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"></i>
            </button>
        </li>
    `;
    
    // Page numbers
    const startPage = Math.max(1, page - 2);
    const endPage = Math.min(totalPages, page + 2);
    
    if (startPage > 1) {
        html += `<li class="page-item"><button class="page-link" onclick="changePage(1)">1</button></li>`;
        if (startPage > 2) {
            html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        html += `
            <li class="page-item ${i === page ? 'active' : ''}">
                <button class="page-link" onclick="changePage(${i})">${i}</button>
            </li>
        `;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
        html += `<li class="page-item"><button class="page-link" onclick="changePage(${totalPages})">${totalPages}</button></li>`;
    }
    
    // Next button
    html += `
        <li class="page-item ${page >= totalPages ? 'disabled' : ''}">
            <button class="page-link" onclick="changePage(${page + 1})" ${page >= totalPages ? 'disabled' : ''}>
                <i class="fas fa-chevron-right"></i>
            </button>
        </li>
    `;
    
    html += '</ul></nav>';
    
    // Add results info
    html += `
        <div class="text-center mt-2">
            <small class="text-muted">
                Mostrando ${((page - 1) * 12) + 1} - ${Math.min(page * 12, total)} de ${total} productos
            </small>
        </div>
    `;
    
    paginationContainer.innerHTML = html;
}

function changePage(page) {
    if (page < 1 || page === currentPage) return;
    loadProducts(page, currentFilters);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Favorite functionality
function initializeFavoriteButtons() {
    const favoriteButtons = document.querySelectorAll('.favorite-btn');
    favoriteButtons.forEach(btn => {
        btn.addEventListener('click', toggleFavorite);
    });
    
    // Check existing favorites if user is logged in
    if (window.user) {
        checkExistingFavorites();
    }
}

async function toggleFavorite(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const productId = button.dataset.productId;
    const icon = button.querySelector('i');
    
    try {
        if (icon.classList.contains('fas')) {
            // Remove from favorites - simulate API call
            await new Promise(resolve => setTimeout(resolve, 300));
            icon.classList.replace('fas', 'far');
            icon.classList.replace('text-danger', 'text-white');
        } else {
            // Add to favorites - simulate API call
            await new Promise(resolve => setTimeout(resolve, 300));
            icon.classList.replace('far', 'fas');
            icon.classList.replace('text-white', 'text-danger');
        }
    } catch (error) {
        console.error('Error toggling favorite:', error);
        showNotification('Error al actualizar favoritos', 'error');
    }
}

async function checkExistingFavorites() {
    // Simulate checking existing favorites
    console.log('Checking existing favorites...');
}

// Add to cart functionality
document.addEventListener('click', function(event) {
    if (event.target.closest('.add-to-cart-btn')) {
        event.preventDefault();
        const button = event.target.closest('.add-to-cart-btn');
        const productId = button.dataset.productId;
        addToCart(productId);
    }
});

async function addToCart(productId) {
    try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        showNotification('Producto agregado al carrito', 'success');
    } catch (error) {
        console.error('Error adding to cart:', error);
        showNotification('Error al agregar al carrito', 'error');
    }
}

// Utility functions
function showLoading() {
    if (loadingIndicator) {
        loadingIndicator.style.display = 'block';
    }
    if (productsContainer) {
        productsContainer.innerHTML = `
            <div class="col-12 text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando productos...</span>
                </div>
                <p class="mt-2">Cargando productos...</p>
            </div>
        `;
    }
}

function hideLoading() {
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
}

function showError(message) {
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
    return date.toLocaleDateString