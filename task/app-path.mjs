import nodePath from 'path';
import url from 'url';

const dirPublic = url.fileURLToPath(new URL('../public/', import.meta.url).href);

var reLastSlash = /\/*$/;
export default function appPath(path) {
	var lastSlash = String(path).match(reLastSlash);
	return nodePath.resolve(dirPublic, path) +
		(lastSlash ? lastSlash[0] : '');
};


