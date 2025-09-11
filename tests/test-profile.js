// Quick test script to check profile endpoint
const axios = require('axios');

async function testProfile() {
    try {
        // First, let's try to signin to get a valid token
        const signinResponse = await axios.post('http://localhost:3001/api/v1/user/signin', {
            username: 'test@example.com', // Replace with actual test user
            password: 'password123'
        });
        
        console.log('Signin successful, token received');
        const token = signinResponse.data.token;
        
        // Now test the profile endpoint
        const profileResponse = await axios.get('http://localhost:3001/api/v1/user/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('Profile data:', JSON.stringify(profileResponse.data, null, 2));
        
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

testProfile();
