default:
	@echo "make compose  : run a minimal Jimp image overlay, output pixie.png"
	@echo "make test     : run the Jasmine test suites"
	@echo "make start    : static data composition example on :3000"
	@echo "make http     : start a server on :8000"

start:
	npm start

test:
	npm test

http:
	python3 -m http.server

compose:
	node compose.js
