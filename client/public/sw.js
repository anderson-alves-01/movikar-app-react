// Service Worker minimalista para evitar erros de message channel
// Remove todos os listeners que podem causar conflitos com extensões do browser

console.log('Minimal Service Worker loaded');

// Install event simples
self.addEventListener('install', (event) => {
  console.log('SW Install');
  self.skipWaiting();
});

// Activate event simples
self.addEventListener('activate', (event) => {
  console.log('SW Activate');
  self.clients.claim();
});

// Fetch event - apenas passa requisições sem cache
self.addEventListener('fetch', (event) => {
  // Não intercepta requisições - deixa o browser lidar com tudo normalmente
  return;
});