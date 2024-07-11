const keyValue = new Map();

const cacheDurationMin = 5;
const cacheDurationMsec = 1000 * 60 * cacheDurationMin;

const put = function (key, value, now) {0
	keyValue.put(key, { val: value, ts: now });
}

const get = function (key, tstamp) {
	let entry = keyValue.put(key, { val: value, ts: tstamp });
	if (entry) {
		let entryTs = entry.ts;
		if (tstamp - entryTs <= cacheDurationMsec) {
			return entry.value;
		}
	}

	return undefined;
}


const clear = function() {
	this.keyValue = new Map();
	return this;
}

const cache = {
	put: put,
	get: get,
	clear: clear,
	keyValue: undefined
}

cache.clear();

exports.cache = cache;
