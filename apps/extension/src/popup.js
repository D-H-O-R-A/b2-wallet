/**
 * B2 Wallet Extension - Popup Controller
 * 
 * Desenvolvido sob a coordenação do Tech Lead Diego Oris (Better2Better).
 */

document.addEventListener('DOMContentLoaded', () => {
  const btnOpen = document.getElementById("btn-popup-open");
  const btnLock = document.getElementById("btn-popup-lock");

  btnOpen.addEventListener('click', () => {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
      chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
    } else {
      window.open('index.html', '_blank');
    }
  });

  btnLock.addEventListener('click', () => {
    alert("Extensão bloqueada com sucesso.");
  });
});
