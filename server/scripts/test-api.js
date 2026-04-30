const axios = require('axios');

async function test() {
    try {
        const res = await axios.get('http://localhost:8080/api/admin/stats');
        console.log('Status:', res.status);
    } catch (err) {
        console.log('Error status:', err.response?.status);
        console.log('Error data:', err.response?.data);
    }
}
test();
