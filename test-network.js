#!/usr/bin/env node

const net = require('net');
const { exec } = require('child_process');

console.log('🔍 测试网络连接...\n');

// 测试局域网连接
function testLocalNetwork() {
  console.log('📡 测试局域网连接...');
  
  // 获取本机IP
  exec('ifconfig | grep "inet " | grep -v 127.0.0.1', (error, stdout) => {
    if (error) {
      console.log('❌ 无法获取本机IP:', error.message);
      return;
    }
    
    const ips = stdout.trim().split('\n').map(line => {
      const match = line.match(/inet (\d+\.\d+\.\d+\.\d+)/);
      return match ? match[1] : null;
    }).filter(ip => ip);
    
    console.log('🏠 本机IP地址:', ips.join(', '));
    
    // 测试常见局域网网段
    const commonRanges = [
      '192.168.1.',
      '192.168.0.',
      '10.0.0.',
      '172.16.0.'
    ];
    
    commonRanges.forEach(range => {
      console.log(`\n🔍 扫描网段 ${range}1-10...`);
      for (let i = 1; i <= 10; i++) {
        const ip = range + i;
        testConnection(ip, 22, 1000); // SSH端口22，超时1秒
      }
    });
  });
}

// 测试连接
function testConnection(host, port, timeout = 5000) {
  const socket = new net.Socket();
  
  socket.setTimeout(timeout);
  
  socket.on('connect', () => {
    console.log(`✅ ${host}:${port} - 连接成功`);
    socket.destroy();
  });
  
  socket.on('timeout', () => {
    console.log(`⏰ ${host}:${port} - 连接超时`);
    socket.destroy();
  });
  
  socket.on('error', (err) => {
    // 静默处理连接错误，避免输出过多信息
    socket.destroy();
  });
  
  socket.connect(port, host);
}

// 测试DNS解析
function testDNS() {
  console.log('\n🌐 测试DNS解析...');
  
  const hosts = [
    'google.com',
    'github.com',
    'localhost'
  ];
  
  hosts.forEach(host => {
    exec(`nslookup ${host}`, (error, stdout) => {
      if (error) {
        console.log(`❌ ${host} - DNS解析失败`);
      } else {
        console.log(`✅ ${host} - DNS解析成功`);
      }
    });
  });
}

// 主函数
function main() {
  console.log('🚀 开始网络诊断...\n');
  
  testDNS();
  testLocalNetwork();
  
  setTimeout(() => {
    console.log('\n✨ 网络测试完成！');
    console.log('\n💡 如果看到连接成功的服务器，说明网络功能正常');
    console.log('💡 如果无法连接局域网服务器，可能需要检查：');
    console.log('   1. 目标服务器是否开启SSH服务');
    console.log('   2. 防火墙设置');
    console.log('   3. 网络路由配置');
  }, 10000);
}

main();
