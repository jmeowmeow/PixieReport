default:
	@echo "make http   : start a server on :8000 with index.html"
	@echo "make remake : run the Markdown processor on tasks and learnings"

http: 
	python3 -m http.server

remake:
	cd /home/jsmiller/projects/pixie/PixieReport/tasks && ./remake.sh
	cd /home/jsmiller/projects/pixie/PixieReport
