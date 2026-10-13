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
* Incremental geodata updates to icao.js for errors and missing stations.

## Resource Loading
* Preloads. One-time image loading separate from composition
* Image layer lookup into named map, including pixel doll set prefix
* Attempt and abandon goal to factor to ES6 modules. A local branch has ES6 WIP.

## Webapp Architecture
* PNG download endpoint.
* URL param args for station (location=KPAE) and dollset (set=0,1,2,3)
* Cache both METAR text and rendered pixie for 5m.
* robots.txt disallows robots from all but / and /about

## Webapp Operations
* Cache view
* Uptime
* Recent client IPs and request tally for site and robots.txt, via expiring counter.

## Webapp Design/Content
* Gallery on home page, each pixie linked.
* Navigation links among webapp pages on HTML pages.
* -- following are probably post-launch? --
* Use station and dollset params in navigation links, also C/F units.
* Nearby Stations To This Station page /stations.
* Nearby Stations To: navigate by +/- 1 or 5 degrees of lat/long. (disabled: scrapers)
* Nearby Stations svg map (noninteractive).
* Pixie picker prototype /make with preview for doll sets and C/F units.
* Geographic station chooser for /make and /stations, world map as server-parsed imagemap.
* Checkmark animation as a nicety for "copy alt text".
* Checkmark animation as a nicety for "copy png URL" and "copy pixie URL" on /make
* CSS grid layout for image grids (home; nearby stations) makes them useful in wide/narrow viewports.
* Multiple new dolliepalace doll sets courtesy of Ayla A.
* /embed = /pixie without navigation, for iframe embed; copyable from /pixie page.
* /cycle = /pixie with a cycle of nearest 5 around location, or around a locations= list.
* /seq   = /cycle without navigation, like /embed version of /pixie

## Soft Launch
* ExpressJS up on pixiereport site! (at :3000, not broadly circulated)
* PM2 [pm2.io](https://pm2.io) substituted for "npm run dev" as webapp launcher.

## Public Launch
* [pixiereport.com](https://pixiereport.com).
* Let's Encrypt / Certbot certificate (manual fetch), manually renewed multiple times
  * Because Certbot needs :80, I have to down/up Federated Wiki around the update.
* Nginx reverse proxy from :443 to :3000.
* X Nearby Stations, navigation by +/- 1 or 5 degrees removed since public launch (scrapers)
* /compose disabled on the cloud host; returns a 429 Too Many Requests as a bot detector
* fail2ban attempted using nginx 4xx detector; but not sensitive enough?
* nft "netfilter" IP block exclusion for hosts of scrapers ignoring robots.txt
