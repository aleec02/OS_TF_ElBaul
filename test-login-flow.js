// Using built-in fetch (Node.js 18+)

async function testLoginFlow() {
    console.log('🧪 Testing Login Flow...\n');
    
    try {
        // Test login with valid credentials
        console.log('1. Testing login with valid credentials...');
        const loginResponse = await fetch('http://localhost:3000/api/usuarios/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'cmendoza@gmail.com',
                contrasena: 'CesarM#2023'
            })
        });
        
        const loginData = await loginResponse.json();
        console.log('Login Response Status:', loginResponse.status);
        console.log('Login Response:', JSON.stringify(loginData, null, 2));
        
        if (loginData.exito && loginData.data.token) {
            console.log('✅ Login successful! Token received.');
            
            // Test getting user profile with token
            console.log('\n2. Testing user profile with token...');
            const profileResponse = await fetch('http://localhost:3000/api/usuarios/perfil', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${loginData.data.token}`
                }
            });
            
            const profileData = await profileResponse.json();
            console.log('Profile Response Status:', profileResponse.status);
            console.log('Profile Response:', JSON.stringify(profileData, null, 2));
            
            if (profileData.exito) {
                console.log('✅ Profile retrieved successfully!');
            } else {
                console.log('❌ Profile retrieval failed!');
            }
            
        } else {
            console.log('❌ Login failed!');
        }
        
    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
    }
}

// Run the test
testLoginFlow(); 