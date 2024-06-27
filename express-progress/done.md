# done.md
Mon 17 Jun 2024 09:03:07 AM PDT

Completed tasks from [tasks.md](./tasks.md)

Approximately chronological from 14 Mar 2024

Some work paired at the Recurse Center, especially
initial Express setup and async handlers.

## Express server basics
* Serves a static JIMP image response.
* Use of async and promises for i/o
* Loads and writes a JIMP font to the image.

## Composition
* Debug views of parsed params
* Uses "fetch" to retrieve a METAR report, then parses it.
* Add day/night logic
* Add cloud logic
* Add temperature/pixie logic
* Add wind layer logic
* Add lightning layer logic

## Text
* Write location text
* Write weather text
* Convert other fonts to BMFont, choose a font
* Choose and use a monospace font (Iosevska SS04 via Hiero/BMFont) 

## Weather Data
* Baseline parsed METAR endpoint.
* Active station list from snapshot bulk METAR archive 2024-06-22.

## Resource Loading
* Preloads. One-time image loading separate from composition
* Image layer lookup into named map, including pixel doll set prefix
* Attempt and abandon goal to factor to ES6 modules.

## Webapp Architecture
* PNG download endpoint.

## Webapp Design/Content
* Gallery on home page, each pixie linked.

## Soft Launch
* ExpressJS up on pixiereport site! (at :3000, not broadly circulated)



