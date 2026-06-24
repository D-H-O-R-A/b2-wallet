# B2 Wallet - Automation & Deployment Pipeline
# Developed by Better2Better under Tech Lead Diego Oris
# Padrões: Engenharia de Sistemas Senior, Sem referências à IA, Limpo e Eficiente.

.PHONY: all build dev clean test lint deploy-all deploy-extension sign-firefox deploy-sdk deploy-mobile-android deploy-mobile-ios deploy-desktop

# Default task: test and build everything
all: test build

clean:
	@echo "🧹 Limpando artefatos de compilação..."
	rm -rf dist/
	rm -rf apps/desktop/dist/
	rm -rf apps/extension/dist/
	rm -rf packages/sdk-web3/dist/
	rm -rf build/
	rm -rf packages/core-rust/target/
	rm -rf apps/desktop/src-tauri/target/

# Run global tests (Rust and JS/Node suite)
test:
	@echo "🧪 Executando suíte completa de testes integrados..."
	node --test test/*.test.js
	cd packages/core-rust && cargo test

# Run code style auditing
lint:
	@echo "🔍 Executando auditoria e verificação de sintaxe de código..."
	@if [ -f package.json ]; then npm run lint; fi

# Build the unified web app files into a production-ready /dist folder
build: clean
	@echo "📦 Compilando aplicação Web unificada na pasta /dist..."
	mkdir -p dist
	cp -r index.html privacy-policy.html src dist/
	@echo "✅ Aplicação Web compilada com sucesso em /dist/"

deploy-extension:
	@echo "🧩 Sincronizando e empacotando extensões de navegador para múltiplas plataformas..."
	node apps/extension/build-extensions.js
	mkdir -p build
	# Compactando as extensões individuais para cada loja na pasta build/
	cd apps/extension/dist/chrome && zip -r ../../../../build/b2-wallet-chrome.zip ./*
	cd apps/extension/dist/firefox && zip -r ../../../../build/b2-wallet-firefox.zip ./*
	cd apps/extension/dist/opera && zip -r ../../../../build/b2-wallet-opera.zip ./*
	cd apps/extension/dist/edge && zip -r ../../../../build/b2-wallet-edge.zip ./*
	cd apps/extension/dist/safari && zip -r ../../../../build/b2-wallet-safari.zip ./*
	# Mantém b2-wallet-extension.zip mapeado para o build do Chrome por retrocompatibilidade
	cp build/b2-wallet-chrome.zip build/b2-wallet-extension.zip
	@echo "✅ Extensões empacotadas com sucesso na pasta /build:"
	@echo "   - Chrome:   build/b2-wallet-chrome.zip (e build/b2-wallet-extension.zip)"
	@echo "   - Firefox:  build/b2-wallet-firefox.zip"
	@echo "   - Opera:    build/b2-wallet-opera.zip"
	@echo "   - Edge:     build/b2-wallet-edge.zip"
	@echo "   - Safari:   build/b2-wallet-safari.zip"

# Sign Firefox Extension for Self-Distribution
sign-firefox:
	@if [ -z "$(AMO_API_KEY)" ] || [ -z "$(AMO_API_SECRET)" ]; then \
		echo "❌ Erro: As variáveis de ambiente AMO_API_KEY e AMO_API_SECRET são obrigatórias para assinar a extensão."; \
		echo "Obtenha as credenciais em: https://addons.mozilla.org/en-US/developers/addon/api/key/"; \
		exit 1; \
	fi
	@echo "✍️ Assinando extensão para o Firefox via Mozilla API..."
	mkdir -p build
	npx -y web-ext sign --source-dir apps/extension/dist/firefox --api-key="$${AMO_API_KEY}" --api-secret="$${AMO_API_SECRET}" --artifacts-dir ./build
	@echo "✅ Extensão assinada com sucesso! O arquivo .xpi foi gerado na pasta /build."

# Deploy 2: Publish SDK on NPM Registry
deploy-sdk:
	@echo "🚀 Publicando SDK Web3 (b2-wallet-sdk-web3) no NPM Registry..."
	# Publica o workspace específico de forma oficial e pública
	npm publish --workspace=packages/sdk-web3 --access public

# Deploy 3: Build & Sync Capacitor Mobile (Android)
deploy-mobile-android: build
	@echo "📱 Sincronizando arquivos estáticos no app Mobile Android (Capacitor)..."
	npx cap sync android --project apps/mobile
	@echo "✅ Mobile Android sincronizado. Pronto para compilação nativa!"

# Deploy 4: Build & Sync Capacitor Mobile (iOS)
deploy-mobile-ios: build
	@echo "🍎 Sincronizando arquivos estáticos no app Mobile iOS (Capacitor)..."
	npx cap sync ios --project apps/mobile
	@echo "✅ Mobile iOS sincronizado. Pronto para compilação nativa!"

# Deploy 5: Build Tauri Desktop (macOS, Linux, Windows)
deploy-desktop: build
	@echo "🖥️ Compilando aplicação de Desktop com Tauri v2..."
	mkdir -p apps/desktop/dist
	cp -r dist/* apps/desktop/dist/
	cd apps/desktop && npm run tauri build
	@echo "✅ Compilação do aplicativo Desktop concluída com sucesso!"

# Deploy All targets sequentially
deploy-all: deploy-extension deploy-sdk deploy-mobile-android deploy-mobile-ios deploy-desktop
	@echo "🎉 Distribuição multiplataforma da B2 Wallet concluída com sucesso!"
