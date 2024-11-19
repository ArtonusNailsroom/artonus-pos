const fetch = require('node-fetch');

async function registerUser() {
    const response = await fetch('http://localhost:3000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: 'admin',
            password: 'password123',
            role: 'admin'
        })
    });

    const data = await response.text();
    console.log(data);
}

registerUser();
