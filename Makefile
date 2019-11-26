NPM				= npm

.DEFAULT_GOAL := help
.PHONY: help

help:
	@grep -E '(^[a-zA-Z_-]+:.*?##.*$$)|(^##)' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[32m%-30s\033[0m %s\n", $$1, $$2}' | sed -e 's/\[32m##/[33m/'

##
## Configuration du projet
##---------------------------------------------------------------------------
install: node_modules start ## Installer et démarrer le projet

start: assets	## Démarrer le projet

.PHONY: install start

##
## Assets
##---------------------------------------------------------------------------
assets: node_modules	## Construire la version de développement des assets
	$(NPM) run dev

assets-prod: node_modules	## Construire la version de production des assets
	$(NPM) run build

.PHONY: assets assets-prod

##
## Dépendances
##---------------------------------------------------------------------------
# Règles de fichiers
node_modules: package.lock
	$(NPM) install

package.lock: package.json
	@echo pakage.lock n\'est pas à jour.

