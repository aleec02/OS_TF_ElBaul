require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27020/elbaul_db';

async function loadJSONData() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB');

        const dataDir = path.join(__dirname, 'data');
        
        // Correct mapping of JSON files to collection names
        const fileToCollectionMap = {
            'categoria.json': 'categorias',
            'usuarios.json': 'usuarios', 
            'producto.json': 'productos',
            'carrito.json': 'carritos',
            'item_carrito.json': 'item_carritos',
            'favorito.json': 'favoritos',
            'orden.json': 'ordenes',
            'item_orden.json': 'item_ordenes',
            'resena.json': 'resenas',
            'publicaciones.json': 'publicaciones',
            'comentarios.json': 'comentarios',
            'reacciones.json': 'reacciones',
            'envio.json': 'envios',
            'devolucion.json': 'devoluciones',
            'pago.json': 'pagos',
            'inventario.json': 'inventarios',
            'cupon_descuento.json': 'cupon_descuentos',
            'notificaciones.json': 'notificaciones',
            'temas.json': 'temas'
        };

        console.log('🗑️ Clearing existing data...');
        const db = mongoose.connection.db;
        
        // Clear ALL collections (including the incorrectly named ones)
        const collections = await db.listCollections().toArray();
        for (const collection of collections) {
            await db.collection(collection.name).deleteMany({});
            console.log(`   Cleared ${collection.name}`);
        }

        console.log('\n📦 Loading JSON data...');
        
        for (const [filename, collectionName] of Object.entries(fileToCollectionMap)) {
            const filePath = path.join(dataDir, filename);
            
            if (fs.existsSync(filePath)) {
                try {
                    const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    
                    if (Array.isArray(jsonData) && jsonData.length > 0) {
                        await db.collection(collectionName).insertMany(jsonData);
                        console.log(`✅ Loaded ${jsonData.length} documents into ${collectionName}`);
                    } else {
                        console.log(`⚠️  ${filename} is empty or not an array`);
                    }
                } catch (error) {
                    console.error(`❌ Error loading ${filename}:`, error.message);
                }
            } else {
                console.log(`⚠️  ${filename} not found`);
            }
        }

        // Verify data was loaded correctly
        console.log('\n📊 Verification:');
        const productos = await db.collection('productos').countDocuments();
        const categorias = await db.collection('categorias').countDocuments();
        const usuarios = await db.collection('usuarios').countDocuments();
        
        console.log(`   Products: ${productos}`);
        console.log(`   Categories: ${categorias}`);
        console.log(`   Users: ${usuarios}`);
        
        if (productos > 0) {
            console.log('\n🎉 Data loaded successfully!');
            console.log('You can now test your API at: http://localhost:3000/api/productos');
        } else {
            console.log('\n⚠️  No products were loaded. Check your producto.json file.');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

loadJSONData();