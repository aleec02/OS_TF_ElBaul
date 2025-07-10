const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Función para hacer login y obtener token
async function login() {
    try {
        const response = await axios.post(`${BASE_URL}/usuarios/login`, {
            email: 'cmendoza@gmail.com',
            contrasena: 'CesarM#2023'
        });
        
        if (response.data.exito) {
            console.log('✅ Login exitoso');
            return response.data.data.token;
        } else {
            console.log('❌ Login falló:', response.data.mensaje);
            return null;
        }
    } catch (error) {
        console.log('❌ Error en login:', error.response?.data || error.message);
        return null;
    }
}

// Función para probar carrito
async function testCarrito(token) {
    console.log('\n🛒 Probando Carrito...');
    
    try {
        // Ver carrito
        const carritoResponse = await axios.get(`${BASE_URL}/carrito`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Ver carrito:', carritoResponse.data.exito ? 'OK' : 'FALLÓ');
        
        // Agregar producto al carrito
        const agregarResponse = await axios.post(`${BASE_URL}/carrito/items`, {
            producto_id: 'PR300001',
            cantidad: 1
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Agregar al carrito:', agregarResponse.data.exito ? 'OK' : 'FALLÓ');
        
        // Ver carrito actualizado
        const carritoActualizado = await axios.get(`${BASE_URL}/carrito`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Carrito actualizado:', carritoActualizado.data.exito ? 'OK' : 'FALLÓ');
        
    } catch (error) {
        console.log('❌ Error en carrito:', error.response?.data?.mensaje || error.message);
    }
}

// Función para probar favoritos
async function testFavoritos(token) {
    console.log('\n❤️ Probando Favoritos...');
    
    try {
        // Ver favoritos
        const favoritosResponse = await axios.get(`${BASE_URL}/favoritos`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Ver favoritos:', favoritosResponse.data.exito ? 'OK' : 'FALLÓ');
        
        // Agregar a favoritos
        const agregarResponse = await axios.post(`${BASE_URL}/favoritos`, {
            producto_id: 'PR300002'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Agregar a favoritos:', agregarResponse.data.exito ? 'OK' : 'FALLÓ');
        
        // Verificar si está en favoritos
        const verificarResponse = await axios.get(`${BASE_URL}/favoritos/verificar/PR300002`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Verificar favorito:', verificarResponse.data.exito ? 'OK' : 'FALLÓ');
        
    } catch (error) {
        console.log('❌ Error en favoritos:', error.response?.data?.mensaje || error.message);
    }
}

// Función para probar publicaciones
async function testPublicaciones() {
    console.log('\n📝 Probando Publicaciones...');
    
    try {
        // Ver feed de publicaciones
        const publicacionesResponse = await axios.get(`${BASE_URL}/publicaciones`);
        console.log('✅ Ver publicaciones:', publicacionesResponse.data.exito ? 'OK' : 'FALLÓ');
        
        if (publicacionesResponse.data.data.publicaciones.length > 0) {
            const primeraPublicacion = publicacionesResponse.data.data.publicaciones[0];
            console.log(`   - Primera publicación: ${primeraPublicacion.contenido.substring(0, 50)}...`);
            
            // Ver comentarios de la primera publicación
            const comentariosResponse = await axios.get(`${BASE_URL}/publicaciones/${primeraPublicacion.publicacion_id}/comentarios`);
            console.log('✅ Ver comentarios:', comentariosResponse.data.exito ? 'OK' : 'FALLÓ');
        }
        
    } catch (error) {
        console.log('❌ Error en publicaciones:', error.response?.data?.mensaje || error.message);
    }
}

// Función para probar productos
async function testProductos() {
    console.log('\n📦 Probando Productos...');
    
    try {
        // Ver productos
        const productosResponse = await axios.get(`${BASE_URL}/productos`);
        console.log('✅ Ver productos:', productosResponse.data.exito ? 'OK' : 'FALLÓ');
        
        if (productosResponse.data.data.productos.length > 0) {
            const primerProducto = productosResponse.data.data.productos[0];
            console.log(`   - Primer producto: ${primerProducto.titulo} - $${primerProducto.precio}`);
            
            // Ver detalle del producto
            const detalleResponse = await axios.get(`${BASE_URL}/productos/${primerProducto.producto_id}`);
            console.log('✅ Ver detalle producto:', detalleResponse.data.exito ? 'OK' : 'FALLÓ');
        }
        
    } catch (error) {
        console.log('❌ Error en productos:', error.response?.data?.mensaje || error.message);
    }
}

// Función principal
async function runTests() {
    console.log('🚀 Iniciando pruebas de funcionalidades básicas...\n');
    
    // Login
    const token = await login();
    if (!token) {
        console.log('❌ No se pudo obtener token. Abortando pruebas.');
        return;
    }
    
    // Ejecutar pruebas
    await testProductos();
    await testCarrito(token);
    await testFavoritos(token);
    await testPublicaciones();
    
    console.log('\n✅ Pruebas completadas!');
}

// Ejecutar pruebas
runTests().catch(console.error); 