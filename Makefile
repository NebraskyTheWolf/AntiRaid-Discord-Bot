GIT_SHA_FETCH := $(shell git rev-parse HEAD)
export GIT_SHA=$(GIT_SHA_FETCH)

builds:
	docker build . -t ghcr.io/fluffici/furraiddb:latest
	docker push ghcr.io/fluffici/furraiddb:latest
