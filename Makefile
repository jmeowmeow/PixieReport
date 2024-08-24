default:
	@echo "make compose  : run a minimal Jimp image overlay, output pixie.png"
	@echo "make test     : run the Jasmine test suites"
	@echo "make start    : (npm run dev) express-js server with nodemon restart on :3000"
	@echo "make pixies   : navigate to :3000/pixie"

start:
	NODE_EXTRA_CA_CERTS=./webapp/go-daddy-certs.pem node server.js

dev:
	NODE_EXTRA_CA_CERTS=./webapp/go-daddy-certs.pem npm run dev

production:
	NODE_EXTRA_CA_CERTS=./webapp/go-daddy-certs.pem npx pm2 server.js

test:
	npm test

pixies:
	open http://localhost:3000/compose

compose:
	node compose.js
