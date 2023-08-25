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




