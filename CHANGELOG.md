# CHANGELOG

## [1.2.1] - 2019-05-03

[Changed]

* La valeur par défaut de l'option Babel `useBuiltIns` est passée de `entry` à `false`, ce qui signifie que les remplissages multiples ne peuvent plus être fournis de la même manière. Cela est dû à un changement de Babel et de core-js. Pour obtenir la même fonctionnalité, lancez `npm install core-js --dev`.

* Ajout du fichier `Makefile`

## 1.2.0

* Ajout du fichier `.babelrc`
* Ajout du fichier `.editorconfig`

Changement du nom de fichier src en `assets`
