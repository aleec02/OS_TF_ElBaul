// Test script to verify comment CRUD functionality
const BASE_URL = 'http://localhost:3000/api';

async function testCommentCRUD() {
    console.log('🧪 Testing Comment CRUD Functionality...\n');
    
    try {
        // Test 1: Get comments for a post
        console.log('1️⃣ Testing get comments...');
        const commentsResponse = await fetch(`${BASE_URL}/publicaciones/POST700001/comentarios?page=1&limit=5`);
        const commentsData = await commentsResponse.json();
        
        if (commentsData.exito) {
            console.log('✅ Comments loaded successfully');
            console.log(`📊 Found ${commentsData.data.comentarios.length} comments`);
            
            if (commentsData.data.comentarios.length > 0) {
                const firstComment = commentsData.data.comentarios[0];
                console.log(`💬 First comment: ${firstComment.contenido.substring(0, 50)}...`);
                console.log(`🆔 Comment ID: ${firstComment.comentario_id}`);
                console.log(`👤 User: ${firstComment.usuario?.nombre || 'Unknown'}`);
            }
        } else {
            console.log('❌ Failed to load comments:', commentsData.mensaje);
        }
        
        // Test 2: Create a new comment (requires authentication)
        console.log('\n2️⃣ Testing create comment...');
        console.log('⚠️  This requires authentication - skipping for now');
        
        // Test 3: Test comment structure
        console.log('\n3️⃣ Testing comment data structure...');
        if (commentsData.exito && commentsData.data.comentarios.length > 0) {
            const comment = commentsData.data.comentarios[0];
            const requiredFields = ['comentario_id', 'usuario_id', 'post_id', 'contenido', 'fecha'];
            const missingFields = requiredFields.filter(field => !comment[field]);
            
            if (missingFields.length === 0) {
                console.log('✅ Comment structure is correct');
                console.log('📋 Fields found:', Object.keys(comment));
            } else {
                console.log('❌ Missing fields:', missingFields);
            }
        }
        
        // Test 4: Test API endpoints exist
        console.log('\n4️⃣ Testing API endpoints...');
        
        const endpoints = [
            { method: 'GET', path: '/publicaciones/POST700001/comentarios', name: 'Get Comments' },
            { method: 'POST', path: '/publicaciones/POST700001/comentarios', name: 'Create Comment' },
            { method: 'PUT', path: '/comentarios/CMT800001', name: 'Edit Comment' },
            { method: 'DELETE', path: '/comentarios/CMT800001', name: 'Delete Comment' }
        ];
        
        for (const endpoint of endpoints) {
            try {
                const response = await fetch(`${BASE_URL}${endpoint.path}`, {
                    method: endpoint.method,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.status === 401) {
                    console.log(`✅ ${endpoint.name}: Endpoint exists (requires auth)`);
                } else if (response.status === 404) {
                    console.log(`❌ ${endpoint.name}: Endpoint not found`);
                } else {
                    console.log(`✅ ${endpoint.name}: Endpoint exists (status: ${response.status})`);
                }
            } catch (error) {
                console.log(`❌ ${endpoint.name}: Error - ${error.message}`);
            }
        }
        
        console.log('\n🎯 Comment CRUD test completed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run the test
testCommentCRUD(); 