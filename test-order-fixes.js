// Test script to verify order fixes
const BASE_URL = 'http://localhost:3000/api';

async function testOrderFixes() {
    console.log('🧪 Testing Order Fixes...\n');
    
    try {
        // Test 1: Get orders list
        console.log('1️⃣ Testing orders list...');
        const ordersResponse = await fetch(`${BASE_URL}/ordenes?limit=5`);
        const ordersData = await ordersResponse.json();
        
        if (ordersData.exito) {
            console.log('✅ Orders list loaded successfully');
            console.log(`📊 Found ${ordersData.data.ordenes.length} orders`);
            
            // Check date formatting
            const firstOrder = ordersData.data.ordenes[0];
            if (firstOrder) {
                console.log(`📅 First order date: ${firstOrder.fecha_orden}`);
                console.log(`🆔 Order ID: ${firstOrder.orden_id}`);
                console.log(`💰 Total: S/ ${firstOrder.total}`);
                console.log(`📊 Status: ${firstOrder.estado}`);
            }
        } else {
            console.log('❌ Failed to load orders list');
        }
        
        // Test 2: Get order detail
        console.log('\n2️⃣ Testing order detail...');
        if (ordersData.exito && ordersData.data.ordenes.length > 0) {
            const orderId = ordersData.data.ordenes[0].orden_id;
            console.log(`🔍 Testing order detail for: ${orderId}`);
            
            const detailResponse = await fetch(`${BASE_URL}/ordenes/${orderId}`);
            const detailData = await detailResponse.json();
            
            if (detailData.exito) {
                console.log('✅ Order detail loaded successfully');
                const order = detailData.data.orden;
                const items = detailData.data.items;
                
                console.log(`📅 Order date: ${order.fecha_orden}`);
                console.log(`💰 Order total: S/ ${order.total}`);
                console.log(`📦 Items count: ${items.length}`);
                
                if (items.length > 0) {
                    console.log('📋 Items details:');
                    items.forEach((item, index) => {
                        console.log(`   ${index + 1}. ${item.producto?.titulo || 'Unknown'} - Qty: ${item.cantidad} - Price: S/ ${item.precio_unitario}`);
                    });
                }
            } else {
                console.log('❌ Failed to load order detail');
            }
        }
        
        console.log('\n🎉 Order fixes test completed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testOrderFixes(); 