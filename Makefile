default:
	@echo "make http     : start a server on :8000 with index.html"
	@echo "make remake   : run the Markdown processor on tasks and learnings"
	@echo "make refresh  : refresh the METAR weather reports"

http:
	python3 -m http.server

cgi:
	python3 -m http.server --cgi

remake:
	cd /home/jsmiller/projects/pixie/PixieReport/tasks && ./remake.sh
	cd /home/jsmiller/projects/pixie/PixieReport

refresh:
	cd /home/jsmiller/projects/pixie/PixieReport/metar && ./refetch.sh
	cd /home/jsmiller/projects/pixie/PixieReport
