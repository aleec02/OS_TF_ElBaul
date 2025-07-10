// Post Detail Page JavaScript
console.log('🔄 Post detail script loaded');

let currentPost = null;
// currentUser is already declared in common.js, so we don't need to declare it again

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('📝 Post detail page DOM loaded');
    
    // Wait for common functions to be ready
    function waitForCommonFunctions() {
        return new Promise((resolve) => {
            const checkFunctions = () => {
                if (window.apiCall && window.showAlert) {
                    console.log('Common functions ready, loading post');
                    resolve();
                } else {
                    console.log('Waiting for common functions...', {
                        hasApiCall: !!window.apiCall,
                        hasShowAlert: !!window.showAlert,
                        hasElBaulCommon: !!window.ElBaulCommon
                    });
                    setTimeout(checkFunctions, 100);
                }
            };
            checkFunctions();
        });
    }
    
    // Also check if ElBaulCommon is available as a fallback
    function waitForCommonFunctionsWithFallback() {
        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 50; // 5 seconds max
            
            const checkFunctions = () => {
                attempts++;
                console.log(`Attempt ${attempts}: Checking common functions...`, {
                    hasApiCall: !!window.apiCall,
                    hasShowAlert: !!window.showAlert,
                    hasElBaulCommon: !!window.ElBaulCommon,
                    hasCommon: !!window.ElBaulCommon
                });
                
                if (window.apiCall && window.showAlert) {
                    console.log('✅ Common functions ready via window, loading post');
                    resolve();
                } else if (window.ElBaulCommon && window.ElBaulCommon.apiCall && window.ElBaulCommon.showAlert) {
                    console.log('✅ Common functions ready via ElBaulCommon, loading post');
                    // Use ElBaulCommon as fallback
                    window.apiCall = window.ElBaulCommon.apiCall;
                    window.showAlert = window.ElBaulCommon.showAlert;
                    resolve();
                } else if (attempts >= maxAttempts) {
                    console.error('❌ Timeout waiting for common functions');
                    // Try to load anyway with basic error handling
                    resolve();
                } else {
                    setTimeout(checkFunctions, 100);
                }
            };
            checkFunctions();
        });
    }
    
    waitForCommonFunctionsWithFallback().then(() => {
        console.log('🚀 Starting post detail initialization...');
        try {
            loadPostDetail();
            initializeEventListeners();
        } catch (error) {
            console.error('❌ Error in post detail initialization:', error);
            const container = document.getElementById('post-container');
            if (container) {
                container.innerHTML = `
                    <div class="text-center py-5">
                        <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                        <h4 class="text-danger">Error de JavaScript</h4>
                        <p class="text-muted">Error: ${error.message}</p>
                        <button onclick="location.reload()" class="btn btn-primary">
                            <i class="fas fa-redo me-2"></i>Recargar Página
                        </button>
                    </div>
                `;
            }
        }
    });
});

async function loadPostDetail() {
    try {
        console.log('🚀 Loading post detail...');
        
        // Check if apiCall is available
        if (!window.apiCall) {
            throw new Error('API call function not available');
        }
        
        // Get post ID from URL
        const pathParts = window.location.pathname.split('/');
        const postId = pathParts[pathParts.length - 1];
        
        if (!postId) {
            throw new Error('No post ID found in URL');
        }
        
        console.log('Loading post with ID:', postId);
        
        const response = await window.apiCall(`/publicaciones/${postId}`);
        console.log('Post detail response:', response);
        
        if (response.exito && response.data.publicacion) {
            currentPost = response.data.publicacion;
            // Use the global currentUser from common.js
            const userData = response.data.usuario_actual || window.currentUser || null;
            
            displayPostDetail(response.data.publicacion, userData);
            loadComments(postId);
        } else {
            throw new Error(response.mensaje || 'Error loading post');
        }
        
    } catch (error) {
        console.error('❌ Error loading post detail:', error);
        
        const container = document.getElementById('post-container');
        if (container) {
            if (error.message && error.message.includes('No encontrado')) {
                container.innerHTML = `
                    <div class="text-center py-5">
                        <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                        <h4 class="text-warning">Publicación no encontrada</h4>
                        <p class="text-muted">La publicación que buscas no existe o ha sido eliminada.</p>
                        <a href="/comunidad" class="btn btn-primary">
                            <i class="fas fa-arrow-left me-2"></i>Volver a la Comunidad
                        </a>
                    </div>
                `;
            } else {
                container.innerHTML = `
                    <div class="text-center py-5">
                        <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                        <h4 class="text-danger">Error al cargar la publicación</h4>
                        <p class="text-muted">Por favor, intenta de nuevo más tarde.</p>
                        <button onclick="loadPostDetail()" class="btn btn-primary">
                            <i class="fas fa-redo me-2"></i>Reintentar
                        </button>
                    </div>
                `;
            }
        }
    }
}

function displayPostDetail(post, currentUser) {
    const container = document.getElementById('post-container');
    if (!container) return;
    
    // Format date - use fecha instead of fecha_publicacion
    const fecha = new Date(post.fecha).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Format tags
    const tagsHtml = post.tags && post.tags.length > 0 
        ? post.tags.map(tag => `<span class="badge bg-secondary me-1">#${tag}</span>`).join('')
        : '';
    
    // Check if current user is the owner
    const isOwner = window.currentUser && window.currentUser.usuario_id === post.usuario_id;
    
    // Check if user has liked the post
    const hasLiked = post.reacciones && post.reacciones.some(r => 
        window.currentUser && r.usuario_id === window.currentUser.usuario_id && r.tipo === 'like'
    );
    
    const likeButtonClass = hasLiked ? 'btn-danger' : 'btn-outline-danger';
    const likeIcon = hasLiked ? 'fas fa-heart' : 'far fa-heart';
    
    // Get user name from usuario object
    const userName = post.usuario ? `${post.usuario.nombre} ${post.usuario.apellido}` : 'Usuario';
    
    container.innerHTML = `
        <div class="card shadow-sm">
            <div class="card-header bg-white">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center">
                        <div class="avatar-placeholder me-3">
                            <i class="fas fa-user fa-2x text-muted"></i>
                        </div>
                        <div>
                            <h6 class="mb-0">${userName}</h6>
                            <small class="text-muted">${fecha}</small>
                        </div>
                    </div>
                    ${isOwner ? `
                        <div class="dropdown">
                            <button class="btn btn-link text-muted" type="button" data-bs-toggle="dropdown">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                            <ul class="dropdown-menu">
                                <li><a class="dropdown-item" href="#" onclick="editPost('${post.post_id}')">
                                    <i class="fas fa-edit me-2"></i>Editar
                                </a></li>
                                <li><a class="dropdown-item text-danger" href="#" onclick="deletePost('${post.post_id}')">
                                    <i class="fas fa-trash me-2"></i>Eliminar
                                </a></li>
                            </ul>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="card-body">
                <p class="card-text">${post.contenido}</p>
                
                ${tagsHtml ? `<div class="mb-3">${tagsHtml}</div>` : ''}
                
                ${post.imagenes && post.imagenes.length > 0 ? `
                    <div class="post-images mb-3">
                        ${post.imagenes.map(img => `
                            <img src="${img}" class="img-fluid rounded mb-2" alt="Post image" 
                                 style="max-height: 300px; object-fit: cover;">
                        `).join('')}
                    </div>
                ` : ''}
                
                <div class="d-flex justify-content-between align-items-center">
                    <div class="d-flex gap-2">
                        <button class="btn ${likeButtonClass} btn-sm" onclick="toggleLike('${post.post_id}')">
                            <i class="${likeIcon} me-1"></i>
                            <span class="like-count">${post.likes || 0}</span>
                        </button>
                        <button class="btn btn-outline-primary btn-sm" onclick="focusCommentInput()">
                            <i class="fas fa-comment me-1"></i>
                            <span class="comment-count">0</span>
                        </button>
                    </div>
                    
                    <div class="text-muted">
                        <small>
                            <i class="fas fa-eye me-1"></i>0 vistas
                        </small>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Comments Section -->
        <div class="card mt-4">
            <div class="card-header">
                <h6 class="mb-0">
                    <i class="fas fa-comments me-2"></i>Comentarios
                </h6>
            </div>
            <div class="card-body">
                ${window.currentUser ? `
                    <form id="comment-form" class="mb-4">
                        <div class="mb-3">
                            <textarea class="form-control" id="comment-content" rows="3" 
                                      placeholder="Escribe un comentario..." required></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary btn-sm">
                            <i class="fas fa-paper-plane me-1"></i>Comentar
                        </button>
                    </form>
                ` : `
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle me-2"></i>
                        <a href="/login" class="alert-link">Inicia sesión</a> para comentar.
                    </div>
                `}
                
                <div id="comments-container">
                    <div class="text-center py-3">
                        <div class="spinner-border spinner-border-sm text-primary" role="status">
                            <span class="visually-hidden">Cargando comentarios...</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function loadComments(postId) {
    try {
        console.log('Loading comments for post:', postId);
        
        const response = await window.apiCall(`/publicaciones/${postId}/comentarios`);
        console.log('Comments response:', response);
        
        const container = document.getElementById('comments-container');
        if (!container) return;
        
        if (response.exito && response.data.comentarios) {
            if (response.data.comentarios.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-3 text-muted">
                        <i class="fas fa-comment-slash fa-2x mb-2"></i>
                        <p class="mb-0">No hay comentarios aún. ¡Sé el primero en comentar!</p>
                    </div>
                `;
            } else {
                let html = '';
                response.data.comentarios.forEach(comment => {
                    const fecha = new Date(comment.fecha).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    
                    const isOwner = window.currentUser && window.currentUser.usuario_id === comment.usuario_id;
                    const userName = comment.usuario ? `${comment.usuario.nombre} ${comment.usuario.apellido}` : 'Usuario';
                    
                    html += `
                        <div class="comment-item border-bottom pb-3 mb-3">
                            <div class="d-flex justify-content-between align-items-start">
                                <div class="d-flex align-items-center">
                                    <div class="avatar-placeholder me-2">
                                        <i class="fas fa-user text-muted"></i>
                                    </div>
                                    <div>
                                        <h6 class="mb-0 small">${userName}</h6>
                                        <small class="text-muted">${fecha}</small>
                                    </div>
                                </div>
                                ${isOwner ? `
                                    <button class="btn btn-link btn-sm text-danger p-0" 
                                            onclick="deleteComment('${comment.comentario_id}')">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                ` : ''}
                            </div>
                            <p class="mt-2 mb-0">${comment.contenido}</p>
                        </div>
                    `;
                });
                container.innerHTML = html;
            }
        } else {
            throw new Error(response.mensaje || 'Error loading comments');
        }
        
    } catch (error) {
        console.error('Error loading comments:', error);
        
        const container = document.getElementById('comments-container');
        if (container) {
            container.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Error al cargar los comentarios.
                </div>
            `;
        }
    }
}

function initializeEventListeners() {
    // Comment form submission
    document.addEventListener('submit', function(e) {
        if (e.target.id === 'comment-form') {
            e.preventDefault();
            submitComment();
        }
    });
}

async function submitComment() {
    if (!window.currentUser) {
        window.showAlert('warning', 'Debes iniciar sesión para comentar');
        return;
    }
    
    const contentInput = document.getElementById('comment-content');
    const content = contentInput.value.trim();
    
    if (!content) {
        window.showAlert('warning', 'Por favor escribe un comentario');
        return;
    }
    
    try {
        console.log('Submitting comment...');
        
        const response = await window.apiCall(`/publicaciones/${currentPost.publicacion_id}/comentarios`, {
            method: 'POST',
            body: JSON.stringify({ contenido: content })
        });
        
        if (response.exito) {
            window.showAlert('success', 'Comentario publicado exitosamente');
            contentInput.value = '';
            loadComments(currentPost.publicacion_id);
        } else {
            window.showAlert('danger', response.mensaje || 'Error al publicar comentario');
        }
        
    } catch (error) {
        console.error('Error submitting comment:', error);
        window.showAlert('danger', 'Error al publicar comentario');
    }
}

async function toggleLike(postId) {
    if (!window.currentUser) {
        window.showAlert('warning', 'Debes iniciar sesión para reaccionar');
        return;
    }
    
    try {
        console.log('Toggling like for post:', postId);
        
        const response = await window.apiCall(`/publicaciones/${postId}/reacciones`, {
            method: 'POST',
            body: JSON.stringify({ tipo: 'like' })
        });
        
        if (response.exito) {
            // Update UI immediately
            const likeButton = document.querySelector(`button[onclick="toggleLike('${postId}')"]`);
            const likeIcon = likeButton.querySelector('i');
            const likeCount = likeButton.querySelector('.like-count');
            
            if (response.data.accion === 'agregada') {
                likeButton.classList.remove('btn-outline-danger');
                likeButton.classList.add('btn-danger');
                likeIcon.classList.remove('far');
                likeIcon.classList.add('fas');
            } else {
                likeButton.classList.remove('btn-danger');
                likeButton.classList.add('btn-outline-danger');
                likeIcon.classList.remove('fas');
                likeIcon.classList.add('far');
            }
            
            likeCount.textContent = response.data.total_likes;
            
        } else {
            window.showAlert('danger', response.mensaje || 'Error al reaccionar');
        }
        
    } catch (error) {
        console.error('Error toggling like:', error);
        window.showAlert('danger', 'Error al reaccionar');
    }
}

async function deleteComment(commentId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este comentario?')) {
        return;
    }
    
    try {
        console.log('Deleting comment:', commentId);
        
        const response = await window.apiCall(`/comentarios/${commentId}`, {
            method: 'DELETE'
        });
        
        if (response.exito) {
            window.showAlert('success', 'Comentario eliminado exitosamente');
            loadComments(currentPost.publicacion_id);
        } else {
            window.showAlert('danger', response.mensaje || 'Error al eliminar comentario');
        }
        
    } catch (error) {
        console.error('Error deleting comment:', error);
        window.showAlert('danger', 'Error al eliminar comentario');
    }
}

async function deletePost(postId) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta publicación? Esta acción no se puede deshacer.')) {
        return;
    }
    
    try {
        console.log('Deleting post:', postId);
        
        const response = await window.apiCall(`/publicaciones/${postId}`, {
            method: 'DELETE'
        });
        
        if (response.exito) {
            window.showAlert('success', 'Publicación eliminada exitosamente');
            setTimeout(() => {
                window.location.href = '/comunidad';
            }, 1500);
        } else {
            window.showAlert('danger', response.mensaje || 'Error al eliminar publicación');
        }
        
    } catch (error) {
        console.error('Error deleting post:', error);
        window.showAlert('danger', 'Error al eliminar publicación');
    }
}

function editPost(postId) {
    // Redirect to edit page or show edit modal
    window.location.href = `/publicaciones/${postId}/editar`;
}

function focusCommentInput() {
    const commentInput = document.getElementById('comment-content');
    if (commentInput) {
        commentInput.focus();
        commentInput.scrollIntoView({ behavior: 'smooth' });
    }
} 