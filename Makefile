build-all-extensions:
	@echo "Building all extensions"
	make build-and-deploy-llrt
	make build-and-deploy-rust

build-and-deploy-llrt:
	@echo "Building and deploying LLRT"
	cd llrt && \
	zip -r extension.zip . && \
	aws lambda publish-layer-version --layer-name "llrt-extension" --zip-file  "fileb://extension.zip" --compatible-architectures arm64 --output json --no-cli-pager && \
	rm extension.zip

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