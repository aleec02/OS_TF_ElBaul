// Product Comparison JavaScript for ElBaul
// Handles product comparison, search, and comparison table management

class ProductComparison {
    constructor() {
        this.products = [];
        this.maxProducts = 4; // Maximum products to compare
        this.isLoading = false;
        
        this.init();
    }

    async init() {
        console.log('Product Comparison initializing...');
        
        // Wait for common functions
        await this.waitForCommonFunctions();
        
        // Load comparison from localStorage
        this.loadComparisonFromStorage();
        
        // Initialize components
        this.initializeEventListeners();
        this.renderComparisonTable();
        this.loadRecommendations();
        
        console.log('Product Comparison initialized');
    }

    async waitForCommonFunctions() {
        return new Promise((resolve) => {
            const checkFunctions = () => {
                if (window.apiCall && window.showAlert && window.updateAuthUI) {
                    resolve();
                } else {
                    setTimeout(checkFunctions, 100);
                }
            };
            checkFunctions();
        });
    }

    initializeEventListeners() {
        // Clear comparison
        const clearComparisonBtn = document.getElementById('clearComparison');
        if (clearComparisonBtn) {
            clearComparisonBtn.addEventListener('click', () => this.clearComparison());
        }

        // Quick actions
        const addAllToCartBtn = document.getElementById('addAllToCart');
        if (addAllToCartBtn) {
            addAllToCartBtn.addEventListener('click', () => this.addAllToCart());
        }

        const addAllToFavoritesBtn = document.getElementById('addAllToFavorites');
        if (addAllToFavoritesBtn) {
            addAllToFavoritesBtn.addEventListener('click', () => this.addAllToFavorites());
        }

        const shareComparisonBtn = document.getElementById('shareComparison');
        if (shareComparisonBtn) {
            shareComparisonBtn.addEventListener('click', () => this.shareComparison());
        }

        const printComparisonBtn = document.getElementById('printComparison');
        if (printComparisonBtn) {
            printComparisonBtn.addEventListener('click', () => this.printComparison());
        }

        // Search functionality
        const searchBtn = document.getElementById('searchBtn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.searchProducts());
        }

        const searchInput = document.getElementById('searchProduct');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchProducts();
                }
            });
        }
    }

    loadComparisonFromStorage() {
        try {
            const stored = localStorage.getItem('productComparison');
            if (stored) {
                this.products = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error loading comparison from storage:', error);
            this.products = [];
        }
    }

    saveComparisonToStorage() {
        try {
            localStorage.setItem('productComparison', JSON.stringify(this.products));
        } catch (error) {
            console.error('Error saving comparison to storage:', error);
        }
    }

    async addProductToComparison(productId) {
        if (this.products.length >= this.maxProducts) {
            window.showAlert('warning', `Puedes comparar máximo ${this.maxProducts} productos`);
            return false;
        }

        if (this.products.some(p => p.producto_id === productId)) {
            window.showAlert('info', 'Este producto ya está en la comparación');
            return false;
        }

        try {
            const response = await window.apiCall(`/productos/${productId}`);
            
            if (response.exito) {
                this.products.push(response.data.producto);
                this.saveComparisonToStorage();
                this.renderComparisonTable();
                window.showAlert('success', 'Producto agregado a la comparación');
                return true;
            } else {
                throw new Error(response.mensaje);
            }
        } catch (error) {
            console.error('Error adding product to comparison:', error);
            window.showAlert('danger', 'Error agregando producto: ' + error.message);
            return false;
        }
    }

    removeProductFromComparison(productId) {
        this.products = this.products.filter(p => p.producto_id !== productId);
        this.saveComparisonToStorage();
        this.renderComparisonTable();
        window.showAlert('info', 'Producto removido de la comparación');
    }

    clearComparison() {
        if (this.products.length === 0) {
            window.showAlert('info', 'No hay productos para limpiar');
            return;
        }

        if (confirm('¿Estás seguro de que quieres limpiar toda la comparación?')) {
            this.products = [];
            this.saveComparisonToStorage();
            this.renderComparisonTable();
            window.showAlert('success', 'Comparación limpiada');
        }
    }

    renderComparisonTable() {
        const comparisonTable = document.getElementById('comparisonTable');
        if (!comparisonTable) return;

        if (this.products.length === 0) {
            comparisonTable.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-balance-scale fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">No hay productos para comparar</h5>
                    <p class="text-muted mb-4">Agrega productos para comenzar la comparación</p>
                    <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addProductModal">
                        <i class="fas fa-plus me-2"></i>Agregar Producto
                    </button>
                </div>
            `;
            return;
        }

        // Clone template
        const template = document.getElementById('comparisonTemplate');
        const clone = template.content.cloneNode(true);
        const table = clone.querySelector('table');

        // Add product columns
        this.products.forEach((product, index) => {
            this.addProductColumn(table, product, index);
        });

        // Add empty column for adding more products
        if (this.products.length < this.maxProducts) {
            this.addEmptyColumn(table);
        }

        comparisonTable.innerHTML = '';
        comparisonTable.appendChild(clone);

        // Add event listeners to new elements
        this.addComparisonEventListeners();
    }

    addProductColumn(table, product, index) {
        const headerRow = table.querySelector('thead tr');
        const tbody = table.querySelector('tbody');

        // Add header column
        const headerCell = headerRow.insertCell();
        headerCell.className = 'product-column';
        headerCell.style.width = '300px';
        headerCell.innerHTML = `
            <div class="text-center p-3">
                <div class="position-relative">
                    <img src="${product.imagen_principal || '/img/default-product.png'}" 
                         class="img-fluid rounded product-image" alt="${product.titulo}" style="max-height: 200px;">
                    <button class="btn btn-sm btn-outline-danger position-absolute top-0 end-0 m-2 remove-product" data-product-id="${product.producto_id}">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <h6 class="mt-3 product-title">${product.titulo}</h6>
                <p class="text-primary product-price mb-2">S/ ${product.precio.toFixed(2)}</p>
                <div class="product-rating mb-2">${this.generateRatingStars(product.calificacion_promedio || 0)}</div>
                <div class="d-grid gap-2">
                    <button class="btn btn-sm btn-primary add-to-cart-btn" data-product-id="${product.producto_id}">
                        <i class="fas fa-cart-plus me-1"></i>Agregar al Carrito
                    </button>
                    <button class="btn btn-sm btn-outline-warning add-to-favorites-btn" data-product-id="${product.producto_id}">
                        <i class="fas fa-heart me-1"></i>Favorito
                    </button>
                    <a href="/productos/${product.producto_id}" class="btn btn-sm btn-outline-info view-details-btn">
                        <i class="fas fa-eye me-1"></i>Ver Detalles
                    </a>
                </div>
            </div>
        `;

        // Add data rows
        const dataRows = tbody.querySelectorAll('tr');
        dataRows.forEach(row => {
            const cell = row.insertCell();
            const fieldName = this.getFieldNameFromRow(row);
            cell.innerHTML = this.getProductFieldValue(product, fieldName);
        });
    }

    addEmptyColumn(table) {
        const headerRow = table.querySelector('thead tr');
        const tbody = table.querySelector('tbody');

        // Add empty header
        const headerCell = headerRow.insertCell();
        headerCell.className = 'text-center align-middle';
        headerCell.style.width = '300px';
        headerCell.innerHTML = `
            <div class="p-3">
                <i class="fas fa-plus fa-3x text-muted mb-3"></i>
                <h6 class="text-muted">Agregar Producto</h6>
                <button class="btn btn-outline-primary" data-bs-toggle="modal" data-bs-target="#addProductModal">
                    <i class="fas fa-plus me-2"></i>Buscar Producto
                </button>
            </div>
        `;

        // Add empty data cells
        const dataRows = tbody.querySelectorAll('tr');
        dataRows.forEach(row => {
            const cell = row.insertCell();
            cell.className = 'text-center text-muted';
            cell.innerHTML = '<i class="fas fa-minus"></i>';
        });
    }

    getFieldNameFromRow(row) {
        const firstCell = row.querySelector('td, th');
        if (!firstCell) return '';

        const text = firstCell.textContent.trim();
        const fieldMap = {
            'Marca': 'marca',
            'Modelo': 'modelo',
            'Categoría': 'categoria',
            'Estado': 'estado',
            'Stock': 'stock_disponible',
            'Año de Fabricación': 'anio_fabricacion',
            'Garantía': 'garantia',
            'Dimensiones': 'dimensiones',
            'Peso': 'peso',
            'Color': 'color',
            'Características Principales': 'caracteristicas',
            'Incluye': 'incluye',
            'Precio Original': 'precio_original',
            'Precio Actual': 'precio',
            'Descuento': 'descuento',
            'Disponibilidad': 'disponibilidad',
            'Calificación Promedio': 'calificacion_promedio',
            'Número de Reseñas': 'numero_resenas',
            'Última Reseña': 'ultima_resena',
            'Vendedor': 'vendedor',
            'Calificación del Vendedor': 'calificacion_vendedor',
            'Ubicación': 'ubicacion'
        };

        return fieldMap[text] || '';
    }

    getProductFieldValue(product, fieldName) {
        switch (fieldName) {
            case 'marca':
                return product.marca || 'N/A';
            case 'modelo':
                return product.modelo || 'N/A';
            case 'categoria':
                return product.categoria?.nombre || 'N/A';
            case 'estado':
                return this.getEstadoBadge(product.estado);
            case 'stock_disponible':
                return this.getStockBadge(product.stock_disponible);
            case 'anio_fabricacion':
                return product.anio_fabricacion || 'N/A';
            case 'garantia':
                return product.garantia || 'Sin garantía';
            case 'dimensiones':
                return product.dimensiones || 'N/A';
            case 'peso':
                return product.peso ? `${product.peso} kg` : 'N/A';
            case 'color':
                return product.color || 'N/A';
            case 'caracteristicas':
                return this.formatFeatures(product.caracteristicas);
            case 'incluye':
                return this.formatFeatures(product.incluye);
            case 'precio_original':
                return product.precio_original ? `S/ ${product.precio_original.toFixed(2)}` : 'N/A';
            case 'precio':
                return `S/ ${product.precio.toFixed(2)}`;
            case 'descuento':
                return this.calculateDiscount(product);
            case 'disponibilidad':
                return this.getAvailabilityBadge(product.stock_disponible);
            case 'calificacion_promedio':
                return this.generateRatingStars(product.calificacion_promedio || 0);
            case 'numero_resenas':
                return product.numero_resenas || '0';
            case 'ultima_resena':
                return product.ultima_resena || 'Sin reseñas';
            case 'vendedor':
                return product.vendedor?.nombre || 'N/A';
            case 'calificacion_vendedor':
                return this.generateRatingStars(product.vendedor?.calificacion || 0);
            case 'ubicacion':
                return product.ubicacion || 'N/A';
            default:
                return 'N/A';
        }
    }

    getEstadoBadge(estado) {
        const estados = {
            'nuevo': '<span class="badge bg-success">Nuevo</span>',
            'como_nuevo': '<span class="badge bg-info">Como Nuevo</span>',
            'bueno': '<span class="badge bg-warning">Bueno</span>',
            'aceptable': '<span class="badge bg-secondary">Aceptable</span>',
            'usado': '<span class="badge bg-dark">Usado</span>'
        };
        return estados[estado] || '<span class="badge bg-secondary">N/A</span>';
    }

    getStockBadge(stock) {
        if (stock > 10) {
            return '<span class="badge bg-success">En Stock</span>';
        } else if (stock > 0) {
            return `<span class="badge bg-warning">Solo ${stock}</span>`;
        } else {
            return '<span class="badge bg-danger">Sin Stock</span>';
        }
    }

    getAvailabilityBadge(stock) {
        if (stock > 0) {
            return '<span class="badge bg-success">Disponible</span>';
        } else {
            return '<span class="badge bg-danger">No Disponible</span>';
        }
    }

    formatFeatures(features) {
        if (!features || features.length === 0) return 'N/A';
        
        if (Array.isArray(features)) {
            return features.map(f => `<span class="badge bg-light text-dark me-1">${f}</span>`).join('');
        }
        
        return features;
    }

    calculateDiscount(product) {
        if (!product.precio_original || product.precio_original <= product.precio) {
            return 'Sin descuento';
        }
        
        const discount = ((product.precio_original - product.precio) / product.precio_original * 100).toFixed(0);
        return `<span class="text-success">-${discount}%</span>`;
    }

    generateRatingStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        let stars = '';
        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star text-warning"></i>';
        }
        if (hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt text-warning"></i>';
        }
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star text-warning"></i>';
        }
        
        return `${stars} <small class="text-muted">(${rating.toFixed(1)})</small>`;
    }

    addComparisonEventListeners() {
        // Remove product buttons
        document.querySelectorAll('.remove-product').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.closest('button').dataset.productId;
                this.removeProductFromComparison(productId);
            });
        });

        // Add to cart buttons
        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.closest('button').dataset.productId;
                this.addToCart(productId);
            });
        });

        // Add to favorites buttons
        document.querySelectorAll('.add-to-favorites-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.closest('button').dataset.productId;
                this.addToFavorites(productId);
            });
        });
    }

    async searchProducts() {
        const searchInput = document.getElementById('searchProduct');
        const searchResults = document.getElementById('searchResults');
        const query = searchInput.value.trim();

        if (!query) {
            window.showAlert('warning', 'Por favor ingresa un término de búsqueda');
            return;
        }

        try {
            this.isLoading = true;
            searchResults.innerHTML = '<div class="col-12 text-center"><div class="spinner-border"></div></div>';

            const response = await window.apiCall(`/productos/buscar?q=${encodeURIComponent(query)}&limit=9`);
            
            if (response.exito) {
                this.renderSearchResults(response.data.productos);
            } else {
                throw new Error(response.mensaje);
            }
        } catch (error) {
            console.error('Error searching products:', error);
            searchResults.innerHTML = `
                <div class="col-12 text-center">
                    <p class="text-danger">Error en la búsqueda: ${error.message}</p>
                </div>
            `;
        } finally {
            this.isLoading = false;
        }
    }

    renderSearchResults(products) {
        const searchResults = document.getElementById('searchResults');
        const template = document.getElementById('productCardTemplate');

        if (products.length === 0) {
            searchResults.innerHTML = `
                <div class="col-12 text-center">
                    <i class="fas fa-search fa-3x text-muted mb-3"></i>
                    <p class="text-muted">No se encontraron productos</p>
                </div>
            `;
            return;
        }

        searchResults.innerHTML = '';
        
        products.forEach(product => {
            const clone = template.content.cloneNode(true);
            
            clone.querySelector('.product-image').src = product.imagen_principal || '/img/default-product.png';
            clone.querySelector('.product-image').alt = product.titulo;
            clone.querySelector('.product-title').textContent = product.titulo;
            clone.querySelector('.product-price').textContent = `S/ ${product.precio.toFixed(2)}`;
            clone.querySelector('.product-rating').innerHTML = this.generateRatingStars(product.calificacion_promedio || 0);
            clone.querySelector('.add-to-comparison-btn').dataset.productId = product.producto_id;
            
            searchResults.appendChild(clone);
        });

        // Add event listeners to new buttons
        searchResults.querySelectorAll('.add-to-comparison-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const productId = e.target.closest('button').dataset.productId;
                const success = await this.addProductToComparison(productId);
                if (success) {
                    // Close modal
                    const modal = bootstrap.Modal.getInstance(document.getElementById('addProductModal'));
                    modal.hide();
                }
            });
        });
    }

    async addToCart(productId) {
        try {
            const response = await window.apiCall('/carrito/agregar', {
                method: 'POST',
                body: JSON.stringify({
                    producto_id: productId,
                    cantidad: 1
                })
            });

            if (response.exito) {
                window.showAlert('success', 'Producto agregado al carrito');
            } else {
                throw new Error(response.mensaje);
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            window.showAlert('danger', 'Error agregando al carrito: ' + error.message);
        }
    }

    async addToFavorites(productId) {
        try {
            const response = await window.apiCall('/favoritos/agregar', {
                method: 'POST',
                body: JSON.stringify({
                    producto_id: productId
                })
            });

            if (response.exito) {
                window.showAlert('success', 'Producto agregado a favoritos');
            } else {
                throw new Error(response.mensaje);
            }
        } catch (error) {
            console.error('Error adding to favorites:', error);
            window.showAlert('danger', 'Error agregando a favoritos: ' + error.message);
        }
    }

    async addAllToCart() {
        if (this.products.length === 0) {
            window.showAlert('info', 'No hay productos para agregar');
            return;
        }

        try {
            for (const product of this.products) {
                await this.addToCart(product.producto_id);
            }
            window.showAlert('success', 'Todos los productos agregados al carrito');
        } catch (error) {
            console.error('Error adding all to cart:', error);
            window.showAlert('danger', 'Error agregando productos al carrito');
        }
    }

    async addAllToFavorites() {
        if (this.products.length === 0) {
            window.showAlert('info', 'No hay productos para agregar');
            return;
        }

        try {
            for (const product of this.products) {
                await this.addToFavorites(product.producto_id);
            }
            window.showAlert('success', 'Todos los productos agregados a favoritos');
        } catch (error) {
            console.error('Error adding all to favorites:', error);
            window.showAlert('danger', 'Error agregando productos a favoritos');
        }
    }

    shareComparison() {
        if (this.products.length === 0) {
            window.showAlert('info', 'No hay productos para compartir');
            return;
        }

        const productIds = this.products.map(p => p.producto_id).join(',');
        const url = `${window.location.origin}/productos/compare?products=${productIds}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Comparación de Productos - ElBaul',
                text: 'Mira esta comparación de productos en ElBaul',
                url: url
            });
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(url).then(() => {
                window.showAlert('success', 'Enlace copiado al portapapeles');
            }).catch(() => {
                window.showAlert('info', `Comparte este enlace: ${url}`);
            });
        }
    }

    printComparison() {
        if (this.products.length === 0) {
            window.showAlert('info', 'No hay productos para imprimir');
            return;
        }

        window.print();
    }

    async loadRecommendations() {
        if (this.products.length === 0) return;

        try {
            const productIds = this.products.map(p => p.producto_id);
            const response = await window.apiCall(`/productos/recomendaciones?productos=${productIds.join(',')}`);
            
            if (response.exito) {
                this.renderRecommendations(response.data.productos);
            }
        } catch (error) {
            console.error('Error loading recommendations:', error);
        }
    }

    renderRecommendations(products) {
        const recommendations = document.getElementById('recommendations');
        
        if (!products || products.length === 0) {
            recommendations.innerHTML = '<p class="text-muted text-center">No hay recomendaciones disponibles</p>';
            return;
        }

        const productsHtml = products.slice(0, 6).map(product => `
            <div class="col-md-4 col-lg-2 mb-3">
                <div class="card h-100">
                    <img src="${product.imagen_principal || '/img/default-product.png'}" 
                         class="card-img-top" alt="${product.titulo}" style="height: 120px; object-fit: cover;">
                    <div class="card-body p-2">
                        <h6 class="card-title small">${product.titulo}</h6>
                        <p class="card-text text-primary small">S/ ${product.precio.toFixed(2)}</p>
                        <button class="btn btn-sm btn-outline-primary w-100 add-to-comparison-recommendation" 
                                data-product-id="${product.producto_id}">
                            <i class="fas fa-plus me-1"></i>Comparar
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        recommendations.innerHTML = `
            <div class="row">
                ${productsHtml}
            </div>
        `;

        // Add event listeners
        recommendations.querySelectorAll('.add-to-comparison-recommendation').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const productId = e.target.closest('button').dataset.productId;
                await this.addProductToComparison(productId);
            });
        });
    }
}

// Initialize comparison when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.productComparison = new ProductComparison();
});

// Export for global access
window.ProductComparison = ProductComparison; 