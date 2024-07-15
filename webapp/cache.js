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
		if (tstamp - entryTs <= cacheDurationMsec) {
			return entry.value;
		}
	}

	return undefined;
}

const del = function (key) {
	this.keyValue.delete(key);
	this.size = this.keyValue.size;
	return this;
}

const keys = function () {
	return this.keyValue.keys();
}

const clear = function() {
	this.keyValue = new Map();
	this.size = this.keyValue.size;
	return this;
}

const expire = function() {
  let expiredkeys = [...this.keys()].filter(
	k => (undefined === cache.get(k, Date.now()))).map(
		(expiredKey) => this.delete(expiredKey));
}

const cache = {
	put: put,
	get: get,
	delete: del,
	keys: keys,
	clear: clear,
	expire: expire,
	keyValue: undefined,
	durationMsec: cacheDurationMsec,
	size: 0
}

cache.clear();

exports.cache = cache;
