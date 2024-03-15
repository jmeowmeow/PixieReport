default:
	@echo "make compose  : run a minimal Jimp image overlay, output pixie.png"
	@echo "make test     : run the Jasmine test suites"
	@echo "make start    : static data composition example on :3000"
	@echo "make pixies   : navigate to :3000/pixie"

start:
	npm start

test:
	npm test

pixies:
	open http://localhost:3000/compose

compose:
	node compose.js
