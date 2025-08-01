module.exports = {
  apps: [{
    name: 'nodex-vpn-server',
    script: './node_modules/.bin/ts-node',
    args: 'src/server.ts',
    cwd: './nodex-vpn-server',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      VPN_TCP_PORT: 8443,
      VPN_UDP_PORT: 8444,
      SERVER_IP: '92.113.32.217',
      JWT_SECRET: 'nodex-super-secret-jwt-key-2024',
      MAX_CONCURRENT_CONNECTIONS: 100,
      CONNECTION_TIMEOUT: 30000,
      KEEP_ALIVE_INTERVAL: 30000,
      LOG_LEVEL: 'info'
    },
    env_development: {
      NODE_ENV: 'development',
      LOG_LEVEL: 'debug'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
}; 