// Simple test to check profile endpoint
const http = require('http');

// First get a token by signing in
const signinData = JSON.stringify({
    username: 'shr6219@gmail.com',
    password: 'password123'
});

const signinOptions = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/v1/user/signin',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(signinData)
    }
};

console.log('Testing signin...');
const signinReq = http.request(signinOptions, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('Signin response:', data);
        
        if (res.statusCode === 200) {
            const response = JSON.parse(data);
            const token = response.token;
            console.log('Token received, testing profile endpoint...');
            
            // Now test profile endpoint
            const profileOptions = {
                hostname: 'localhost',
                port: 3001,
                path: '/api/v1/user/profile',
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            };
            
            const profileReq = http.request(profileOptions, (profileRes) => {
                let profileData = '';
                profileRes.on('data', (chunk) => {
                    profileData += chunk;
                });
                
                profileRes.on('end', () => {
                    console.log('Profile response status:', profileRes.statusCode);
                    console.log('Profile response:', profileData);
                });
            });
            
            profileReq.on('error', (err) => {
                console.error('Profile request error:', err);
            });
            
            profileReq.end();
        }
    });
});

signinReq.on('error', (err) => {
    console.error('Signin request error:', err);
});

signinReq.write(signinData);
signinReq.end();
