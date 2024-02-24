build-and-deploy-llrt:
	@echo "Building and deploying LLRT"
	cd llrt && \
	zip -r extension.zip . && \
	aws lambda publish-layer-version --layer-name "llrt-extension" --zip-file  "fileb://extension.zip" --compatible-architectures arm64 --output json --no-cli-pager && \
	rm extension.zip

build-and-deploy-node:
	@echo "Building and deploying NodeJS"
	cd node && \
	cd node-extension && \
	npm install && \
	npm run build && \
	cd .. && \
	mkdir -p bundle/node-extension && \
	cp -r extensions bundle && \
	cp node-extension/dist/index.js bundle/node-extension && \
	cd bundle && \
	zip -r extension.zip . && \
	aws lambda publish-layer-version --layer-name "node-extension" --zip-file  "fileb://extension.zip" --compatible-runtimes nodejs --output json --no-cli-pager && \
	cd .. && \
	rm -rf bundle

build-and-deploy-rust:
	@echo "Building and deploying Rust"
	cargo lambda build --manifest-path rust/Cargo.toml --extension --release --arm64 && \
	cargo lambda deploy --manifest-path rust/Cargo.toml --extension

configure-app:
	@echo "Configuring SLS application"
	cd battle-extensions-app && \
	sam build && \
	sam deploy --guided

deploy-app:
	@echo "Building and deploying SLS application"
	cd battle-extensions-app && \
	sam build && \
	sam deploy 