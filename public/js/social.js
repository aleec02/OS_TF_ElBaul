// Social/Comunidad JavaScript for ElBaul
// Centralized External Script Initialization Pattern

console.log('🚀 social.js file loaded');

// Global variables for social functionality (avoid conflicts with common.js)
let socialCurrentPage = 1;
let socialIsLoading = false;
let socialCurrentUser = null;

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
// PUBLICACIONES CRUD
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
        
        console.log('🔗 Making API call to /publicaciones...');
        console.log('🌐 Full URL:', `${window.location.origin}/api/publicaciones?page=${page}&limit=10`);
        
        const response = await window.apiCall(`/publicaciones?page=${page}&limit=10`);
        console.log('📦 Raw API response:', response);
        
        if (response && response.exito) {
            console.log('✅ Response is successful');
            
            if (response.data && response.data.publicaciones) {
                const posts = response.data.publicaciones;
                console.log(`📚 Posts received: ${posts.length}`);
                console.log('📄 Sample post:', posts[0]);
                
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
                console.error('❌ No publicaciones in response data:', response.data);
                throw new Error('No se encontraron publicaciones en la respuesta');
            }
        } else {
            console.error('❌ API response not successful:', response);
            throw new Error(response?.mensaje || 'Error en la respuesta de la API');
        }
        
    } catch (error) {
        console.error('❌ Error loading feed:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack
        });
        
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
                    <br><br>
                    <details class="text-start">
                        <summary class="btn btn-sm btn-outline-secondary">Ver detalles técnicos</summary>
                        <pre class="mt-2 p-2 bg-light rounded text-small">${error.stack || error.message}</pre>
                    </details>
                </div>
            `;
        }
    } finally {
        socialIsLoading = false;
    }
}

// Create new post
async function createPost(contenido, imagenes = [], producto_id = null) {
    try {
        console.log('📝 Creating new post...');
        
        const postData = { contenido };
        if (imagenes.length > 0) postData.imagenes = imagenes;
        if (producto_id) postData.producto_id = producto_id;
        
        const response = await window.apiCall('/publicaciones', {
            method: 'POST',
            body: JSON.stringify(postData)
        });
        
        if (response.exito) {
            console.log('✅ Post created successfully');
            window.showAlert('success', 'Publicación creada exitosamente');
            loadFeed(); // Reload feed
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
        } else {
            throw new Error(response.mensaje || 'Error al eliminar publicación');
        }
        
    } catch (error) {
        console.error('❌ Error deleting post:', error);
        window.showAlert('danger', error.message || 'Error al eliminar publicación');
    }
}

// ========================================
// REACCIONES CRUD
// ========================================

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
            
        } else {
            throw new Error(response.mensaje || 'Error al dar like');
        }
        
    } catch (error) {
        console.error('❌ Error toggling like:', error);
        window.showAlert('danger', error.message || 'Error al dar like');
    }
}

// Get reactions for post
async function getReactions(postId) {
    try {
        console.log('📊 Getting reactions for post:', postId);
        
        const response = await window.apiCall(`/publicaciones/${postId}/reacciones`);
        
        if (response.exito) {
            return response.data;
        } else {
            throw new Error(response.mensaje || 'Error al obtener reacciones');
        }
        
    } catch (error) {
        console.error('❌ Error getting reactions:', error);
        return null;
    }
}

// ========================================
// COMENTARIOS CRUD
// ========================================

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

// Edit comment
async function editComment(commentId, contenido) {
    try {
        console.log('✏️ Editing comment:', commentId);
        
        const response = await window.apiCall(`/comentarios/${commentId}`, {
            method: 'PUT',
            body: JSON.stringify({ contenido })
        });
        
        if (response.exito) {
            console.log('✅ Comment updated successfully');
            window.showAlert('success', 'Comentario actualizado exitosamente');
            return response.data;
        } else {
            throw new Error(response.mensaje || 'Error al actualizar comentario');
        }
        
    } catch (error) {
        console.error('❌ Error editing comment:', error);
        window.showAlert('danger', error.message || 'Error al actualizar comentario');
        throw error;
    }
}

// Delete comment
async function deleteComment(commentId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este comentario?')) {
        return;
    }
    
    try {
        console.log('🗑️ Deleting comment:', commentId);
        
        const response = await window.apiCall(`/comentarios/${commentId}`, {
            method: 'DELETE'
        });
        
        if (response.exito) {
            console.log('✅ Comment deleted successfully');
            window.showAlert('success', 'Comentario eliminado exitosamente');
            
            // Remove comment from UI
            const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
            if (commentElement) {
                commentElement.remove();
            }
            
        } else {
            throw new Error(response.mensaje || 'Error al eliminar comentario');
        }
        
    } catch (error) {
        console.error('❌ Error deleting comment:', error);
        window.showAlert('danger', error.message || 'Error al eliminar comentario');
    }
}

// ========================================
// UI HELPERS
// ========================================

// Create HTML for a single post
function createPostHTML(post) {
    const usuario = post.usuario || {};
    const fechaPost = post.fecha_creacion || post.fecha || post.createdAt || post.created_at;
    const fechaRelativa = formatRelativeTime(fechaPost);
    const postId = post.post_id || post.publicacion_id || post._id;
    
    // Check if current user owns this post
    const isOwner = socialCurrentUser && (socialCurrentUser.usuario_id === post.usuario_id);
    
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
                
                <!-- Post Content -->
                <div class="post-content">
                    <p class="card-text">${post.contenido}</p>
                </div>
                
                <!-- Post Images -->
                ${post.imagenes && post.imagenes.length > 0 ? `
                    <div class="post-images mb-3">
                        ${post.imagenes.map(img => `
                            <img src="${img}" class="img-fluid rounded mb-2" alt="Imagen de publicación" 
                                 style="max-height: 300px; cursor: pointer;" 
                                 onclick="showImageModal('${img}')">
                        `).join('')}
                    </div>
                ` : ''}
                
                <!-- Related Product -->
                ${post.producto && post.producto.titulo ? `
                    <div class="card mt-3">
                        <div class="card-body p-3">
                            <div class="row align-items-center">
                                <div class="col-auto">
                                    <img src="${post.producto.imagenes?.[0] || '/img/placeholder.jpg'}" 
                                         class="rounded" style="width: 60px; height: 60px; object-fit: cover;">
                                </div>
                                <div class="col">
                                    <h6 class="mb-1">${post.producto.titulo}</h6>
                                    <span class="text-success h6">S/ ${post.producto.precio}</span>
                                    <span class="badge bg-secondary ms-2">${post.producto.estado || 'Usado'}</span>
                                </div>
                                <div class="col-auto">
                                    <a href="/productos/${post.producto_id}" class="btn btn-sm btn-outline-primary">Ver</a>
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

// Edit comment modal
function editCommentModal(commentId, currentContent) {
    const newContent = prompt('Editar comentario:', currentContent);
    if (newContent && newContent.trim() !== currentContent) {
        editComment(commentId, newContent.trim()).then(() => {
            // Update comment in UI
            const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
            if (commentElement) {
                const contentElement = commentElement.querySelector('p');
                if (contentElement) {
                    contentElement.textContent = newContent.trim();
                }
            }
        });
    }
}

// Edit post modal
function editPostModal(postId) {
    const postElement = document.querySelector(`[data-post-id="${postId}"]`);
    const currentContent = postElement.querySelector('.post-content p').textContent;
    
    const newContent = prompt('Editar publicación:', currentContent);
    if (newContent && newContent.trim() !== currentContent) {
        editPost(postId, newContent.trim()).then(() => {
            // Update post in UI
            const contentElement = postElement.querySelector('.post-content p');
            if (contentElement) {
                contentElement.textContent = newContent.trim();
            }
        });
    }
}

// Setup create post form
function setupCreatePostForm() {
    console.log('📝 Setting up create post form...');
    
    const form = document.getElementById('create-post-form');
    if (!form) return;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const contenido = document.getElementById('post-content').value.trim();
        if (!contenido) {
            window.showAlert('warning', 'Por favor escribe algo para publicar');
            return;
        }
        
        // Disable submit button
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Publicando...';
        submitBtn.disabled = true;
        
        try {
            await createPost(contenido);
            document.getElementById('post-content').value = '';
        } catch (error) {
            console.error('Error creating post:', error);
        } finally {
            // Re-enable submit button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

// Share post function
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

// Show post detail
function showPostDetail(postId) {
    window.location.href = `/publicaciones/${postId}`;
}

// Show image modal
function showImageModal(imageUrl) {
    // Create modal for image viewing
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
    
    // Remove modal from DOM when hidden
    modal.addEventListener('hidden.bs.modal', () => {
        document.body.removeChild(modal);
    });
}

// Report post
function reportPost(postId) {
    window.showAlert('info', 'Funcionalidad de reportar en desarrollo');
}

// Load activity/recent activity
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

// Setup infinite scroll
function setupInfiniteScroll() {
    console.log('🔄 Setting up infinite scroll...');
    
    window.addEventListener('scroll', () => {
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 1000) {
            if (!socialIsLoading) {
                loadFeed(socialCurrentPage + 1, true);
            }
        }
    });
}

// Utility function for relative time - FIXED for your date format
function formatRelativeTime(dateString) {
    try {
        if (!dateString) {
            return 'Fecha no disponible';
        }
        
        let date;
        
        // Handle your specific date format: "2024-07-14 04:01:00"
        if (typeof dateString === 'string') {
            // Replace space with T to make it ISO-like, then add Z
            const isoString = dateString.replace(' ', 'T') + 'Z';
            date = new Date(isoString);
        } else if (dateString instanceof Date) {
            date = dateString;
        } else if (typeof dateString === 'number') {
            date = new Date(dateString);
        } else {
            console.warn('Unknown date format:', dateString);
            return 'Fecha inválida';
        }
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
            console.warn('Invalid date after parsing:', dateString);
            return 'Fecha inválida';
        }
        
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const diffWeeks = Math.floor(diffDays / 7);
        const diffMonths = Math.floor(diffDays / 30);
        
        // Return relative time
        if (diffMinutes < 1) {
            return 'Ahora mismo';
        } else if (diffMinutes < 60) {
            return `Hace ${diffMinutes} ${diffMinutes === 1 ? 'minuto' : 'minutos'}`;
        } else if (diffHours < 24) {
            return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
        } else if (diffDays === 1) {
            return 'Ayer';
        } else if (diffDays < 7) {
            return `Hace ${diffDays} días`;
        } else if (diffWeeks < 4) {
            return `Hace ${diffWeeks} ${diffWeeks === 1 ? 'semana' : 'semanas'}`;
        } else if (diffMonths < 12) {
            return `Hace ${diffMonths} ${diffMonths === 1 ? 'mes' : 'meses'}`;
        } else {
            // For very old dates, show the actual date
            return date.toLocaleDateString('es-PE', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
        
    } catch (error) {
        console.error('Error formatting date:', error, 'Input:', dateString);
        return 'Fecha inválida';
    }
}

// Make functions globally available
window.ElBaulSocial = {
    // Feed functions
    loadFeed,
    loadActivity,
    
    // Post CRUD
    createPost,
    editPost,
    deletePost,
    
    // Reactions
    toggleLike,
    getReactions,
    
    // Comments CRUD
    loadComments,
    createComment,
    editComment,
    deleteComment,
    
    // UI helpers
    toggleComments,
    submitComment,
    editCommentModal,
    editPostModal,
    sharePost,
    showPostDetail,
    showImageModal,
    reportPost,
    
    // Utilities
    formatRelativeTime
};

console.log('🎯 social.js initialization complete');