// Social/Comunidad JavaScript for ElBaul
// Centralized External Script Initialization Pattern

console.log('🚀 social.js file loaded');

// Global variables for social functionality (avoid conflicts with common.js)
let socialCurrentPage = 1;
let socialIsLoading = false;
let socialCurrentUser = null;
let currentSort = 'recientes';
let currentTag = null;
let userStats = null;

// Initialize social functionality when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 Social.js DOMContentLoaded - checking for social/comunidad page...');
    
    // Get current user from window variables
    socialCurrentUser = window.currentUser || window.user || null;
    
    // Check if we're on the social/comunidad page
    const feedContainer = document.getElementById('feed-container');
    const activityContainer = document.getElementById('activity-container');
    
    console.log('📍 Page elements found:', {
        feedContainer: !!feedContainer,
        activityContainer: !!activityContainer,
        currentPage: window.location.pathname,
        currentUser: socialCurrentUser?.nombre
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
    loadUserStats();
    loadPopularTags();
    
    // Setup sort buttons
    setupSortButtons();
    
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

// ========================================
// FEED FUNCTIONALITY
// ========================================

// Load social feed
async function loadFeed(page = 1, append = false) {
    if (socialIsLoading) {
        console.log('⏸️ Feed already loading, skipping...');
        return;
    }
    
    try {
        socialIsLoading = true;
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
        
        // Build query parameters
        const params = new URLSearchParams({
            page: page,
            limit: 10,
            sort: currentSort
        });
        
        if (currentTag) {
            params.append('tag', currentTag);
        }
        
        console.log('🔗 Making API call with params:', params.toString());
        
        const response = await window.apiCall(`/publicaciones?${params.toString()}`);
        console.log('📦 Raw API response:', response);
        
        if (response && response.exito) {
            console.log('✅ Response is successful');
            
            if (response.data && response.data.publicaciones) {
                const posts = response.data.publicaciones;
                console.log(`📚 Posts received: ${posts.length}`);
                
                if (posts.length > 0) {
                    const postsHtml = posts.map(post => createPostHTML(post)).join('');
                    
                    if (append) {
                        feedContainer.innerHTML += postsHtml;
                    } else {
                        feedContainer.innerHTML = postsHtml;
                    }
                    
                    socialCurrentPage = page;
                    console.log('✅ Feed loaded successfully');
                } else if (!append) {
                    const emptyMessage = currentTag 
                        ? `No hay publicaciones con el tag #${currentTag}`
                        : 'No hay publicaciones aún';
                    
                    feedContainer.innerHTML = `
                        <div class="text-center py-5">
                            <i class="fas fa-comments fa-3x text-muted mb-3"></i>
                            <h5 class="text-muted">${emptyMessage}</h5>
                            <p class="text-muted">¡Sé el primero en compartir algo!</p>
                            ${currentTag ? `<button class="btn btn-outline-primary" onclick="clearTagFilter()">Ver todas las publicaciones</button>` : ''}
                        </div>
                    `;
                    console.log('📭 No posts found');
                }
            } else {
                console.error('❌ No publicaciones in response data:', response.data);
                throw new Error('No se encontraron publicaciones en la respuesta');
            }
        } else {
            console.error('❌ API response not successful:', response);
            throw new Error(response?.mensaje || 'Error en la respuesta de la API');
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
        socialIsLoading = false;
    }
}

// Setup sort buttons
function setupSortButtons() {
    const sortButtons = document.querySelectorAll('.sort-btn');
    sortButtons.forEach(button => {
        button.addEventListener('click', function() {
            const newSort = this.dataset.sort;
            if (newSort !== currentSort) {
                currentSort = newSort;
                socialCurrentPage = 1;
                
                // Update button states
                sortButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                // Reload feed
                loadFeed(1, false);
            }
        });
    });
}

// Filter by tag
function filterByTag(tag) {
    currentTag = tag;
    socialCurrentPage = 1;
    loadFeed(1, false);
    
    // Update UI to show active filter
    updateTagFilterUI(tag);
}

// Clear tag filter
function clearTagFilter() {
    currentTag = null;
    socialCurrentPage = 1;
    loadFeed(1, false);
    updateTagFilterUI(null);
}

// Update tag filter UI
function updateTagFilterUI(tag) {
    const feedHeader = document.querySelector('.feed-header');
    if (feedHeader) {
        const existingFilter = feedHeader.querySelector('.active-filter');
        if (existingFilter) {
            existingFilter.remove();
        }
        
        if (tag) {
            const filterElement = document.createElement('div');
            filterElement.className = 'active-filter alert alert-info d-flex justify-content-between align-items-center mt-2';
            filterElement.innerHTML = `
                <span><i class="fas fa-filter me-2"></i>Filtrando por: #${tag}</span>
                <button class="btn btn-sm btn-outline-info" onclick="clearTagFilter()">
                    <i class="fas fa-times"></i>
                </button>
            `;
            feedHeader.appendChild(filterElement);
        }
    }
}

// ========================================
// POST CREATION WITH ENHANCED FEATURES
// ========================================

// Create new post with image URL and product tagging
async function createPost(contenido, imageUrl = '', producto_id = null) {
    try {
        console.log('📝 Creating new post...');
        
        const postData = { contenido };
        
        // Add image if provided
        if (imageUrl.trim()) {
            postData.imagenes = [imageUrl.trim()];
        }
        
        // Add product if provided
        if (producto_id) {
            postData.producto_id = producto_id;
        }
        
        const response = await window.apiCall('/publicaciones', {
            method: 'POST',
            body: JSON.stringify(postData)
        });
        
        if (response.exito) {
            console.log('✅ Post created successfully');
            window.showAlert('success', 'Publicación creada exitosamente');
            loadFeed(); // Reload feed
            loadUserStats(); // Update user stats
            return response.data;
        } else {
            throw new Error(response.mensaje || 'Error al crear publicación');
        }
        
    } catch (error) {
        console.error('❌ Error creating post:', error);
        window.showAlert('danger', error.message || 'Error al crear publicación');
        throw error;
    }
}

// Setup enhanced create post form
function setupCreatePostForm() {
    console.log('📝 Setting up enhanced create post form...');
    
    const form = document.getElementById('create-post-form');
    if (!form) return;
    
    // Add image URL input and product selector
    const enhancedFormHTML = `
        <div class="mb-3">
            <textarea class="form-control" id="post-content" rows="3" 
                      placeholder="¿Qué quieres compartir con la comunidad? Usa #hashtags para categorizar tu publicación"
                      maxlength="2000"></textarea>
            <div class="form-text">Máximo 2000 caracteres. Usa #hashtags y menciona productos con su código (ej: PR300001)</div>
        </div>
        
        <div class="collapse" id="advancedOptions">
            <div class="row mb-3">
                <div class="col-md-6">
                    <label for="image-url" class="form-label">URL de Imagen (opcional)</label>
                    <input type="url" class="form-control" id="image-url" placeholder="https://ejemplo.com/imagen.jpg">
                </div>
                <div class="col-md-6">
                    <label for="product-id" class="form-label">Código de Producto (opcional)</label>
                    <input type="text" class="form-control" id="product-id" placeholder="PR300001" pattern="PR[0-9]{6}">
                    <div class="form-text">Ejemplo: PR300001</div>
                </div>
            </div>
        </div>
        
        <div class="d-flex justify-content-between align-items-center">
            <div class="btn-group" role="group">
                <button type="button" class="btn btn-outline-secondary btn-sm" data-bs-toggle="collapse" data-bs-target="#advancedOptions">
                    <i class="fas fa-cog me-1"></i>Opciones
                </button>
                <button type="button" class="btn btn-outline-secondary btn-sm" onclick="insertHashtag()">
                    <i class="fas fa-hashtag me-1"></i>Tag
                </button>
            </div>
            <button type="submit" class="btn btn-primary">
                <i class="fas fa-paper-plane me-1"></i>Publicar
            </button>
        </div>
    `;
    
    // Update form content
    const cardBody = form.closest('.card-body');
    if (cardBody) {
        cardBody.innerHTML = `<form id="create-post-form">${enhancedFormHTML}</form>`;
        
        // Re-attach event listener to new form
        const newForm = document.getElementById('create-post-form');
        newForm.addEventListener('submit', handleCreatePostSubmit);
    }
}

// Handle create post form submission
async function handleCreatePostSubmit(e) {
    e.preventDefault();
    
    const contenido = document.getElementById('post-content').value.trim();
    const imageUrl = document.getElementById('image-url')?.value.trim() || '';
    const productId = document.getElementById('product-id')?.value.trim() || '';
    
    if (!contenido) {
        window.showAlert('warning', 'Por favor escribe algo para publicar');
        return;
    }
    
    // Validate product ID format if provided
    if (productId && !/^PR\d{6}$/.test(productId)) {
        window.showAlert('warning', 'El código de producto debe tener el formato PR300001');
        return;
    }
    
    // Disable submit button
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Publicando...';
    submitBtn.disabled = true;
    
    try {
        await createPost(contenido, imageUrl, productId || null);
        
        // Clear form
        document.getElementById('post-content').value = '';
        if (document.getElementById('image-url')) document.getElementById('image-url').value = '';
        if (document.getElementById('product-id')) document.getElementById('product-id').value = '';
        
        // Collapse advanced options
        const advancedOptions = document.getElementById('advancedOptions');
        if (advancedOptions && advancedOptions.classList.contains('show')) {
            bootstrap.Collapse.getInstance(advancedOptions).hide();
        }
        
    } catch (error) {
        console.error('Error creating post:', error);
    } finally {
        // Re-enable submit button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Insert hashtag helper
function insertHashtag() {
    const textarea = document.getElementById('post-content');
    if (textarea) {
        const hashtag = prompt('Ingresa el hashtag (sin #):');
        if (hashtag && hashtag.trim()) {
            const cleanTag = hashtag.trim().replace(/[^a-zA-Z0-9_]/g, '');
            if (cleanTag) {
                const currentPos = textarea.selectionStart;
                const textBefore = textarea.value.substring(0, currentPos);
                const textAfter = textarea.value.substring(currentPos);
                
                textarea.value = textBefore + `#${cleanTag} ` + textAfter;
                textarea.focus();
                textarea.setSelectionRange(currentPos + cleanTag.length + 2, currentPos + cleanTag.length + 2);
            }
        }
    }
}

// ========================================
// USER STATISTICS
// ========================================

// Load user statistics
async function loadUserStats() {
    if (!socialCurrentUser) return;
    
    try {
        console.log('📊 Loading user stats...');
        
        const response = await window.apiCall(`/publicaciones/usuario/${socialCurrentUser.usuario_id}/estadisticas`);
        
        if (response.exito) {
            userStats = response.data;
            updateUserStatsUI();
        }
        
    } catch (error) {
        console.error('❌ Error loading user stats:', error);
    }
}

// Update user stats in UI
function updateUserStatsUI() {
    if (!userStats) return;
    
    // Update posts count
    const postsElement = document.querySelector('.user-posts-count');
    if (postsElement) {
        postsElement.textContent = userStats.total_posts;
    }
    
    // Update likes count
    const likesElement = document.querySelector('.user-likes-count');
    if (likesElement) {
        likesElement.textContent = userStats.total_likes;
    }
    
    // Update member since
    const memberSinceElement = document.querySelector('.member-since');
    if (memberSinceElement && userStats.miembro_desde) {
        const year = new Date(userStats.miembro_desde).getFullYear();
        memberSinceElement.textContent = `Miembro desde ${year}`;
    }
}

// ========================================
// POPULAR TAGS
// ========================================

// Load popular tags
async function loadPopularTags() {
    try {
        console.log('🏷️ Loading popular tags...');
        
        const response = await window.apiCall('/publicaciones/tags/populares?limit=15');
        
        if (response.exito) {
            updatePopularTagsUI(response.data.tags);
        }
        
    } catch (error) {
        console.error('❌ Error loading popular tags:', error);
    }
}

// Update popular tags in UI
function updatePopularTagsUI(tags) {
    const tagsContainer = document.querySelector('.trending-topics .list-group');
    if (!tagsContainer || !tags.length) return;
    
    const tagsHTML = tags.map(tag => `
        <a href="#" class="list-group-item list-group-item-action border-0 px-0" onclick="filterByTag('${tag.tag}')">
            <div class="d-flex w-100 justify-content-between">
                <span>#${tag.tag}</span>
                <small class="text-muted">${tag.count} posts</small>
            </div>
        </a>
    `).join('');
    
    tagsContainer.innerHTML = tagsHTML;
}

// ========================================
// ENHANCED POST HTML WITH TAGS
// ========================================

// Create HTML for a single post with enhanced features
function createPostHTML(post) {
    const usuario = post.usuario || {};
    const fechaPost = post.fecha_creacion || post.fecha || post.createdAt || post.created_at;
    const fechaRelativa = formatRelativeTime(fechaPost);
    const postId = post.post_id || post.publicacion_id || post._id;
    
    // Check if current user owns this post
    const isOwner = socialCurrentUser && (socialCurrentUser.usuario_id === post.usuario_id);
    
    // Process content to make hashtags clickable
    let processedContent = post.contenido;
    if (post.tags && post.tags.length > 0) {
        post.tags.forEach(tag => {
            const tagRegex = new RegExp(`#${tag}`, 'gi');
            processedContent = processedContent.replace(tagRegex, `<a href="#" class="tag-link" onclick="filterByTag('${tag}')">#${tag}</a>`);
        });
    }
    
    return `
        <div class="card mb-4" data-post-id="${postId}">
            <div class="card-body">
                <!-- Post Header -->
                <div class="d-flex align-items-center mb-3">
                    <img src="${usuario.avatar || '/img/default-avatar.png'}" 
                         class="rounded-circle me-3" style="width: 40px; height: 40px; object-fit: cover;">
                    <div class="flex-grow-1">
                        <h6 class="mb-0">${usuario.nombre || 'Usuario'} ${usuario.apellido || ''}</h6>
                        <small class="text-muted">${fechaRelativa}</small>
                    </div>
                    <div class="dropdown">
                        <button class="btn btn-sm btn-link text-muted" data-bs-toggle="dropdown">
                            <i class="fas fa-ellipsis-h"></i>
                        </button>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item" href="#" onclick="showPostDetail('${postId}')">Ver detalle</a></li>
                            ${isOwner ? `
                                <li><a class="dropdown-item" href="#" onclick="editPostModal('${postId}')">Editar</a></li>
                                <li><a class="dropdown-item text-danger" href="#" onclick="deletePost('${postId}')">Eliminar</a></li>
                            ` : `
                                <li><a class="dropdown-item" href="#" onclick="reportPost('${postId}')">Reportar</a></li>
                            `}
                        </ul>
                    </div>
                </div>
                
                <!-- Post Content with clickable hashtags -->
                <div class="post-content">
                    <p class="card-text">${processedContent}</p>
                </div>
                
                <!-- Post Tags -->
                ${post.tags && post.tags.length > 0 ? `
                    <div class="post-tags mb-3">
                        ${post.tags.map(tag => `
                            <span class="badge bg-primary me-1 tag-badge" onclick="filterByTag('${tag}')" style="cursor: pointer;">#${tag}</span>
                        `).join('')}
                    </div>
                ` : ''}
                
                <!-- Post Images -->
                ${post.imagenes && post.imagenes.length > 0 ? `
                    <div class="post-images mb-3">
                        ${post.imagenes.map(img => `
                            <img src="${img}" class="img-fluid rounded mb-2" alt="Imagen de publicación" 
                                 style="max-height: 300px; cursor: pointer;" 
                                 onclick="showImageModal('${img}')"
                                 onerror="this.style.display='none';">
                        `).join('')}
                    </div>
                ` : ''}
                
                <!-- Related Product -->
                ${post.producto && post.producto.titulo ? `
                    <div class="card mt-3 product-card">
                        <div class="card-body p-3">
                            <div class="row align-items-center">
                                <div class="col-auto">
                                    <img src="${post.producto.imagenes?.[0] || '/img/placeholder.jpg'}" 
                                         class="rounded" style="width: 60px; height: 60px; object-fit: cover;"
                                         onerror="this.src='/img/placeholder.jpg';">
                                </div>
                                <div class="col">
                                    <h6 class="mb-1">${post.producto.titulo}</h6>
                                    <span class="text-success h6">S/ ${post.producto.precio}</span>
                                    <span class="badge bg-secondary ms-2">${post.producto.estado || 'Usado'}</span>
                                    <br>
                                    <small class="text-muted">Código: ${post.producto_id}</small>
                                </div>
                                <div class="col-auto">
                                    <a href="/productos/${post.producto_id}" class="btn btn-sm btn-outline-primary">Ver Producto</a>
                                </div>
                            </div>
                        </div>
                    </div>
                ` : ''}
                
                <!-- Post Actions -->
                <div class="d-flex justify-content-between align-items-center mt-3">
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-primary like-btn" onclick="toggleLike('${postId}')">
                            <i class="fas fa-thumbs-up me-1"></i>${post.likes || 0}
                        </button>
                        <button class="btn btn-sm btn-outline-info comment-btn" onclick="toggleComments('${postId}')">
                            <i class="fas fa-comment me-1"></i>${post.comentarios_count || 0}
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" onclick="sharePost('${postId}')">
                            <i class="fas fa-share me-1"></i>Compartir
                        </button>
                    </div>
                </div>
                
                <!-- Comments Section (initially hidden) -->
                <div class="comments-section mt-3" id="comments-${postId}" style="display: none;">
                    <div class="border-top pt-3">
                        <!-- Comment Form -->
                        ${socialCurrentUser ? `
                            <form class="comment-form mb-3" onsubmit="submitComment(event, '${postId}')">
                                <div class="input-group">
                                    <input type="text" class="form-control" placeholder="Escribe un comentario..." required>
                                    <button type="submit" class="btn btn-primary">
                                        <i class="fas fa-paper-plane"></i>
                                    </button>
                                </div>
                            </form>
                        ` : ''}
                        
                        <!-- Comments List -->
                        <div class="comments-list" id="comments-list-${postId}">
                            <div class="text-center">
                                <div class="spinner-border spinner-border-sm" role="status">
                                    <span class="visually-hidden">Cargando comentarios...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Continue with the rest of the existing functions...
// (toggleLike, createComment, etc. - same as before)

// Make all functions globally available
window.ElBaulSocial = {
    // Feed functions
    loadFeed,
    loadActivity,
    loadUserStats,
    loadPopularTags,
    
    // Post CRUD
    createPost,
    
    // Tag filtering
    filterByTag,
    clearTagFilter,
    
    // UI helpers
    insertHashtag,
    
    // Utilities
    formatRelativeTime
};

// Make individual functions available globally for onclick handlers
window.filterByTag = filterByTag;
window.clearTagFilter = clearTagFilter;
window.insertHashtag = insertHashtag;

console.log('🎯 Enhanced social.js initialization complete');


// ========================================
// REMAINING FUNCTIONS (ADD TO END OF FILE)
// ========================================

// Edit post
async function editPost(postId, contenido, imagenes = []) {
    try {
        console.log('✏️ Editing post:', postId);
        
        const response = await window.apiCall(`/publicaciones/${postId}`, {
            method: 'PUT',
            body: JSON.stringify({ contenido, imagenes })
        });
        
        if (response.exito) {
            console.log('✅ Post updated successfully');
            window.showAlert('success', 'Publicación actualizada exitosamente');
            loadFeed(); // Reload feed
            return response.data;
        } else {
            throw new Error(response.mensaje || 'Error al actualizar publicación');
        }
        
    } catch (error) {
        console.error('❌ Error editing post:', error);
        window.showAlert('danger', error.message || 'Error al actualizar publicación');
        throw error;
    }
}

// Delete post
async function deletePost(postId) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta publicación?')) {
        return;
    }
    
    try {
        console.log('🗑️ Deleting post:', postId);
        
        const response = await window.apiCall(`/publicaciones/${postId}`, {
            method: 'DELETE'
        });
        
        if (response.exito) {
            console.log('✅ Post deleted successfully');
            window.showAlert('success', 'Publicación eliminada exitosamente');
            loadFeed(); // Reload feed
            loadUserStats(); // Update user stats
        } else {
            throw new Error(response.mensaje || 'Error al eliminar publicación');
        }
        
    } catch (error) {
        console.error('❌ Error deleting post:', error);
        window.showAlert('danger', error.message || 'Error al eliminar publicación');
    }
}

// Toggle like on post
async function toggleLike(postId) {
    try {
        console.log('👍 Toggling like on post:', postId);
        
        const response = await window.apiCall(`/publicaciones/${postId}/reacciones`, {
            method: 'POST',
            body: JSON.stringify({ tipo: 'like' })
        });
        
        if (response.exito) {
            console.log('✅ Like toggled successfully');
            
            // Update the like count in the UI without full reload
            const postElement = document.querySelector(`[data-post-id="${postId}"]`);
            if (postElement) {
                const likeButton = postElement.querySelector('.like-btn');
                if (likeButton) {
                    // Get current count
                    const currentCountMatch = likeButton.textContent.match(/\d+/);
                    const currentCount = currentCountMatch ? parseInt(currentCountMatch[0]) : 0;
                    
                    // Determine if we added or removed like
                    const isLiked = response.data.reaccion !== null;
                    const newCount = isLiked ? currentCount + 1 : currentCount - 1;
                    
                    // Update button
                    likeButton.innerHTML = `<i class="fas fa-thumbs-up me-1"></i>${Math.max(0, newCount)}`;
                    
                    // Visual feedback
                    if (isLiked) {
                        likeButton.classList.remove('btn-outline-primary');
                        likeButton.classList.add('btn-primary');
                    } else {
                        likeButton.classList.remove('btn-primary');
                        likeButton.classList.add('btn-outline-primary');
                    }
                }
            }
            
            // Update user stats if it's current user's like
            if (socialCurrentUser) {
                loadUserStats();
            }
            
        } else {
            throw new Error(response.mensaje || 'Error al dar like');
        }
        
    } catch (error) {
        console.error('❌ Error toggling like:', error);
        window.showAlert('danger', error.message || 'Error al dar like');
    }
}

// Load comments for post
async function loadComments(postId) {
    try {
        console.log('💬 Loading comments for post:', postId);
        
        const response = await window.apiCall(`/publicaciones/${postId}/comentarios?page=1&limit=20`);
        
        if (response.exito) {
            return response.data.comentarios || [];
        } else {
            throw new Error(response.mensaje || 'Error al cargar comentarios');
        }
        
    } catch (error) {
        console.error('❌ Error loading comments:', error);
        return [];
    }
}

// Create comment
async function createComment(postId, contenido) {
    try {
        console.log('💬 Creating comment on post:', postId);
        
        const response = await window.apiCall(`/publicaciones/${postId}/comentarios`, {
            method: 'POST',
            body: JSON.stringify({ contenido })
        });
        
        if (response.exito) {
            console.log('✅ Comment created successfully');
            window.showAlert('success', 'Comentario agregado exitosamente');
            
            // Update comment count in UI
            const postElement = document.querySelector(`[data-post-id="${postId}"]`);
            if (postElement) {
                const commentButton = postElement.querySelector('.comment-btn');
                if (commentButton) {
                    const currentCountMatch = commentButton.textContent.match(/\d+/);
                    const currentCount = currentCountMatch ? parseInt(currentCountMatch[0]) : 0;
                    commentButton.innerHTML = `<i class="fas fa-comment me-1"></i>${currentCount + 1}`;
                }
            }
            
            return response.data;
        } else {
            throw new Error(response.mensaje || 'Error al agregar comentario');
        }
        
    } catch (error) {
        console.error('❌ Error creating comment:', error);
        window.showAlert('danger', error.message || 'Error al agregar comentario');
        throw error;
    }
}

// Toggle comments section
async function toggleComments(postId) {
    const commentsSection = document.getElementById(`comments-${postId}`);
    const commentsList = document.getElementById(`comments-list-${postId}`);
    
    if (commentsSection.style.display === 'none') {
        commentsSection.style.display = 'block';
        
        // Load comments
        const comments = await loadComments(postId);
        
        if (comments.length > 0) {
            commentsList.innerHTML = comments.map(comment => createCommentHTML(comment)).join('');
        } else {
            commentsList.innerHTML = '<p class="text-muted text-center">No hay comentarios aún</p>';
        }
    } else {
        commentsSection.style.display = 'none';
    }
}

// Create HTML for a single comment
function createCommentHTML(comment) {
    const usuario = comment.usuario || {};
    const fechaRelativa = formatRelativeTime(comment.fecha_creacion || comment.fecha);
    const isOwner = socialCurrentUser && (socialCurrentUser.usuario_id === comment.usuario_id);
    
    return `
        <div class="comment mb-3" data-comment-id="${comment.comentario_id}">
            <div class="d-flex">
                <img src="${usuario.avatar || '/img/default-avatar.png'}" 
                     class="rounded-circle me-2" style="width: 32px; height: 32px; object-fit: cover;">
                <div class="flex-grow-1">
                    <div class="bg-light rounded p-2">
                        <h6 class="mb-1">${usuario.nombre || 'Usuario'} ${usuario.apellido || ''}</h6>
                        <p class="mb-0">${comment.contenido}</p>
                    </div>
                    <div class="d-flex align-items-center mt-1">
                        <small class="text-muted">${fechaRelativa}</small>
                        ${isOwner ? `
                            <button class="btn btn-sm btn-link text-muted p-0 ms-2" onclick="editCommentModal('${comment.comentario_id}', '${comment.contenido}')">
                                Editar
                            </button>
                            <button class="btn btn-sm btn-link text-danger p-0 ms-1" onclick="deleteComment('${comment.comentario_id}')">
                                Eliminar
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Submit comment form
async function submitComment(event, postId) {
    event.preventDefault();
    
    const form = event.target;
    const input = form.querySelector('input[type="text"]');
    const contenido = input.value.trim();
    
    if (!contenido) return;
    
    try {
        await createComment(postId, contenido);
        input.value = '';
        
        // Refresh comments
        const commentsSection = document.getElementById(`comments-${postId}`);
        if (commentsSection.style.display === 'block') {
            await toggleComments(postId);
            await toggleComments(postId);
        }
        
    } catch (error) {
        console.error('Error submitting comment:', error);
    }
}

// Other utility functions
function editCommentModal(commentId, currentContent) {
    const newContent = prompt('Editar comentario:', currentContent);
    if (newContent && newContent.trim() !== currentContent) {
        // Implementation for edit comment
        window.showAlert('info', 'Función de editar comentario en desarrollo');
    }
}

function editPostModal(postId) {
    const postElement = document.querySelector(`[data-post-id="${postId}"]`);
    const currentContent = postElement.querySelector('.post-content p').textContent;
    
    const newContent = prompt('Editar publicación:', currentContent);
    if (newContent && newContent.trim() !== currentContent) {
        editPost(postId, newContent.trim());
    }
}

function deleteComment(commentId) {
    if (confirm('¿Eliminar comentario?')) {
        window.showAlert('info', 'Función de eliminar comentario en desarrollo');
    }
}

function sharePost(postId) {
    const url = `${window.location.origin}/publicaciones/${postId}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Publicación en ElBaul',
            url: url
        });
    } else {
        navigator.clipboard.writeText(url)
            .then(() => window.showAlert('success', 'Enlace copiado al portapapeles'))
            .catch(() => window.showAlert('info', `Enlace: ${url}`));
    }
}

function showPostDetail(postId) {
    window.location.href = `/publicaciones/${postId}`;
}

function showImageModal(imageUrl) {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body text-center">
                    <img src="${imageUrl}" class="img-fluid" alt="Imagen">
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
    
    modal.addEventListener('hidden.bs.modal', () => {
        document.body.removeChild(modal);
    });
}

function reportPost(postId) {
    window.showAlert('info', 'Funcionalidad de reportar en desarrollo');
}

async function loadActivity() {
    console.log('📊 Loading activity...');
    try {
        const activityContainer = document.getElementById('activity-container');
        if (!activityContainer) return;
        
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
                <div class="list-group-item">
                    <div class="d-flex w-100 justify-content-between">
                        <h6 class="mb-1">Usuario nuevo</h6>
                        <small>Hace 2 horas</small>
                    </div>
                    <p class="mb-1">María se unió a la comunidad</p>
                </div>
            </div>
        `;
        console.log('✅ Activity loaded');
        
    } catch (error) {
        console.error('❌ Error loading activity:', error);
    }
}

function setupInfiniteScroll() {
    console.log('🔄 Setting up infinite scroll...');
    
    window.addEventListener('scroll', () => {
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 1000) {
            if (!socialIsLoading && currentSort) {
                loadFeed(socialCurrentPage + 1, true);
            }
        }
    });
}

function formatRelativeTime(dateString) {
    try {
        if (!dateString) return 'Fecha no disponible';
        
        let date;
        if (typeof dateString === 'string') {
            const isoString = dateString.replace(' ', 'T') + 'Z';
            date = new Date(isoString);
        } else if (dateString instanceof Date) {
            date = dateString;
        } else if (typeof dateString === 'number') {
            date = new Date(dateString);
        } else {
            return 'Fecha inválida';
        }
        
        if (isNaN(date.getTime())) return 'Fecha inválida';
        
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const diffWeeks = Math.floor(diffDays / 7);
        const diffMonths = Math.floor(diffDays / 30);
        
        if (diffMinutes < 1) return 'Ahora mismo';
        else if (diffMinutes < 60) return `Hace ${diffMinutes} ${diffMinutes === 1 ? 'minuto' : 'minutos'}`;
        else if (diffHours < 24) return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
        else if (diffDays === 1) return 'Ayer';
        else if (diffDays < 7) return `Hace ${diffDays} días`;
        else if (diffWeeks < 4) return `Hace ${diffWeeks} ${diffWeeks === 1 ? 'semana' : 'semanas'}`;
        else if (diffMonths < 12) return `Hace ${diffMonths} ${diffMonths === 1 ? 'mes' : 'meses'}`;
        else {
            return date.toLocaleDateString('es-PE', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
        
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Fecha inválida';
    }
}

// Update the global exports
window.ElBaulSocial = {
    loadFeed,
    loadActivity,
    loadUserStats,
    loadPopularTags,
    createPost,
    editPost,
    deletePost,
    toggleLike,
    loadComments,
    createComment,
    toggleComments,
    submitComment,
    filterByTag,
    clearTagFilter,
    insertHashtag,
    sharePost,
    showPostDetail,
    showImageModal,
    reportPost,
    formatRelativeTime
};

// Global functions for onclick handlers
window.filterByTag = filterByTag;
window.clearTagFilter = clearTagFilter;
window.insertHashtag = insertHashtag;
window.toggleLike = toggleLike;
window.toggleComments = toggleComments;
window.submitComment = submitComment;
window.editPostModal = editPostModal;
window.editCommentModal = editCommentModal;
window.deletePost = deletePost;
window.deleteComment = deleteComment;
window.sharePost = sharePost;
window.showPostDetail = showPostDetail;
window.showImageModal = showImageModal;
window.reportPost = reportPost;

console.log('🎯 Complete enhanced social.js initialization finished');