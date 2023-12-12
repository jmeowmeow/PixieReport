# https://python-markdown.github.io/cli/
# python3 -m markdown learnings.md > learnings.html && python3 -m markdown in-browser-composer.md > in-browser-composer.html
# https://pypi.org/project/commonmark/ -- pip install commonmark
# cmark learnings.md -o learnings.html && cmark in-browser-composer.md -o in-browser-composer.html
cmark-gfm -e tasklist learnings.md > learnings.html && cmark-gfm -e tasklist in-browser-composer.md > in-browser-composer.html
