#!/usr/bin/env node
const fs = require('fs');
const { execSync } = require('child_process');
const os = require('os');

console.log('Setting up local DNS for *.churchthreads.dev...');

if (os.platform() === 'darwin') {
  try {
    // Check if dnsmasq is available
    execSync('brew list dnsmasq', { stdio: 'pipe' });
    
    // Configure dnsmasq
    const dnsmasqConf = '/opt/homebrew/etc/dnsmasq.conf';
    const config = 'address=/churchthreads.dev/127.0.0.1\n';
    
    if (fs.existsSync(dnsmasqConf)) {
      const currentConfig = fs.readFileSync(dnsmasqConf, 'utf8');
      if (!currentConfig.includes('churchthreads.dev')) {
        fs.appendFileSync(dnsmasqConf, config);
        console.log('Added churchthreads.dev to dnsmasq config');
      } else {
        console.log('dnsmasq already configured for churchthreads.dev');
      }
    } else {
      fs.writeFileSync(dnsmasqConf, config);
      console.log('Created dnsmasq config');
    }
    
    // Start dnsmasq
    execSync('sudo brew services start dnsmasq', { stdio: 'inherit' });
    
    // Add resolver with sudo
    execSync('sudo mkdir -p /etc/resolver', { stdio: 'inherit' });
    
    // Check if resolver already exists
    if (!fs.existsSync('/etc/resolver/churchthreads.dev')) {
      execSync('echo "nameserver 127.0.0.1" | sudo tee /etc/resolver/churchthreads.dev', { stdio: 'inherit' });
      console.log('Created DNS resolver');
    } else {
      console.log('DNS resolver already exists');
    }
    
    console.log('✅ DNS setup complete for macOS');
  } catch (error) {
    console.error('❌ dnsmasq not found. Please install dnsmasq first.');
    process.exit(1);
  }
} else {
  console.log('⚠️  Manual DNS setup required for your OS');
  console.log('Add these entries to /etc/hosts:');
  console.log('127.0.0.1 churchthreads.dev');
  console.log('127.0.0.1 *.churchthreads.dev');
}