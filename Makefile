NPM					= npm

.DEFAULT_GOAL := help
.PHONY: help

help:
	@grep -E '(^[a-zA-Z_-]+:.*?##.*$$)|(^##)' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[32m%-30s\033[0m %s\n", $$1, $$2}' | sed -e 's/\[32m##/[33m/'

##
## Configuration du projet
##---------------------------------------------------------------------------
install: ## Installer et démarrer le projet
install: node_modules start

start: ## Démarrer le projet
start:
	$(NPM) run dev

build: ## Construire le projet
	$(NPM) run build

.PHONY: install start build

##
## Dépendances
##---------------------------------------------------------------------------

node_modules: package.lock
	$(NPM) install
	@touch -c node_modules

package.lock: package.json
	$(NPM) upgrade
