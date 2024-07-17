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
* which pixie set (consider random, requested, configured)
* preferred units (consider requested, default for station, config'd for user)

How long are we willing to serve from cache? Do we tell the client to hold a
picture as valid for a longer time than the server?

Do we fall back to the image cache if we have a METAR no-fetch?

A cache key for METAR is:   the station ID. (implicitly the clock)
A cache value for METAR is: the METAR text. (and the cached timestamp), OR the params.

If we cache the rendered pixie by params it will change the pixie render
workflow, so maybe we start with a smaller step, just caching the METAR text.

Tue 16 Jul 2024 08:27:36 AM PDT

After some cache work. Now caching both the METAR and the rendered pixie.

When a pixie set is randomly picked during rendering, we pick up the
set number after the render, and cache both the implicit and explicit
doll sets.

|  Item  |  Key  |  Example  |  Value  |  Notes  |
|--------|-------|-----------|---------|---------|
| report | station code | "KPAE" | METAR text as fetched | ... |
| pixie  | queryparam station | "location=KPAE" | JIMP image and alt text | dollset implicit, bound at cache time |
| pixie  | queryparam station + dollset | "location=KPAE&amp;set=0" | JIMP image and alt text | dollset explicit |

