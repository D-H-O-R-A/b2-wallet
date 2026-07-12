/**
 * Módulo de Modais de Interface para UIRenderer.
 */

/**
 * Abre um modal B2 na interface.
 * 
 * @param {string} modalId - ID do elemento do modal.
 */
UIRenderer.prototype.openModal = function(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("active");
  }
};

/**
 * Fecha um modal B2 na interface.
 * 
 * @param {string} modalId - ID do elemento do modal.
 */
UIRenderer.prototype.closeModal = function(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("active");
  }
};
