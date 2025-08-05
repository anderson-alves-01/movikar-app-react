// Script para prevenir erros de extensões do browser
// Captura e silencia erros de "message channel closed" causados por extensões

(function() {
  'use strict';
  
  // Captura erros não tratados do tipo "message channel closed"
  window.addEventListener('unhandledrejection', function(event) {
    const error = event.reason;
    
    // Verifica se é o erro específico de message channel
    if (error && error.message && 
        error.message.includes('message channel closed') ||
        error.message.includes('listener indicated an asynchronous response')) {
      
      console.log('Browser extension error suppressed:', error.message);
      event.preventDefault(); // Impede que apareça no console
      return false;
    }
  });

  // Também captura erros de runtime
  window.addEventListener('error', function(event) {
    if (event.error && event.error.message && 
        event.error.message.includes('message channel closed')) {
      
      console.log('Browser extension runtime error suppressed');
      event.preventDefault();
      return false;
    }
  });

  console.log('Extension conflict prevention loaded');
})();