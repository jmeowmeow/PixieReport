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


const cache = {
	put: put,
	get: get,
	keyValue: keyValue
}

exports.cache = cache;
