import path from "path";
import fs from "fs";
import { normalizePath } from "vite";
import { compile } from '@vue/compiler-dom';
import getLcp from "./lcp";

const acm = fs.constants.F_OK | fs.constants.R_OK;
const fsp = fs.promises;
const PLUGIN_NAME = '@vue-mfc';
// const reJs = /\.js$/i;
const rePathAbs = /^(\w+:)?[\\\/]+/i;
const fsOpt = { encoding: 'utf8' };
let NR = 0;

function buildScriptRender(compName, compPath, html) {
	return `
assembleComponent(${JSON.stringify(compName)}, ${JSON.stringify(compPath)}, function() {
	${compile(html, { prefixIdentifiers: true }).code};
});
`;
}


const virtualGlobalVar = `${PLUGIN_NAME}/globalVar`;

const virtualGlobalPlugin = {
	name: virtualGlobalVar, // required, will show up in warnings and errors
	resolveId(id) {
		if (id === virtualGlobalVar) {
			return virtualGlobalVar;
		}
	},
	load(id) {
		if (id === virtualGlobalVar) {
			return `
const obj = {};
const hop = Object.prototype.hasOwnProperty;
export function initGlobal(name) {
	if (!hop.call(obj, name)) {
		obj[name] = { map: {} };
	}
}
export function assembleComponent(croot, cpath, getRender) {
	const gc = obj[croot];
	const comp = gc.map[cpath];
	comp.render = getRender();
}
export default obj;
`;
		}
	}
}


export default function loadVue (name, dirComp, globalVar) {
	NR += 1;
	let dirRoot;
	let compBase;
	const pluginRef = `${PLUGIN_NAME}/${NR}_${name}:`;
	return [virtualGlobalPlugin, {
		name: pluginRef, // this name will show up in warnings and errors
		configResolved({root}) {
			// store the resolved config
			dirRoot = root;
			compBase = normalizePath(path.resolve(dirRoot, dirComp));
		},
		async resolveId ( originalSource, importer ) {
			const source = normalizePath(path.isAbsolute(originalSource)
				? path.resolve(dirRoot, originalSource.replace(rePathAbs, ''))
				: path.resolve(path.dirname(importer), originalSource));
			const base = path.basename(source);
			const lcp = getLcp([
				compBase,
				source,
			]).join('/');
			// this.error(JSON.stringify({compBase, source, originalSource, lcp, importer, base, same: lcp === compBase}, null, 2));
			if (lcp !== compBase) return null;
			// const pCss  = path.join(source, `${base}.css` );
			// const pHtml = path.join(source, `${base}.html`);
			const pJs   = path.join(source, `${base}.js`  );
			let css, html, js;
			await Promise.all([
				// css and html are optional
				// fs.access(pCss , acm).then(() => css  = true, e => css  = e),
				// fs.access(pHtml, acm).then(() => html = true, e => html = e),
				fsp.access(pJs  , acm).then(() => js   = true, e => js   = e),
			]);
			if (js === true) {
				return pluginRef + pJs; // this signals that rollup should not ask other plugins or check the file system to find this id
			} else if (js) {
				this.error(`LoadVue: could not load js - ${js}`);
			}
			return null; // other ids should be handled as usually
		},
		async load ( id ) {
			if (!id.startsWith(pluginRef)) return null;
			// other ids should be handled as usually
			// throw new Error(`LoadVue: load() not implemented for ${JSON.stringify(id)}`);
			const pJs = id.substr(pluginRef.length);
			const source = path.dirname(pJs);
			const base = path.basename(source);
			const pHtml = path.join(source, `${base}.html`);
			const pCss  = path.join(source, `${base}.css` );
			const compPath = path.relative(compBase, source);
			let fJs  , eJs  ;
			let fHtml, eHtml;
			let fCss , eCss ;
			await Promise.all([
				fsp.readFile(pJs  , fsOpt).then(f => fJs   = f, e => eJs   = e),
				fsp.readFile(pHtml, fsOpt).then(f => fHtml = f, e => eHtml = e),
				fsp.access  (pCss , fsOpt).then(()=> fCss  = 1, e => eCss  = e),
			]);
			if (eJs) {
				this.error(`LoadVue: could not load js - ${eJs}`);
				return null;
			}
			let render = '';
			if (fCss) render += `
import "${pCss}";
`;
			render += `
import ${globalVar}, { initGlobal, assembleComponent } from "${virtualGlobalVar}";
initGlobal(${JSON.stringify(name)});

${fJs}
`;
			if (fHtml) {
				render += buildScriptRender(name, compPath, fHtml);
			}
			render += `\nexport default ${globalVar}[${JSON.stringify(name)}].map[${JSON.stringify(compPath)}]`;
			return render;
		}
	}];
}
