const cacheDurationMin = 5;
const cacheDurationMsec = 1000 * 60 * cacheDurationMin;

const put = function (key, value, now) {
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
	k => (undefined === this.get(k, Date.now()))).map(
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

const increment = function(client, tstamp) {
  let count = this.get(client, tstamp);
  if (!count) { count = 0; }
  this.put(client, count+1, tstamp); 
};

const showclients = function() {
	this.expire();
	let byCountDescending = [...this.keys()].map( key => [key, this.get(key, Date.now())]).sort( (u, v) => (v[1] - u[1]));
	return byCountDescending;
  };

const clients = {
	increment: increment,
	showclients: showclients,
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

clients.clear();
let clientStart = Date.now();
clients.increment('255.255.255.255', clientStart);
clients.increment('255.255.255.255', clientStart);
clients.increment('255.255.255.255', clientStart);
clients.increment('192.168.0.1', clientStart);
clients.increment('192.168.0.1', clientStart);
clients.increment('10.0.0.1', clientStart);

exports.clients = clients;
