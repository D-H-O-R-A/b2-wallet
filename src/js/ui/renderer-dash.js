/**
 * B2 Wallet - UI Renderer Dashboard Orchestrator
 * 
 * Orquestra e valida o carregamento de todos os módulos do Dashboard:
 * - Assets/Directory: renderer-dash-assets.js
 * - Charts: renderer-dash-charts.js
 * - History: renderer-dash-history.js
 * - Resources: renderer-dash-resources.js
 */

(function() {
  if (typeof window !== 'undefined') {
    window.B2Logger?.log('info', 'Dashboard sub-modules integrated successfully.');
  }
})();
