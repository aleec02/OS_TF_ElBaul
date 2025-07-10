async function testLogin() {
    try {
        console.log('Testing login API...');
        
        const response = await fetch('http://localhost:3000/api/usuarios/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'cmendoza@gmail.com',
                contrasena: 'CesarM#2023'
            })
        });
        
        const data = await response.json();
        
        console.log('Response status:', response.status);
        console.log('Response data:', JSON.stringify(data, null, 2));
        
        if (data.exito) {
            console.log('✅ Login successful!');
            console.log('Token:', data.data.token);
            console.log('User:', data.data.usuario.nombre);
        } else {
            console.log('❌ Login failed:', data.mensaje);
        }
        
    } catch (error) {
        console.error('❌ Error testing login:', error.message);
    }
}

testLogin(); 