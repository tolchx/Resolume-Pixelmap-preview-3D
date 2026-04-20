const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const sharp = require('sharp');
const tb = require('@napolab/texture-bridge');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(__dirname));

let receiver = null;
let isConnected = false;
let currentSender = '';

wss.on('connection', (ws) => {
    console.log('Client connected to Spout WebSocket');
    // Send initial status
    ws.send(JSON.stringify({ type: 'status', connected: isConnected, sender: currentSender }));
    ws.on('close', () => console.log('Client disconnected'));
});

function broadcastStatus() {
    const msg = JSON.stringify({ type: 'status', connected: isConnected, sender: currentSender });
    for (const client of wss.clients) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(msg);
        }
    }
}

function initSpout() {
    try {
        const senders = tb.listSenders();
        if (senders && senders.length > 0) {
            // El listSenders() devuelve un array de objetos [{ name: "..." }]
            currentSender = typeof senders[0] === 'object' ? senders[0].name : senders[0];
            receiver = new tb.TextureReceiver(currentSender);
            isConnected = true;
            console.log('Connected to Spout sender:', currentSender);
            broadcastStatus();
        } else {
            if (isConnected) {
                isConnected = false;
                currentSender = '';
                broadcastStatus();
            }
            setTimeout(initSpout, 2000);
        }
    } catch (e) {
        console.error('Error init Spout:', e);
        isConnected = false;
        currentSender = '';
        setTimeout(initSpout, 2000);
    }
}

initSpout();

let isProcessing = false;

async function broadcastFrame() {
    if (!isProcessing && isConnected && receiver && receiver.hasNewFrame()) {
        isProcessing = true;
        try {
            const frameObj = receiver.receiveFrame();
            const width = receiver.getWidth();
            const height = receiver.getHeight();
            
            if (frameObj && frameObj.data && width > 0 && height > 0) {
                // The frameObj contains { data: Uint8Array/Buffer, width, height }
                // Spout frames come from OpenGL (bottom-left origin).
                // We apply ONLY flip() to make the image right-side up. No flop() needed.
                const jpegBuffer = await sharp(frameObj.data, {
                    raw: { width, height, channels: 4 }
                }).flip().jpeg({ quality: 60 }).toBuffer();
                
                for (const client of wss.clients) {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(jpegBuffer); // Send binary
                    }
                }
            } else {
                // Ignore null frames, just wait for the next tick
                // Spout sender might not have the first frame ready immediately
            }
        } catch (err) {
            console.error('Error processing frame:', err);
        } finally {
            isProcessing = false;
        }
    }
    
    // Check if disconnected
    // Some Spout wrappers return isConnected=false while still streaming successfully if they only check initial connection status.
    // Instead, we will assume it's disconnected if it's no longer in the listSenders array.
    if (isConnected && receiver) {
        try {
            const senders = tb.listSenders().map(s => typeof s === 'object' ? s.name : s);
            if (!senders.includes(currentSender)) {
                console.log('Spout sender lost (not in list).');
                isConnected = false;
                currentSender = '';
                broadcastStatus();
                setTimeout(initSpout, 2000);
            }
        } catch(e) {}
    }
    
    // Schedule next frame (~30 FPS)
    setTimeout(broadcastFrame, 33);
}

broadcastFrame();

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Spout Server running on http://localhost:${PORT}`);
});
