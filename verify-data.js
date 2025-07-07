require('dotenv').config();
const mongoose = require('mongoose');

async function verifyData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27020/elbaul_db');
        
        const db = mongoose.connection.db;
        const collections = ['productos', 'categorias', 'usuarios'];
        
        console.log('📊 Database Status:');
        for (const collection of collections) {
            const count = await db.collection(collection).countDocuments();
            console.log(`   ${collection}: ${count} documents`);
            
            if (count > 0) {
                const sample = await db.collection(collection).findOne({});
                console.log(`   Sample ${collection.slice(0, -1)}:`, sample?.titulo || sample?.nombre || sample?.email || 'Unknown');
            }
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

verifyData();