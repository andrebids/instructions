import axios from 'axios';

async function testTrendingAPI() {
    try {
        console.log('🔥 Testing /api/products/trending endpoint...\n');

        const response = await axios.get('http://localhost:5000/api/products/trending');

        console.log('Status:', response.status);
        console.log('Data length:', response.data.length);
        console.log('\nProducts returned:');
        console.log(JSON.stringify(response.data, null, 2));

    } catch (error) {
        console.error('❌ Error calling API:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

testTrendingAPI();
