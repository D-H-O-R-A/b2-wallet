/**
 * B2 Wallet - Browser Extension Build Orchestrator
 * 
 * Prepara e personaliza os pacotes da extensão para diferentes navegadores:
 * Chrome, Firefox, Opera, Edge e Safari.
 * Desenvolvido sob a liderança do Tech Lead Diego Oris (Better2Better).
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '../..');
const extDir = path.resolve(__dirname);
const distDir = path.join(extDir, 'dist');

const browsers = ['chrome', 'firefox', 'opera', 'edge', 'safari'];

console.log("🚀 Iniciando empacotamento multi-browser da B2 Wallet...");

// Garante que o diretório de destino limpo exista
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// Carrega o manifest base
const baseManifestPath = path.join(extDir, 'manifest.json');
const baseManifest = JSON.parse(fs.readFileSync(baseManifestPath, 'utf8'));

browsers.forEach(browser => {
  const browserDistDir = path.join(distDir, browser);
  fs.mkdirSync(browserDistDir, { recursive: true });

  // 1. Copia ícones
  fs.cpSync(path.join(extDir, 'icons'), path.join(browserDistDir, 'icons'), { recursive: true });
  
  // 2. Copia arquivos específicos da extensão
  fs.cpSync(path.join(extDir, 'src'), path.join(browserDistDir, 'src'), { recursive: true });

  // 3. Copia páginas base do root do projeto
  fs.copyFileSync(path.join(rootDir, 'index.html'), path.join(browserDistDir, 'index.html'));
  fs.copyFileSync(path.join(rootDir, 'privacy-policy.html'), path.join(browserDistDir, 'privacy-policy.html'));

  // 4. Copia os assets core (css, js, crypto engines) da carteira
  fs.cpSync(path.join(rootDir, 'src'), path.join(browserDistDir, 'src'), { recursive: true });

  // 5. Personalização do manifest.json por navegador
  const manifest = JSON.parse(JSON.stringify(baseManifest)); // Clone profundo

  if (browser === 'firefox') {
    // Firefox MV3 prefere background.scripts sobre service_worker para compatibilidade ampliada
    manifest.background = {
      scripts: ['src/background.js']
    };
    manifest.browser_specific_settings = {
      gecko: {
        id: "extension@b2wallet.com",
        strict_min_version: "109.0",
        data_collection_permissions: {
          required: ["none"]
        }
      }
    };
  }

  // Grava o manifest.json customizado do navegador
  fs.writeFileSync(
    path.join(browserDistDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf8'
  );

  console.log(`   [${browser.toUpperCase()}] Estrutura gerada com sucesso.`);
});

// Atualiza a pasta de desenvolvimento local descompactada (usando a build do Chrome como padrão)
const devDir = path.join(rootDir, 'b2-wallet-extension');
if (fs.existsSync(devDir)) {
  fs.rmSync(devDir, { recursive: true, force: true });
}
fs.mkdirSync(devDir, { recursive: true });
fs.cpSync(path.join(distDir, 'chrome'), devDir, { recursive: true });

console.log("✅ Empacotamento multi-browser concluído com sucesso nas pastas de destino!");
