default:
	@echo "make compose  : run a minimal Jimp image overlay, output pixie.png"
	@echo "make test     : run the Jasmine test suites"
	@echo "make start    : (npm run dev) express-js server with nodemon restart on :3000"
	@echo "make pixies   : navigate to :3000/pixie"

start:
	npm run dev

test:
	npm test

pixies:
	open http://localhost:3000/compose

compose:
	node compose.js
