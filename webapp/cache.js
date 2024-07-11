const cacheDurationMin = 5;
const cacheDurationMsec = 1000 * 60 * cacheDurationMin;

const put = function (key, value, now) {0
	this.keyValue.set(key, { value: value, ts: now });
	return this;
}

const get = function (key, tstamp) {
	let entry = this.keyValue.get(key);
	if (entry) {
		let entryTs = entry.ts;
		let diff = tstamp - entryTs;
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
