const cacheDurationMin = 5;
const cacheDurationMsec = 1000 * 60 * cacheDurationMin;

const put = function (key, value, now) {0
	this.keyValue.set(key, { value: value, ts: now });
	this.size = this.keyValue.size;
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

const keys = function () {
	return this.keyValue.keys();
}

const clear = function() {
	this.keyValue = new Map();
	this.size = this.keyValue.size;
	return this;
}

const cache = {
	put: put,
	get: get,
	keys: keys,
	clear: clear,
	keyValue: undefined,
	durationMsec: cacheDurationMsec,
	size: 0
}

cache.clear();

exports.cache = cache;
