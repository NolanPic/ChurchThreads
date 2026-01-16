#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');

console.log('Setting up SSL certificates...');

try {
  // Check if mkcert is available
  execSync('mkcert -version', { stdio: 'pipe' });

  // Install CA if not already done
  execSync('mkcert -install', { stdio: 'inherit' });
  
  // Check if certificates already exist
  if (fs.existsSync('_wildcard.churchthreads.dev.pem')) {
    console.log('Certificates already exist');
  } else {
    execSync('mkcert "*.churchthreads.dev" churchthreads.dev', { stdio: 'inherit' });
    console.log('Generated new certificates');
  }
  
  console.log('✅ SSL certificates ready');
} catch (error) {
  console.error('❌ mkcert not found. Please install mkcert first.');
  process.exit(1);
}