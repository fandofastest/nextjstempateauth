// Simple test for analytics API
const fetch = require('node-fetch');

async function testAnalytics() {
  try {
    console.log('Testing analytics API...');
    
    // First, let's test without auth to see the error
    const response = await fetch('http://localhost:3000/api/analytics', {
      method: 'GET'
    });
    
    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Response:', text);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAnalytics();
