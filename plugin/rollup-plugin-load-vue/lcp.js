
const rePathSep = /\/+/g;

export default function getLongestCommonPath(files) {
	let longest;
	const fc = files.length;
	for (let i = 0; i < fc; i++) {
		const p = files[i].split(rePathSep);
		if (longest) {
			let j;
			let lc = longest.length;
			let pc = Math.min(lc, p.length);
			for (j = 0; j < pc; j++) {
				if (p[j] !== longest[j]) break;
			}
			longest.splice(j, lc - j);
		} else {
			longest = p;
		}
		if (!longest.length) break;
	}
	return longest;
}
