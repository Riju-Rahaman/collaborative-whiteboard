const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve the HTML, CSS, and JavaScript content directly
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Collaborative Whiteboard</title>
      <style>
        body {
          margin: 0;
          overflow: hidden;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background-color: #f0f0f0;
        }
        canvas {
          border: 1px solid #000;
          background-color: white;
        }
      </style>
    </head>
    <body>
    
    <canvas id="whiteboard"></canvas>
    
    <script src="/socket.io/socket.io.js"></script>
    <script>
      const socket = io();
      const canvas = document.getElementById('whiteboard');
      const ctx = canvas.getContext('2d');
      let drawing = false;

      // Set the canvas size
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Handle mouse events for drawing
      canvas.addEventListener('mousedown', startDrawing);
      canvas.addEventListener('mousemove', draw);
      canvas.addEventListener('mouseup', stopDrawing);
      canvas.addEventListener('mouseout', stopDrawing);

      function startDrawing(e) {
        drawing = true;
        draw(e);
      }

      function stopDrawing() {
        drawing = false;
        ctx.beginPath();
      }

      function draw(e) {
        if (!drawing) return;

        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'black';

        ctx.lineTo(e.clientX, e.clientY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(e.clientX, e.clientY);

        // Emit drawing data to the server
        socket.emit('drawing', { x: e.clientX, y: e.clientY, isDrawing: drawing });
      }

      // Listen for drawing events from other users
      socket.on('drawing', (data) => {
        if (data.isDrawing) {
          ctx.lineTo(data.x, data.y);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(data.x, data.y);
        }
      });
    </script>
    
    </body>
    </html>
  `);
});

// Handle WebSocket connections
io.on('connection', (socket) => {
  console.log('A user connected');

  // Listen for drawing events and broadcast them to other users
  socket.on('drawing', (data) => {
    socket.broadcast.emit('drawing', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Start the server
server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
