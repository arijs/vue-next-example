# Vue-Next-Example

Your application code is not compiled at all, you save and reload your browser like in the good old times 😁. Components are loaded on the runtime only at the moment they are needed.

Each component is in a folder with 3 files:

```
 +  /
 |--+ comp/
 |  `--+ root/
 |     |--- root.css
 |     |--- root.html
 |     `--- root.js
 `--+ page/
    |--+ about/
    |  |--- about.css
    |  |--- about.html
    |  `--- about.js
    |--+ home/
    |  |--- home.css
    |  |--- home.html
    |  `--- home.js
    `--+ user/
       `--+ details/
          |--- details.css
          |--- details.html
          `--- details.js
```

Components are called this way:
(each two dashes are converted to a slash)

```html
<app--root></app--root>
<page--user--details></page--user--details>
```

## Example of files of a component:

### CSS

```css
.page--user--details {
	/* your style here*/
}
.page--user--details .foo {}
.page--user--details .foo .bar {}
```

### HTML

```html
<div class="page--user--details">
	<h1>User #{{ id }}</h1>
	<p>
		Name: {{ users[id].name }}
	</p>
	<router-link to="/">Back home</router-link>
</div>
```

### JS

```javascript
!function(global) {

global.Page.map['user/details'] = {
	// your component options
	// `template` property will be replaced with your HTML file
	template: null,
	props: ['id'],
	setup: function() {
		// useXYZ...
		var myRef = Vue.ref();
		var myReactive = Vue.reactive({
			foo: 'bar'
		});
		return {
			myRef: myRef,
			myReactive: myReactive
		};
	},
	data: function() {
		return {
			users: global.users
		};
	}
};

}(_app$);
```

## How to run

```
npm install

npm start
```

And open your browser on http://localhost:8070

## License

[MIT](LICENSE).
