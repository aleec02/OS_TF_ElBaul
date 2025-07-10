// Social Feed JavaScript for ElBaul
// Handles posts, comments, reactions, and social interactions

class SocialFeed {
    constructor() {
        this.currentPage = 1;
        this.hasMorePosts = true;
        this.isLoading = false;
        this.posts = [];
        this.currentUser = null;
        
        this.init();
    }

    async init() {
        console.log('Social Feed initializing...');
        
        // Wait for common functions
        await this.waitForCommonFunctions();
        
        // Initialize components
        this.initializeEventListeners();
        this.loadCurrentUser();
        this.loadPosts();
        this.loadSidebarData();
        
        console.log('Social Feed initialized');
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
        // Create post form
        const createPostForm = document.getElementById('createPostForm');
        if (createPostForm) {
            createPostForm.addEventListener('submit', (e) => this.handleCreatePost(e));
        }

        // Image preview
        const postImages = document.getElementById('postImages');
        if (postImages) {
            postImages.addEventListener('change', (e) => this.handleImagePreview(e));
        }

        // Load more posts
        const loadMoreBtn = document.getElementById('loadMorePosts');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => this.loadMorePosts());
        }

        // Delegate events for dynamic content
        document.addEventListener('click', (e) => this.handleDelegatedEvents(e));
    }

    async loadCurrentUser() {
        try {
            const token = localStorage.getItem('authToken');
            if (token) {
                const response = await window.apiCall('/usuarios/perfil');
                if (response.exito) {
                    this.currentUser = response.data.usuario;
                }
            }
        } catch (error) {
            console.error('Error loading current user:', error);
        }
    }

    async loadPosts() {
        if (this.isLoading || !this.hasMorePosts) return;

        this.isLoading = true;
        this.showLoadingState();

        try {
            const response = await window.apiCall(`/publicaciones?page=${this.currentPage}&limit=10`);
            
            if (response.exito) {
                const newPosts = response.data.publicaciones || [];
                this.posts = this.currentPage === 1 ? newPosts : [...this.posts, ...newPosts];
                
                this.renderPosts();
                this.hasMorePosts = newPosts.length === 10;
                this.currentPage++;
                
                this.updateLoadMoreButton();
            } else {
                throw new Error(response.mensaje || 'Error cargando publicaciones');
            }
        } catch (error) {
            console.error('Error loading posts:', error);
            window.showAlert('danger', 'Error cargando publicaciones: ' + error.message);
        } finally {
            this.isLoading = false;
            this.hideLoadingState();
        }
    }

    async loadMorePosts() {
        await this.loadPosts();
    }

    renderPosts() {
        const postsFeed = document.getElementById('postsFeed');
        if (!postsFeed) return;

        if (this.currentPage === 1) {
            postsFeed.innerHTML = '';
        }

        this.posts.forEach(post => {
            const postElement = this.createPostElement(post);
            postsFeed.appendChild(postElement);
        });
    }

    createPostElement(post) {
        const template = document.getElementById('postTemplate');
        if (!template) return document.createElement('div');

        const clone = template.content.cloneNode(true);
        
        // Set post data
        clone.querySelector('.post-avatar').src = post.usuario.avatar_url || '/img/default-avatar.png';
        clone.querySelector('.post-author').textContent = post.usuario.nombre;
        clone.querySelector('.post-date').textContent = this.formatDate(post.fecha_creacion);
        clone.querySelector('.post-content').textContent = post.contenido;
        clone.querySelector('.like-count').textContent = post.reacciones?.length || 0;
        clone.querySelector('.comment-count').textContent = post.comentarios?.length || 0;
        clone.querySelector('.views-count').textContent = post.vistas || 0;

        // Set post ID for interactions
        const postCard = clone.querySelector('.post-card');
        postCard.dataset.postId = post.publicacion_id;

        // Handle images
        if (post.imagenes && post.imagenes.length > 0) {
            const imagesContainer = clone.querySelector('.post-images');
            imagesContainer.style.display = 'block';
            
            post.imagenes.forEach(image => {
                const imgCol = document.createElement('div');
                imgCol.className = 'col-md-6 col-lg-4';
                imgCol.innerHTML = `
                    <img src="${image}" class="img-fluid rounded" alt="Post image" 
                         style="cursor: pointer;" onclick="socialFeed.openImageModal('${image}')">
                `;
                imagesContainer.querySelector('.row').appendChild(imgCol);
            });
        }

        // Handle related product
        if (post.producto) {
            const productContainer = clone.querySelector('.related-product');
            productContainer.style.display = 'block';
            
            clone.querySelector('.related-product-image').src = post.producto.imagen_principal || '/img/default-product.png';
            clone.querySelector('.related-product-title').textContent = post.producto.titulo;
            clone.querySelector('.related-product-price').textContent = `S/ ${post.producto.precio}`;
            clone.querySelector('.related-product-link').href = `/productos/${post.producto.producto_id}`;
        }

        // Handle user interactions
        this.setupPostInteractions(clone, post);

        return clone;
    }

    setupPostInteractions(clone, post) {
        const postCard = clone.querySelector('.post-card');
        const postId = post.publicacion_id;

        // Like button
        const likeBtn = clone.querySelector('.post-like-btn');
        if (likeBtn) {
            const hasLiked = post.reacciones?.some(r => r.usuario_id === this.currentUser?.usuario_id);
            if (hasLiked) {
                likeBtn.classList.add('active');
                likeBtn.classList.remove('btn-outline-primary');
                likeBtn.classList.add('btn-primary');
            }
            
            likeBtn.addEventListener('click', () => this.handleLike(postId));
        }

        // Comment button
        const commentBtn = clone.querySelector('.post-comment-btn');
        if (commentBtn) {
            commentBtn.addEventListener('click', () => this.toggleComments(postCard));
        }

        // Share button
        const shareBtn = clone.querySelector('.post-share-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.handleShare(post));
        }

        // Comment form
        const commentForm = clone.querySelector('.comment-form');
        if (commentForm) {
            commentForm.addEventListener('submit', (e) => this.handleCreateComment(e, postId));
        }

        // Dropdown actions
        const dropdownItems = clone.querySelectorAll('[data-action]');
        dropdownItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const action = item.dataset.action;
                this.handlePostAction(action, postId, post);
            });
        });
    }

    async handleCreatePost(e) {
        e.preventDefault();
        
        if (!this.currentUser) {
            window.showAlert('warning', 'Debes iniciar sesión para publicar');
            return;
        }

        const content = document.getElementById('postContent').value.trim();
        const relatedProduct = document.getElementById('relatedProduct').value;
        const isPublic = document.getElementById('publicPost').checked;
        const imageFiles = document.getElementById('postImages').files;

        if (!content) {
            window.showAlert('warning', 'El contenido de la publicación es requerido');
            return;
        }

        const submitBtn = document.getElementById('submitPost');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Publicando...';

        try {
            const formData = new FormData();
            formData.append('contenido', content);
            formData.append('publico', isPublic);
            
            if (relatedProduct) {
                formData.append('producto_id', relatedProduct);
            }

            for (let i = 0; i < imageFiles.length; i++) {
                formData.append('imagenes', imageFiles[i]);
            }

            const response = await window.apiCall('/publicaciones', {
                method: 'POST',
                body: formData,
                headers: {} // Let browser set Content-Type for FormData
            });

            if (response.exito) {
                window.showAlert('success', 'Publicación creada exitosamente');
                this.resetCreatePostForm();
                this.refreshPosts();
            } else {
                throw new Error(response.mensaje || 'Error creando publicación');
            }
        } catch (error) {
            console.error('Error creating post:', error);
            window.showAlert('danger', 'Error creando publicación: ' + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }

    resetCreatePostForm() {
        document.getElementById('createPostForm').reset();
        document.getElementById('imagePreview').innerHTML = '';
        document.getElementById('postContent').value = '';
    }

    handleImagePreview(e) {
        const files = e.target.files;
        const preview = document.getElementById('imagePreview');
        preview.innerHTML = '';

        Array.from(files).forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.className = 'img-thumbnail';
                    img.style.width = '100px';
                    img.style.height = '100px';
                    img.style.objectFit = 'cover';
                    preview.appendChild(img);
                };
                reader.readAsDataURL(file);
            }
        });
    }

    async handleLike(postId) {
        if (!this.currentUser) {
            window.showAlert('warning', 'Debes iniciar sesión para reaccionar');
            return;
        }

        try {
            const response = await window.apiCall(`/publicaciones/${postId}/reacciones`, {
                method: 'POST',
                body: JSON.stringify({ tipo: 'like' })
            });

            if (response.exito) {
                this.updatePostLikeUI(postId, response.data.reaccion_creada);
            }
        } catch (error) {
            console.error('Error handling like:', error);
            window.showAlert('danger', 'Error procesando reacción');
        }
    }

    updatePostLikeUI(postId, reactionCreated) {
        const postCard = document.querySelector(`[data-post-id="${postId}"]`);
        if (!postCard) return;

        const likeBtn = postCard.querySelector('.post-like-btn');
        const likeCount = postCard.querySelector('.like-count');
        
        if (reactionCreated) {
            likeBtn.classList.add('active', 'btn-primary');
            likeBtn.classList.remove('btn-outline-primary');
            likeCount.textContent = parseInt(likeCount.textContent) + 1;
        } else {
            likeBtn.classList.remove('active', 'btn-primary');
            likeBtn.classList.add('btn-outline-primary');
            likeCount.textContent = Math.max(0, parseInt(likeCount.textContent) - 1);
        }
    }

    toggleComments(postCard) {
        const commentsSection = postCard.querySelector('.comments-section');
        const isVisible = commentsSection.style.display !== 'none';
        
        if (isVisible) {
            commentsSection.style.display = 'none';
        } else {
            commentsSection.style.display = 'block';
            this.loadComments(postCard);
        }
    }

    async loadComments(postCard) {
        const postId = postCard.dataset.postId;
        const commentsList = postCard.querySelector('.comments-list');
        
        if (commentsList.children.length > 0) return; // Already loaded

        try {
            const response = await window.apiCall(`/publicaciones/${postId}/comentarios`);
            
            if (response.exito) {
                const comments = response.data.comentarios || [];
                comments.forEach(comment => {
                    const commentElement = this.createCommentElement(comment);
                    commentsList.appendChild(commentElement);
                });
            }
        } catch (error) {
            console.error('Error loading comments:', error);
        }
    }

    createCommentElement(comment) {
        const template = document.getElementById('commentTemplate');
        if (!template) return document.createElement('div');

        const clone = template.content.cloneNode(true);
        
        clone.querySelector('.comment-avatar').src = comment.usuario.avatar_url || '/img/default-avatar.png';
        clone.querySelector('.comment-author').textContent = comment.usuario.nombre;
        clone.querySelector('.comment-content').textContent = comment.contenido;
        clone.querySelector('.comment-date').textContent = this.formatDate(comment.fecha_creacion);
        clone.querySelector('.comment-like-count').textContent = comment.reacciones?.length || 0;

        // Handle comment interactions
        const likeBtn = clone.querySelector('.comment-like-btn');
        if (likeBtn) {
            const hasLiked = comment.reacciones?.some(r => r.usuario_id === this.currentUser?.usuario_id);
            if (hasLiked) {
                likeBtn.classList.add('text-danger');
            }
            
            likeBtn.addEventListener('click', () => this.handleCommentLike(comment.comentario_id));
        }

        return clone;
    }

    async handleCreateComment(e, postId) {
        e.preventDefault();
        
        if (!this.currentUser) {
            window.showAlert('warning', 'Debes iniciar sesión para comentar');
            return;
        }

        const input = e.target.querySelector('.comment-input');
        const content = input.value.trim();

        if (!content) {
            window.showAlert('warning', 'El comentario no puede estar vacío');
            return;
        }

        try {
            const response = await window.apiCall(`/publicaciones/${postId}/comentarios`, {
                method: 'POST',
                body: JSON.stringify({ contenido: content })
            });

            if (response.exito) {
                input.value = '';
                this.addCommentToUI(postId, response.data.comentario);
                this.updateCommentCount(postId, 1);
            }
        } catch (error) {
            console.error('Error creating comment:', error);
            window.showAlert('danger', 'Error creando comentario');
        }
    }

    addCommentToUI(postId, comment) {
        const postCard = document.querySelector(`[data-post-id="${postId}"]`);
        if (!postCard) return;

        const commentsList = postCard.querySelector('.comments-list');
        const commentElement = this.createCommentElement(comment);
        commentsList.appendChild(commentElement);
    }

    updateCommentCount(postId, increment) {
        const postCard = document.querySelector(`[data-post-id="${postId}"]`);
        if (!postCard) return;

        const commentCount = postCard.querySelector('.comment-count');
        const currentCount = parseInt(commentCount.textContent);
        commentCount.textContent = currentCount + increment;
    }

    async handleCommentLike(commentId) {
        if (!this.currentUser) {
            window.showAlert('warning', 'Debes iniciar sesión para reaccionar');
            return;
        }

        try {
            const response = await window.apiCall(`/comentarios/${commentId}/reacciones`, {
                method: 'POST',
                body: JSON.stringify({ tipo: 'like' })
            });

            if (response.exito) {
                this.updateCommentLikeUI(commentId, response.data.reaccion_creada);
            }
        } catch (error) {
            console.error('Error handling comment like:', error);
        }
    }

    updateCommentLikeUI(commentId, reactionCreated) {
        const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (!commentElement) return;

        const likeBtn = commentElement.querySelector('.comment-like-btn');
        const likeCount = commentElement.querySelector('.comment-like-count');
        
        if (reactionCreated) {
            likeBtn.classList.add('text-danger');
            likeCount.textContent = parseInt(likeCount.textContent) + 1;
        } else {
            likeBtn.classList.remove('text-danger');
            likeCount.textContent = Math.max(0, parseInt(likeCount.textContent) - 1);
        }
    }

    async handleShare(post) {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Publicación de ${post.usuario.nombre}`,
                    text: post.contenido,
                    url: `${window.location.origin}/social/post/${post.publicacion_id}`
                });
            } catch (error) {
                console.log('Error sharing:', error);
            }
        } else {
            // Fallback: copy to clipboard
            const url = `${window.location.origin}/social/post/${post.publicacion_id}`;
            navigator.clipboard.writeText(url).then(() => {
                window.showAlert('success', 'Enlace copiado al portapapeles');
            });
        }
    }

    async handlePostAction(action, postId, post) {
        switch (action) {
            case 'delete':
                if (confirm('¿Estás seguro de que quieres eliminar esta publicación?')) {
                    await this.deletePost(postId);
                }
                break;
            case 'report':
                await this.reportPost(postId);
                break;
            case 'share':
                await this.handleShare(post);
                break;
        }
    }

    async deletePost(postId) {
        try {
            const response = await window.apiCall(`/publicaciones/${postId}`, {
                method: 'DELETE'
            });

            if (response.exito) {
                window.showAlert('success', 'Publicación eliminada');
                this.removePostFromUI(postId);
            }
        } catch (error) {
            console.error('Error deleting post:', error);
            window.showAlert('danger', 'Error eliminando publicación');
        }
    }

    removePostFromUI(postId) {
        const postCard = document.querySelector(`[data-post-id="${postId}"]`);
        if (postCard) {
            postCard.remove();
        }
    }

    async reportPost(postId) {
        const reason = prompt('¿Por qué quieres reportar esta publicación?');
        if (!reason) return;

        try {
            const response = await window.apiCall(`/publicaciones/${postId}/reportar`, {
                method: 'POST',
                body: JSON.stringify({ motivo: reason })
            });

            if (response.exito) {
                window.showAlert('success', 'Reporte enviado. Gracias por tu feedback.');
            }
        } catch (error) {
            console.error('Error reporting post:', error);
            window.showAlert('danger', 'Error enviando reporte');
        }
    }

    async loadSidebarData() {
        await Promise.all([
            this.loadTrendingTopics(),
            this.loadSuggestedUsers(),
            this.loadRecentActivity()
        ]);
    }

    async loadTrendingTopics() {
        try {
            const response = await window.apiCall('/publicaciones/tendencias');
            const container = document.getElementById('trendingTopics');
            
            if (response.exito && container) {
                const topics = response.data.tendencias || [];
                container.innerHTML = topics.map(topic => `
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="badge bg-primary">#${topic.tema}</span>
                        <small class="text-muted">${topic.cantidad} posts</small>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Error loading trending topics:', error);
        }
    }

    async loadSuggestedUsers() {
        try {
            const response = await window.apiCall('/usuarios/sugeridos');
            const container = document.getElementById('suggestedUsers');
            
            if (response.exito && container) {
                const users = response.data.usuarios || [];
                container.innerHTML = users.map(user => `
                    <div class="d-flex align-items-center mb-3">
                        <img src="${user.avatar_url || '/img/default-avatar.png'}" 
                             class="rounded-circle me-2" width="40" height="40" alt="Avatar">
                        <div class="flex-grow-1">
                            <h6 class="mb-0">${user.nombre}</h6>
                            <small class="text-muted">${user.publicaciones_count} publicaciones</small>
                        </div>
                        <button class="btn btn-sm btn-outline-primary" onclick="socialFeed.followUser('${user.usuario_id}')">
                            Seguir
                        </button>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Error loading suggested users:', error);
        }
    }

    async loadRecentActivity() {
        try {
            const response = await window.apiCall('/actividad/reciente');
            const container = document.getElementById('recentActivity');
            
            if (response.exito && container) {
                const activities = response.data.actividades || [];
                container.innerHTML = activities.map(activity => `
                    <div class="d-flex align-items-center mb-2">
                        <i class="fas fa-circle text-primary me-2" style="font-size: 8px;"></i>
                        <small class="text-muted">${activity.descripcion}</small>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Error loading recent activity:', error);
        }
    }

    async followUser(userId) {
        try {
            const response = await window.apiCall(`/usuarios/${userId}/seguir`, {
                method: 'POST'
            });

            if (response.exito) {
                window.showAlert('success', 'Usuario seguido exitosamente');
                this.loadSuggestedUsers(); // Refresh the list
            }
        } catch (error) {
            console.error('Error following user:', error);
            window.showAlert('danger', 'Error siguiendo usuario');
        }
    }

    refreshPosts() {
        this.currentPage = 1;
        this.hasMorePosts = true;
        this.posts = [];
        this.loadPosts();
    }

    showLoadingState() {
        const postsFeed = document.getElementById('postsFeed');
        if (postsFeed && this.currentPage === 1) {
            postsFeed.innerHTML = `
                <div class="text-center py-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Cargando...</span>
                    </div>
                    <p class="mt-3">Cargando publicaciones...</p>
                </div>
            `;
        }
    }

    hideLoadingState() {
        // Loading state is handled by renderPosts
    }

    updateLoadMoreButton() {
        const container = document.getElementById('loadMoreContainer');
        const button = document.getElementById('loadMorePosts');
        
        if (container && button) {
            if (this.hasMorePosts) {
                container.style.display = 'block';
                button.disabled = false;
            } else {
                container.style.display = 'none';
            }
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);

        if (diffInHours < 1) {
            const diffInMinutes = Math.floor((now - date) / (1000 * 60));
            return `hace ${diffInMinutes} min`;
        } else if (diffInHours < 24) {
            return `hace ${Math.floor(diffInHours)}h`;
        } else if (diffInHours < 168) {
            return `hace ${Math.floor(diffInHours / 24)}d`;
        } else {
            return date.toLocaleDateString('es-ES');
        }
    }

    openImageModal(imageUrl) {
        // Create modal for image viewing
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Imagen</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body text-center">
                        <img src="${imageUrl}" class="img-fluid" alt="Post image">
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
        
        modal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modal);
        });
    }

    handleDelegatedEvents(e) {
        // Handle dynamic content events
        const target = e.target;
        
        if (target.matches('.post-like-btn')) {
            const postCard = target.closest('.post-card');
            const postId = postCard.dataset.postId;
            this.handleLike(postId);
        }
        
        if (target.matches('.post-comment-btn')) {
            const postCard = target.closest('.post-card');
            this.toggleComments(postCard);
        }
        
        if (target.matches('.comment-like-btn')) {
            const commentId = target.closest('[data-comment-id]').dataset.commentId;
            this.handleCommentLike(commentId);
        }
    }
}

// Initialize social feed when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.socialFeed = new SocialFeed();
});

// Export for global access
window.SocialFeed = SocialFeed; 