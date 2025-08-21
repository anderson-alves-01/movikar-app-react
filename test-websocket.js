// Simple WebSocket test
import WebSocket from 'ws';

async function testWebSocket() {
  try {
    console.log('🔌 Testing WebSocket connection...');
    
    const ws = new WebSocket('ws://localhost:5000/ws');
    
    ws.on('open', () => {
      console.log('✅ WebSocket connected successfully');
      
      // Send authentication message (you'll need a valid JWT token)
      ws.send(JSON.stringify({
        type: 'authenticate',
        token: 'your-jwt-token-here' // Replace with actual token
      }));
      
      // Send ping to test basic communication
      ws.send(JSON.stringify({
        type: 'ping'
      }));
    });
    
    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      console.log('📨 Received message:', message);
    });
    
    ws.on('close', () => {
      console.log('❌ WebSocket connection closed');
    });
    
    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
    });
    
    // Keep connection open for testing
    setTimeout(() => {
      ws.close();
    }, 5000);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testWebSocket();