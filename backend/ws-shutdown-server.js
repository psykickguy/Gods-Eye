const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8081 }); // Pick a port

function broadcastShutdown() {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send('shutdown');
    }
  });
}

module.exports = { wss, broadcastShutdown };
