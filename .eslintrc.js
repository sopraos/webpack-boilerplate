module.exports = {
	"root": true,
	"parser": "babel-eslint",
	"parserOptions": {
		"ecmaVersion": 2017,
		"sourceType": "module"
	},
	"extends": ["eslint:recommended"],
	"env": {
		"node": true,
		"es6": true,
		"browser": true
	},
	"rules": {
		"quotes": ["error", "single"],
		"no-console": "off",
		"no-undef": "error",
		"no-extra-semi": "error",
		"indent": [2, "tab", { "SwitchCase": 1 }],
		"no-tabs": 0,
		"no-unused-vars": ["error", { "args": "none" }],
		"semi": "error",
		"semi-spacing": "error",
		"block-spacing": "error",
		"arrow-spacing": "error",
		"key-spacing": "error",
		"space-infix-ops": "error",
		"no-empty-character-class": "error",
		"no-multiple-empty-lines": ["error", { "max": 1, "maxEOF": 0 }],
		"no-empty": "off",
		"eol-last": "error",
		"keyword-spacing": ["error", { "before": true, "after": true }],
	}
};
