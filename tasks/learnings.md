## learnings.md

Sat 08 Jul 2023 10:04:27 AM PDT

## Pair and Share technique

- From Recurse Center
- Stop every 20min or so when pairing on new material
- Write down separately what you've learned.


## Redirect stderr for stuff

```
cmd 2>&1 | less
```


## Javascript Module Loading

- Context: convert PixieReport parsing and composing from Node to browser runtime.
- Pairing with @erikareads.
- &lt;script type="module"&gt; allows module loading and declarations
- load from a path including '.js' so that the static web server thinks it's javascript and not plaintext
- export { identifier1, identifier2, identifier3 } ;
- export const identifier
- export class Identifier

Javascript (ES6, not Node)

```
import * as name from './path.js';
import { thing } from './path.js';
```

Node-isms; "require", which is a synchronously executed statement, vs. "import" which is deferred / async.

[MDN JS import statement](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import)

[MDN JS export statement](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export)

----

Sat 08 Jul 2023 10:44:21 AM PDT

## Module-ization of Javascript formerly in Node, converted to ES import/export
- Javascript module names cannot be seen from global context
- Javascript module scripts can see document, location, etc. from global/document context
- Instead of onload="handleOnload()" make the last line in your module script a call to handleOnload();
- You don't need to mark a module script as "defer", it will automatically "defer" a module so that it doesn't attempt to run it as it's being loaded.


----

Thu 24 Aug 2023 09:08:51 PM PDT

## Resync mental context, add some helpful shortcuts
- npm start is still broken because there are a single set of JS files and require vs import is unresolved
- python3 -m http.server works as a local static file server; there's probably a Node one that's equivalent.
- local python HTTP server needed a <meta encoding="UTF-8"> in order to serve the embedded UTF-8 favicon SVG char
- local python HTTP server logs a broken pipe error after serving index.html for no obvious reason
- added "make http" (python http server), remake.sh (MD to HTML), "make remake" target for remake.sh
- suggestion from Erika: perhaps adding test assertions, even in-browser, would help you stay focused on next small steps
- if you add assertions you can add a breaking test
- insert date in 'vi', `:read !date` or use the embedded date function whatever that is.

----

Fri 25 Aug 2023 09:15:51 AM PDT

## Re-sync, async, and move a little forward

One of the challenges I had in going from a Node script to an in-browser
computation was that any JS script loading resources in-browser is async,
and requires promise handling or callbacks or .then(); looking at the
sample code form with .then() was a reminder that handling async isn't
yet natural for me.

Updated some context in index and in-browser-composer.md for the async
and import details.

Excursion: how do we insert the value of the vi date function?
I think I bound it to F3 in my Microsoft configuration.

Can we use:
  :s/./strftime("%c", localtime())\&/ ? nope not interpreted

Hmm maybe we can use append() ?
  :append(strftime("%c", localtime()))
nope, that's probably vim9 script, needs a "def" context.


Thu 23 Nov 2023 09:53:22 AM PST

## Strict mode, MIME types, and "let"

Paired with plocket!

In the browser, there are several security related changes that had to be made.

1. 'let': because variables in JS are global by default, and global variables can't be created in strict mode, I saw failures to find the elements I was looking up.
2. MIME type: when loading JS modules, they need to be served via HTTP(S) with the MIME type set correctly for Javascript. An answer from "phind.com" (in the Chumby wiki) described how to set up Busybox httpd to serve MIME types.
3. Ways to use "phind": inspect the sources provided for the narrative answer, and visit the sources for more context and details.

Making these fixes allowed me to proceed.

[MDN Strict Mode docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode#converting_mistakes_into_errors)

The Chumby wiki (one of the Phind source docs) had details on how to configure the Busybox web server for local development to return Javascript MIME types as needed for strict mode.

```
echo '.js:application/javascript' >> /etc/httpd.conf 

cat /etc/httpd.conf 

.js:application/javascript
```
