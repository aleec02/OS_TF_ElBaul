// Social/Comunidad JavaScript for ElBaul
// Centralized External Script Initialization Pattern

console.log('🚀 social.js file loaded');

// Global variables for social functionality
let currentPage = 1;
let isLoading = false;

// Initialize social functionality when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 Social.js DOMContentLoaded - checking for social/comunidad page...');
    
    // Check if we're on the social/comunidad page
    const feedContainer = document.getElementById('feed-container');
    const activityContainer = document.getElementById('activity-container');
    
    console.log('📍 Page elements found:', {
        feedContainer: !!feedContainer,
        activityContainer: !!activityContainer,
        currentPage: window.location.pathname
    });
    
    if (feedContainer || activityContainer) {
        console.log('✅ Social page detected, initializing...');
        initializeSocialPage();
    } else {
        console.log('❌ Not on social page, skipping initialization');
    }
});

// Wait for common functions and initialize
async function initializeSocialPage() {
    console.log('🔄 initializeSocialPage called');
    
    // Wait for common functions to be ready
    await waitForCommonFunctions();
    
    console.log('🎉 Initializing social page...');
    
    // Load initial data
    loadFeed();
    loadActivity();
    
    // Setup infinite scroll if feed exists
    const feedContainer = document.getElementById('feed-container');
    if (feedContainer) {
        setupInfiniteScroll();
    }
    
    // Setup create post form if it exists
    const createPostForm = document.getElementById('create-post-form');
    if (createPostForm) {
        setupCreatePostForm();
    }
}

// Wait for common functions to be available
function waitForCommonFunctions() {
    return new Promise((resolve) => {
        const checkFunctions = () => {
            console.log('🔍 Checking for common functions:', {
                apiCall: typeof window.apiCall,
                showAlert: typeof window.showAlert,
                authToken: !!window.authToken
            });
            
            if (window.apiCall && window.showAlert) {
                console.log('✅ Common functions ready for social page');
                resolve();
            } else {
                console.log('⏳ Waiting for common functions...');
                setTimeout(checkFunctions, 100);
            }
        };
        checkFunctions();
    });
}

// Load social feed
async function loadFeed(page = 1, append = false) {
    if (isLoading) {
        console.log('⏸️ Feed already loading, skipping...');
        return;
    }
    
    try {
        isLoading = true;
        console.log(`📡 Loading feed page ${page}...`);
        
        const feedContainer = document.getElementById('feed-container');
        if (!feedContainer) {
            console.log('❌ Feed container not found');
            return;
        }
        
        // Show loading state
        if (!append) {
            feedContainer.innerHTML = `
                <div class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Cargando publicaciones...</span>
                    </div>
                    <p class="text-muted mt-2">Conectando con API...</p>
                </div>
            `;
        }
        
        console.log('🔗 Making API call to /publicaciones...');
        const response = await window.apiCall(`/publicaciones?page=${page}&limit=10`);
        console.log('📦 Feed response:', response);
        
        if (response.exito && response.data.publicaciones) {
            const posts = response.data.publicaciones;
            console.log(`📚 Posts received: ${posts.length}`);
            
            if (posts.length > 0) {
                const postsHtml = posts.map(post => createPostHTML(post)).join('');
                
                if (append) {
                    feedContainer.innerHTML += postsHtml;
                } else {
                    feedContainer.innerHTML = postsHtml;
                }
                
                currentPage = page;
                console.log('✅ Feed loaded successfully');
            } else if (!append) {
                feedContainer.innerHTML = `
                    <div class="text-center py-5">
                        <i class="fas fa-comments fa-3x text-muted mb-3"></i>
                        <h5 class="text-muted">No hay publicaciones aún</h5>
                        <p class="text-muted">¡Sé el primero en compartir algo!</p>
                    </div>
                `;
                console.log('📭 No posts found');
            }
        } else {
            throw new Error(response.mensaje || 'No se pudieron cargar las publicaciones');
        }
        
    } catch (error) {
        console.error('❌ Error loading feed:', error);
        const feedContainer = document.getElementById('feed-container');
        if (feedContainer) {
            feedContainer.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                    <h5 class="text-danger">Error al cargar publicaciones</h5>
                    <p class="text-muted">Error: ${error.message}</p>
                    <button onclick="window.ElBaulSocial.loadFeed()" class="btn btn-primary">
                        <i class="fas fa-redo me-2"></i>Reintentar
                    </button>
                </div>
            `;
        }
    } finally {
        isLoading = false;
    }
}

// Create HTML for a single post
function createPostHTML(post) {
    const usuario = post.usuario || {};
    const fechaRelativa = formatRelativeTime(post.fecha_creacion);
    
    return `
        <div class="card mb-4">
            <div class="card-body">
                <!-- Post Header -->
                <div class="d-flex align-items-center mb-3">
                    <img src="${usuario.avatar || '/img/default-avatar.png'}" 
                         class="rounded-circle me-3" style="width: 40px; height: 40px; object-fit: cover;">
                    <div class="flex-grow-1">
                        <h6 class="mb-0">${usuario.nombre || 'Usuario'} ${usuario.apellido || ''}</h6>
                        <small class="text-muted">${fechaRelativa}</small>
                    </div>
                </div>
                
                <!-- Post Content -->
                <p class="card-text">${post.contenido}</p>
                
                <!-- Post Actions -->
                <div class="d-flex justify-content-between align-items-center mt-3">
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-primary">
                            <i class="fas fa-thumbs-up me-1"></i>${post.total_reacciones?.like || 0}
                        </button>
                        <button class="btn btn-sm btn-outline-info">
                            <i class="fas fa-comment me-1"></i>${post.total_comentarios || 0}
                        </button>
                        <button class="btn btn-sm btn-outline-secondary">
                            <i class="fas fa-share me-1"></i>Compartir
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Load activity/recent activity
async function loadActivity() {
    console.log('📊 Loading activity...');
    try {
        const activityContainer = document.getElementById('activity-container');
        if (!activityContainer) return;
        
        // For now, show placeholder
        activityContainer.innerHTML = `
            <div class="list-group">
                <div class="list-group-item">
                    <div class="d-flex w-100 justify-content-between">
                        <h6 class="mb-1">Actividad reciente</h6>
                        <small>Hace 1 hora</small>
                    </div>
                    <p class="mb-1">Nuevos productos agregados en tu categoría favorita</p>
                    <small>Electrónicos</small>
                </div>
            </div>
        `;
        console.log('✅ Activity loaded');
        
    } catch (error) {
        console.error('❌ Error loading activity:', error);
    }
}

// Setup infinite scroll
function setupInfiniteScroll() {
    console.log('🔄 Setting up infinite scroll...');
}

// Setup create post form
function setupCreatePostForm() {
    console.log('📝 Setting up create post form...');
}

// Utility function for relative time
function formatRelativeTime(dateString) {
    if (window.formatDate) {
        return window.formatDate(dateString);
    }
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Hace 1 día';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.ceil(diffDays / 7)} semanas`;
    return date.toLocaleDateString('es-PE');
}

// Make functions globally available
window.ElBaulSocial = {
    loadFeed,
    loadActivity
};

console.log('🎯 social.js initialization complete');