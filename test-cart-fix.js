const API_BASE = 'http://localhost:3000/api';

// Test user credentials (from the data)
const TEST_USER = {
    email: 'aldo.quispe@gmail.com',
    contrasena: 'aldo1234'
};

let authToken = null;

async function login() {
    try {
        console.log('🔐 Logging in...');
        const response = await fetch(`${API_BASE}/usuarios/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(TEST_USER)
        });
        
        const data = await response.json();
        
        if (data.exito) {
            authToken = data.data.token;
            console.log('✅ Login successful');
            return true;
        } else {
            console.log('❌ Login failed:', data.mensaje);
            return false;
        }
    } catch (error) {
        console.error('❌ Login error:', error.message);
        return false;
    }
}

async function testAddToCart(productId, cantidad = 1) {
    try {
        console.log(`🛒 Testing add to cart: ${productId} (qty: ${cantidad})`);
        
        const response = await fetch(`${API_BASE}/carrito/items`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ producto_id: productId, cantidad })
        });
        
        const data = await response.json();
        
        if (data.exito) {
            console.log('✅ Successfully added to cart');
            return true;
        } else {
            console.log('❌ Failed to add to cart:', data.mensaje);
            return false;
        }
    } catch (error) {
        console.error('❌ Add to cart error:', error.message);
        return false;
    }
}

async function testGetCart() {
    try {
        console.log('🛒 Getting cart contents...');
        
        const response = await fetch(`${API_BASE}/carrito`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.exito) {
            console.log('✅ Cart retrieved successfully');
            console.log(`📦 Total items: ${data.data.total_items}`);
            console.log(`💰 Total price: S/ ${data.data.total_precio}`);
            
            if (data.data.items && data.data.items.length > 0) {
                console.log('📋 Cart items:');
                data.data.items.forEach(item => {
                    console.log(`  - ${item.producto.titulo}: ${item.cantidad} x S/ ${item.precio_unitario} = S/ ${item.subtotal}`);
                });
            }
            return true;
        } else {
            console.log('❌ Failed to get cart:', data.mensaje);
            return false;
        }
    } catch (error) {
        console.error('❌ Get cart error:', error.message);
        return false;
    }
}

async function testStockValidation() {
    console.log('\n🧪 Testing stock validation...');
    
    // Test 1: Add a product with reasonable quantity
    console.log('\n📝 Test 1: Adding product with reasonable quantity');
    await testAddToCart('PR300001', 2);
    
    // Test 2: Try to add more than available stock
    console.log('\n📝 Test 2: Trying to add more than available stock');
    await testAddToCart('PR300001', 20); // Should fail
    
    // Test 3: Add a different product
    console.log('\n📝 Test 3: Adding a different product');
    await testAddToCart('PR300002', 1);
    
    // Test 4: Check cart contents
    console.log('\n📝 Test 4: Checking cart contents');
    await testGetCart();
}

async function runTests() {
    console.log('🚀 Starting cart functionality tests...\n');
    
    // Login first
    const loginSuccess = await login();
    if (!loginSuccess) {
        console.log('❌ Cannot proceed without login');
        return;
    }
    
    // Run stock validation tests
    await testStockValidation();
    
    console.log('\n✅ Cart functionality tests completed!');
}

// Run the tests
runTests().catch(console.error); 