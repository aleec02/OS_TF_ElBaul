const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000/api';

async function testFavorites() {
    console.log('🧪 Testing Favorites Functionality...\n');
    
    try {
        // Test 1: Login to get a token
        console.log('1. Testing login...');
        const loginResponse = await fetch(`${BASE_URL}/usuarios/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'cmendoza@gmail.com',
                contrasena: 'CesarM#2023'
            })
        });
        
        const loginData = await loginResponse.json();
        
        if (!loginData.exito) {
            console.error('❌ Login failed:', loginData.mensaje);
            return;
        }
        
        const token = loginData.data.token;
        console.log('✅ Login successful');
        
        // Test 2: Get favorites
        console.log('\n2. Testing get favorites...');
        const favoritesResponse = await fetch(`${BASE_URL}/favoritos`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const favoritesData = await favoritesResponse.json();
        console.log('Favorites response:', JSON.stringify(favoritesData, null, 2));
        
        if (favoritesData.exito) {
            console.log('✅ Get favorites successful');
            console.log(`Found ${favoritesData.data.favoritos.length} favorites`);
        } else {
            console.error('❌ Get favorites failed:', favoritesData.mensaje);
        }
        
        // Test 3: Add a favorite (if we have products)
        console.log('\n3. Testing add favorite...');
        const productsResponse = await fetch(`${BASE_URL}/productos?limit=1`);
        const productsData = await productsResponse.json();
        
        if (productsData.exito && productsData.data.productos.length > 0) {
            const productId = productsData.data.productos[0].producto_id;
            console.log(`Adding product ${productId} to favorites...`);
            
            const addFavoriteResponse = await fetch(`${BASE_URL}/favoritos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ producto_id: productId })
            });
            
            const addFavoriteData = await addFavoriteResponse.json();
            console.log('Add favorite response:', JSON.stringify(addFavoriteData, null, 2));
            
            if (addFavoriteData.exito) {
                console.log('✅ Add favorite successful');
            } else {
                console.log('ℹ️ Add favorite response:', addFavoriteData.mensaje);
            }
        } else {
            console.log('ℹ️ No products available to add to favorites');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testFavorites(); 