// Glory Simon Interiors - Developer Process Runner
const { spawn } = require('child_process');
const path = require('path');

console.log('\n================================================================');
console.log('Starting Glory Simon Interiors Material Tracker Application...');
console.log('================================================================\n');

// 1. Start Backend API Server
console.log('[Runner] Starting Backend Server (Express + DB)...');
const backend = spawn('node', ['server.js'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  shell: true
});

// 2. Start Frontend Dev Client (Vite)
console.log('[Runner] Starting Frontend Client (Vite + React)...');
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const frontend = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(__dirname, 'frontend'),
  stdio: 'inherit',
  shell: true
});

// 3. Graceful shutdown handler
const shutdown = () => {
  console.log('\n[Runner] Shutting down application processes...');
  
  if (process.platform === 'win32') {
    // On Windows, child processes might not die with kill(), so we force-kill the process tree
    spawn('taskkill', ['/pid', backend.pid, '/f', '/t']);
    spawn('taskkill', ['/pid', frontend.pid, '/f', '/t']);
  } else {
    backend.kill('SIGINT');
    frontend.kill('SIGINT');
  }
  
  console.log('[Runner] Cleaned up all active processes. Goodbye!\n');
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
