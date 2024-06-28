## cache.md

Extracted from [./tasks.md](./tasks.md)

Thu 27 Jun 2024

Thoughts on weather report input and pixie output caching

For a METAR cache, we need no pixie param.

For an image cache, we do, and we need logic around where to bind a pixie param.
If no pixie set was chosen, we can serve from most-recent for that station.
So we're starting to get into a notion of resources and views in the REST sense.

The pixie results (rendered pixie, alt text) depend on
* a METAR report to be parsed
* which pixie set (random, requested, configured)

How long are we willing to serve from cache? Do we tell the client a longer time
than the server? Do we fall back from a METAR no-fetch to the cache?

A cache key for METAR is:   the station ID. (implicitly the clock)
A cache value for METAR is: the METAR text. (and the cached timestamp), OR the params.

If we cache the params it will change the pixie render workflow, so maybe we
start with a smaller step, just caching the METAR text.
