##
## Project
## -------
##

install: ## Installer et démarrer le projet
install: npm-install start

start: ## Démarrer le projet
	npm run dev

build: ## Construire le projet
	npm run build

.PHONY: install start build

##
## Utils
## -----
##

npm-install: ## Installer les dépendances de npm
	npm install

.PHONY: npm-install



.DEFAULT_GOAL := help
help:
	@grep -E '(^[a-zA-Z_-]+:.*?##.*$$)|(^##)' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[32m%-30s\033[0m %s\n", $$1, $$2}' | sed -e 's/\[32m##/[33m/'
.PHONY: help
