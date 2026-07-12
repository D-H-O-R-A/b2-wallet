/**
 * Módulo de Helpers Utilitários de Formatação e Interface para UIRenderer.
 */

/**
 * Formata saldos de cripto/tokens com o número exato de decimais sem arredondamentos ou zeros desnecessários.
 */
UIRenderer.prototype.formatCryptoBalance = function(balance, decimals = 8) {
  if (balance === undefined || balance === null) return "0";
  const num = Number(balance);
  if (isNaN(num)) return "0";
  const fixedStr = num.toFixed(decimals || 8);
  let trimmed = fixedStr.replace(/\.?0+$/, "");
  if (trimmed === "0" && num > 0) {
    return num.toString();
  }
  return trimmed;
};
