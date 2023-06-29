# in-browser-composer.md

[<<](/) _Return to home page_

MILESTONES

Paths and reading images

- [x] 0. Display a single PNG image resource in the page as an IMG resource.
- [x] 1. Display a single PNG image resource in the in-browser canvas. See [MDN Canvas Tutorial](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Using_images)
- [x] 2. Composite two images having transparency on the upper layer, you can use a background and a pixie.
- [x] 2a. Refactor to a tail recursive composition of an array of layer files.
- [x] 3. Read a pixie description file or another JSON blob and log it to the Javascript console or set the innerHTML of an element.
- [x] 4. Read a JSON resource and navigate to a sub value like a pixie text description. Echo like #3.

----
Excursion: Parsing request info using the DOM API.

- [x] 5. Using the local web server, can we use the [purple.bikeshed.org](http://purple.bikeshed.org) approach via the [Location](https://developer.mozilla.org/en-US/docs/Web/API/Location) DOM API? Try a FORM and/or link submit. **YES.**

6 and 7 in either order

- [ ] 6. Parse a textual weather report and output a pixie description object.
- [ ] 7. Take a pixie description and use it to compose an image.
- [ ] 8. Join 6 and 7 to take a textual report and compose an image.

----

Look what we've won, what's next? (candidates for next milestones)

Parameterization and potential inputs from user
- pixie image set
- which weather station by code 
- can we use https://purple.bikeshed.com/ approach with lws? See MDN HTML DOM API documentation of the [Location](https://developer.mozilla.org/en-US/docs/Web/API/Location) DOM API.

Canvas to PNG and Alt Text
- The relevant DOM API items are [OffscreenCanvas.convertToBlob()](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas/convertToBlob) which can export PNGs as image/png and [URL.createObjectURL()](https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL_static); see also the [object URL image display example](https://developer.mozilla.org/en-US/docs/Web/API/File_API/Using_files_from_web_applications#example_using_object_urls_to_display_images).

(thanks @erikareads for milestone breakdown conversation, and for Mitchell Hashimoto's demo-driven milestone approach).

To reproduce the MD to HTML in the dev's environment:
```
python3 -m markdown in-browser-composer.md > in-browser-composer.html
```
