const net = require('net');
const { exec } = require('child_process');

const PORT = 4000;

if (process.platform === 'win32') {
    exec(`netstat -ano | findstr :${PORT}`, (err, stdout) => {
        if (err || !stdout) {
            console.log(`Port ${PORT} is free.`);
            return;
        }
        const lines = stdout.trim().split('\n');
        lines.forEach(line => {
            const parts = line.trim().split(/\s+/);
            const pid = parts[parts.length - 1];
            if (pid && pid !== '0') {
                console.log(`Killing PID ${pid}...`);
                exec(`taskkill /F /PID ${pid}`);
            }
        });
    });
} else {
    // Linux/WSL
    exec(`netstat -tlpn | grep :${PORT}`, (err, stdout) => {
        if (err || !stdout) {
            console.log(`Port ${PORT} is free (or requires sudo to see).`);
            // Try blind kill of node processes running api-gateway index.js? Too risky.
            // Try fuser again? No.
            // Try pkill -f "node index.js" inside api-gateway folder?
            console.log("Trying pkill...");
            exec('pkill -f "node index.js"', (err) => {
                if (!err) console.log("Killed node index.js processes.");
            });
            return;
        }
        const lines = stdout.trim().split('\n');
        lines.forEach(line => {
            const parts = line.trim().split(/\s+/);
            // tcp 0 0 :::4000 :::* LISTEN 12345/node
            const pidInfo = parts.find(p => p.includes('/node')); // 12345/node
            if (pidInfo) {
                const pid = pidInfo.split('/')[0];
                console.log(`Killing PID ${pid}...`);
                process.kill(pid, 'SIGKILL');
            }
        });
    });
}
