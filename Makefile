.PHONY: docker-image

docker-image:
	docker build \
		-t magonx/osaka:latest \
		-t "magonx/osaka:$$(cat package.json | jq '.version' | xargs)" \
		--platform linux/amd64,linux/arm64 \
		.
