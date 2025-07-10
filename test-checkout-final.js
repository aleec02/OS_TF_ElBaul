const API_BASE = 'http://localhost:3000/api';

// Test user credentials
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
        console.error('❌ Login error:', error);
        return false;
    }
}

async function testCheckout() {
    try {
        console.log('🧪 Testing checkout functionality...');
        
        // Test cart data
        const cartResponse = await fetch(`${API_BASE}/carrito`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const cartData = await cartResponse.json();
        
        console.log('📦 Cart data:', cartData);
        
        if (cartData.exito && cartData.data.items && cartData.data.items.length > 0) {
            console.log('✅ Cart has items, testing checkout...');
            
            // Test checkout with sample data
            const checkoutData = {
                direccion_envio: {
                    nombre: 'Test User',
                    telefono: '123456789',
                    direccion: 'Test Address 123',
                    ciudad: 'Test City',
                    codigo_postal: '12345'
                },
                metodo_pago: 'efectivo',
                notas: 'Test order from script'
            };
            
            const checkoutResponse = await fetch(`${API_BASE}/ordenes/checkout`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(checkoutData)
            });
            
            const checkoutResult = await checkoutResponse.json();
            console.log('💳 Checkout result:', checkoutResult);
            
            if (checkoutResult.exito) {
                console.log('✅ Checkout successful!');
                console.log('📋 Order ID:', checkoutResult.data.orden.orden_id);
                return true;
            } else {
                console.log('❌ Checkout failed:', checkoutResult.mensaje);
                return false;
            }
        } else {
            console.log('⚠️ Cart is empty, cannot test checkout');
            return false;
        }
    } catch (error) {
        console.error('❌ Checkout test error:', error);
        return false;
    }
}

async function runTest() {
    console.log('🚀 Starting checkout test...');
    
    const loginSuccess = await login();
    if (!loginSuccess) {
        console.log('❌ Cannot proceed without login');
        return;
    }
    
    const checkoutSuccess = await testCheckout();
    
    if (checkoutSuccess) {
        console.log('🎉 All tests passed! Checkout is working correctly.');
    } else {
        console.log('❌ Some tests failed. Check the logs above.');
    }
}

runTest(); 