// Global variables for products listing page ONLY
let currentPage = 1;
let currentFilters = {};
let isLoading = false;
let isInitialized = false;
let loadTimeout = null;

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

// Initialize when DOM is loaded (PROTECTED AGAINST MULTIPLE CALLS)
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 Products.js DOMContentLoaded triggered');
    
    if (isInitialized) {
        console.log('⚠️ Products.js already initialized, skipping...');
        return; // Prevent multiple initializations
    }
    
    console.log('✅ Products listing page loaded - initializing...');
    isInitialized = true;
    
    // Wait for common.js to be ready
    waitForCommonFunctions().then(() => {
        console.log('🔧 Common functions ready, initializing products page...');
        initializeElements();
        initializeEventListeners();
        initializeDebouncedLoadProducts();
        if (debouncedLoadProducts) {
            console.log('🚀 Using debounced load products');
            debouncedLoadProducts();
        } else {
            console.log('⚠️ Using fallback load products (no debounce)');
            loadProducts(); // Fallback if debounce not available
        }
        loadCategories();
    });
});

// Wait for common functions to be available
function waitForCommonFunctions() {
    return new Promise((resolve) => {
        const checkFunctions = () => {
            if (window.apiCall && window.showAlert) {
                console.log('Common functions ready for products page');
                resolve();
            } else {
                console.log('Waiting for common functions...');
                setTimeout(checkFunctions, 100);
            }
        };
        checkFunctions();
    });
}

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
    console.log('🔧 Initializing event listeners...');
    
    // Ensure debounce is available
    if (!window.debounce) {
        console.error('❌ window.debounce not available, using fallback');
        window.debounce = function(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        };
    }
    
    // Search functionality (DEBOUNCED)
    if (searchInput) {
        console.log('🔍 Adding search input listener');
        searchInput.addEventListener('input', window.debounce(handleSearch, 800));
    }

    // Filters form
    if (filtersForm) {
        console.log('📋 Adding filters form listener');
        filtersForm.addEventListener('submit', handleFiltersSubmit);
    }

    // Clear filters button
    const clearFiltersBtn = document.getElementById('clear-filters');
    if (clearFiltersBtn) {
        console.log('🧹 Adding clear filters listener');
        clearFiltersBtn.addEventListener('click', clearFilters);
    }

    // Sort select (DEBOUNCED)
    if (sortSelect) {
        console.log('📊 Adding sort select listener');
        sortSelect.addEventListener('change', window.debounce(handleSortChange, 300));
    }

    // Category select (DEBOUNCED)
    if (categorySelect) {
        console.log('🏷️ Adding category select listener');
        categorySelect.addEventListener('change', window.debounce(handleCategoryChange, 300));
    }

    // Price inputs (DEBOUNCED)
    if (priceMinInput) {
        console.log('💰 Adding price min input listener');
        priceMinInput.addEventListener('change', window.debounce(handlePriceChange, 500));
    }
    if (priceMaxInput) {
        console.log('💰 Adding price max input listener');
        priceMaxInput.addEventListener('change', window.debounce(handlePriceChange, 500));
    }

    // Estado checkboxes (DEBOUNCED)
    estadoCheckboxes.forEach((checkbox, index) => {
        console.log(`☑️ Adding estado checkbox ${index + 1} listener`);
        checkbox.addEventListener('change', window.debounce(handleEstadoChange, 300));
    });
    
    console.log('✅ Event listeners initialized');
}

// DEBOUNCED load products function (DEFERRED INITIALIZATION)
let debouncedLoadProducts = null;

function initializeDebouncedLoadProducts() {
    console.log('🔧 Initializing debounced load products...');
    
    if (window.debounce && !debouncedLoadProducts) {
        console.log('✅ Using window.debounce');
        debouncedLoadProducts = window.debounce(function(page = 1, filters = {}) {
            console.log('🚀 Debounced loadProducts called with:', { page, filters });
            loadProducts(page, filters);
        }, 300);
    } else if (!window.debounce) {
        console.warn('⚠️ window.debounce not available, creating fallback');
        // Create a simple debounce fallback
        let timeout;
        debouncedLoadProducts = function(page = 1, filters = {}) {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                console.log('🚀 Fallback loadProducts called with:', { page, filters });
                loadProducts(page, filters);
            }, 300);
        };
    } else {
        console.log('ℹ️ Debounced load products already initialized');
    }
}

// Load products from API (PROTECTED AGAINST MULTIPLE CALLS)
async function loadProducts(page = 1, filters = {}) {
    const callId = Math.random().toString(36).substr(2, 9);
    console.log(`🔄 [${callId}] loadProducts START - page: ${page}, filters:`, filters);
    
    if (isLoading) {
        console.log(`⏸️ [${callId}] Products already loading, skipping...`);
        return;
    }
    
    isLoading = true;
    showLoading();
    
    try {
        console.log(`📡 [${callId}] Making API call...`);
        
        // Build query parameters
        const params = new URLSearchParams({
            page: page.toString(),
            limit: '12',
            ...filters
        });

        const response = await window.apiCall(`/productos?${params}`);
        console.log(`✅ [${callId}] Products data received:`, response);
        
        if (response.exito) {
            displayProducts(response.data.productos, callId);
            updatePagination(response.data.paginacion);
            updateResultsInfo(response.data.paginacion, response.data.filtros_aplicados);
            currentPage = page;
            currentFilters = filters;
        } else {
            throw new Error(response.mensaje || 'Error loading products');
        }
        
    } catch (error) {
        console.error(`❌ [${callId}] Error loading products:`, error);
        showError('Error al cargar los productos: ' + error.message);
    } finally {
        hideLoading();
        isLoading = false;
        console.log(`🏁 [${callId}] loadProducts END`);
    }
}

// Display products in the container (PREVENT MULTIPLE RENDERS)
function displayProducts(products, callId = 'unknown') {
    console.log(`🎨 [${callId}] displayProducts START - products count: ${products?.length || 0}`);
    
    if (!productsContainer) {
        console.error(`❌ [${callId}] Products container not found`);
        return;
    }

    if (!products || products.length === 0) {
        console.log(`📭 [${callId}] No products to display`);
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

    console.log(`🏗️ [${callId}] Building HTML for ${products.length} products...`);
    let html = '';
    products.forEach((product, index) => {
        html += createProductCard(product);
    });
    
    // Update DOM once instead of multiple times
    console.log(`💾 [${callId}] Updating DOM with ${products.length} products...`);
    productsContainer.innerHTML = html;
    
    // Initialize buttons after DOM update
    setTimeout(() => {
        console.log(`🔧 [${callId}] Initializing favorite buttons...`);
        initializeFavoriteButtons();
    }, 100);
    
    console.log(`✅ [${callId}] displayProducts END`);
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
    if (filters?.categoria_id) activeFilters.push('categoría');
    if (filters?.precio_min || filters?.precio_max) activeFilters.push('precio');
    if (filters?.estado) activeFilters.push('estado');
    if (filters?.q) activeFilters.push('búsqueda');
    
    if (activeFilters.length > 0) {
        infoText += ` (filtros: ${activeFilters.join(', ')})`;
    }
    
    resultsInfo.textContent = infoText;
}

// Create HTML for a single product card
function createProductCard(product) {
    // Use a data URL for placeholder instead of file path to prevent 404 errors
    const placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZjNzU3ZCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlbiBubyBkaXNwb25pYmxlPC90ZXh0Pjwvc3ZnPg==';
    
    const imageUrl = product.imagenes && product.imagenes.length > 0 
        ? product.imagenes[0] 
        : placeholderImage;
    
    const estadoBadgeClass = getEstadoBadgeClass(product.estado);
    const isLoggedIn = window.currentUser ? true : false;
    
    return `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card product-card h-100 shadow-sm">
                <div class="position-relative">
                    <img src="${imageUrl}" 
                         class="card-img-top product-image" 
                         alt="${product.titulo}"
                         style="height: 250px; object-fit: cover;"
                         onerror="this.src='${placeholderImage}'">
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
        const response = await window.apiCall('/categorias');
        
        if (response.exito && categorySelect) {
            let options = '<option value="">Todas las categorías</option>';
            response.data.categorias.forEach(categoria => {
                options += `<option value="${categoria.categoria_id}">${categoria.nombre}</option>`;
            });
            categorySelect.innerHTML = options;
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Event Handlers (ALL DEBOUNCED)
function handleSearch(event) {
    const searchTerm = event.target.value.trim();
    const filters = { ...currentFilters };
    
    if (searchTerm) {
        filters.q = searchTerm;
    } else {
        delete filters.q;
    }
    
    if (debouncedLoadProducts) {
        debouncedLoadProducts(1, filters);
    } else {
        loadProducts(1, filters);
    }
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
    
    if (debouncedLoadProducts) {
        debouncedLoadProducts(1, filters);
    } else {
        loadProducts(1, filters);
    }
}

function handleCategoryChange(event) {
    const categoryId = event.target.value;
    const filters = { ...currentFilters };
    
    if (categoryId) {
        filters.categoria_id = categoryId;
    } else {
        delete filters.categoria_id;
    }
    
    if (debouncedLoadProducts) {
        debouncedLoadProducts(1, filters);
    } else {
        loadProducts(1, filters);
    }
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
    
    if (debouncedLoadProducts) {
        debouncedLoadProducts(1, filters);
    } else {
        loadProducts(1, filters);
    }
}

function clearFilters() {
    // Clear form inputs
    if (filtersForm) filtersForm.reset();
    if (sortSelect) sortSelect.value = '';
    
    // Clear filters and reload
    currentFilters = {};
    if (debouncedLoadProducts) {
        debouncedLoadProducts(1, {});
    } else {
        loadProducts(1, {});
    }
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
    if (debouncedLoadProducts) {
        debouncedLoadProducts(page, currentFilters);
    } else {
        loadProducts(page, currentFilters);
    }
}

function initializeFavoriteButtons() {
    // Remove existing event listeners to prevent duplicates
    document.querySelectorAll('.favorite-btn').forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
    });
    
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
    });
    
    // Add event listeners for favorite buttons (DEBOUNCED)
    document.querySelectorAll('.favorite-btn').forEach(btn => {
        btn.addEventListener('click', window.debounce(toggleFavorite, 300));
    });
    
    // Add event listeners for add to cart buttons (DEBOUNCED)
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', window.debounce(function() {
            const productId = this.getAttribute('data-product-id');
            addToCart(productId);
        }, 300));
    });
}

async function toggleFavorite(event) {
    if (!window.currentUser) {
        window.showAlert('warning', 'Debes iniciar sesión para agregar favoritos');
        return;
    }
    
    const productId = event.currentTarget.getAttribute('data-product-id');
    
    try {
        const response = await window.apiCall('/favoritos', {
            method: 'POST',
            body: JSON.stringify({ producto_id: productId })
        });
        
        if (response.exito) {
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
            window.showAlert('danger', response.mensaje || 'Error al agregar a favoritos');
        }
    } catch (error) {
        console.error('Error toggling favorite:', error);
        window.showAlert('danger', 'Error al agregar a favoritos');
    }
}

async function addToCart(productId) {
    if (!window.currentUser) {
        window.showAlert('warning', 'Debes iniciar sesión para agregar al carrito');
        return;
    }

    try {
        const response = await window.apiCall('/carrito/items', {
            method: 'POST',
            body: JSON.stringify({ 
                producto_id: productId,
                cantidad: 1
            })
        });
        
        if (response.exito) {
            window.showAlert('success', 'Producto agregado al carrito');
            // Update cart count if function exists
            if (typeof window.updateCartCount === 'function') {
                window.updateCartCount();
            }
        } else {
            window.showAlert('danger', response.mensaje || 'Error al agregar al carrito');
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        window.showAlert('danger', 'Error al agregar al carrito');
    }
}

function showLoading() {
    if (loadingIndicator) {
        loadingIndicator.style.display = 'block';
    }
}

function hideLoading() {
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
}

function showError(message) {
    window.showAlert('danger', message);
}

function showSuccess(message) {
    window.showAlert('success', message);
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