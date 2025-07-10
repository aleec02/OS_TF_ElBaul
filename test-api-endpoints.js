const API_BASE = 'http://localhost:3000/api';

// Test data
const testUser = {
    email: 'cmendoza@gmail.com',
    contrasena: 'CesarM#2023'
};

const testProductId = 'PR300017';

async function testAPI() {
    console.log('🧪 Testing API endpoints...\n');
    
    try {
        // 1. Login to get token
        console.log('1. Testing login...');
        const loginResponse = await fetch(`${API_BASE}/usuarios/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testUser)
        });
        
        const loginData = await loginResponse.json();
        console.log('Login response:', loginData);
        
        if (!loginData.exito) {
            console.error('❌ Login failed');
            return;
        }
        
        const token = loginData.data.token;
        console.log('✅ Login successful, token obtained\n');
        
        // 2. Test adding to favorites
        console.log('2. Testing add to favorites...');
        const favoriteResponse = await fetch(`${API_BASE}/favoritos`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ producto_id: testProductId })
        });
        
        const favoriteData = await favoriteResponse.json();
        console.log('Add to favorites response:', favoriteData);
        console.log(favoriteData.exito ? '✅ Add to favorites successful' : '❌ Add to favorites failed\n');
        
        // 3. Test getting favorites
        console.log('3. Testing get favorites...');
        const getFavoritesResponse = await fetch(`${API_BASE}/favoritos`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const getFavoritesData = await getFavoritesResponse.json();
        console.log('Get favorites response:', getFavoritesData);
        console.log(getFavoritesData.exito ? '✅ Get favorites successful' : '❌ Get favorites failed\n');
        
        // 4. Test adding to cart
        console.log('4. Testing add to cart...');
        const cartResponse = await fetch(`${API_BASE}/carrito/items`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                producto_id: testProductId,
                cantidad: 1
            })
        });
        
        const cartData = await cartResponse.json();
        console.log('Add to cart response:', cartData);
        console.log(cartData.exito ? '✅ Add to cart successful' : '❌ Add to cart failed\n');
        
        // 5. Test getting cart
        console.log('5. Testing get cart...');
        const getCartResponse = await fetch(`${API_BASE}/carrito`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const getCartData = await getCartResponse.json();
        console.log('Get cart response:', getCartData);
        console.log(getCartData.exito ? '✅ Get cart successful' : '❌ Get cart failed\n');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testAPI(); 