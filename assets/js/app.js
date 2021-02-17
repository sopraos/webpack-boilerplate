import hello from './hello';

document.getElementById('hello').innerHTML = hello;

console.log(hello);

// HotModule
if (module.hot) {
	module.hot.accept();
}
