'use strict';
const { icaoToLocationMap } = require('./icao.js');

// PixieReport decoded-metar-parser.js
//
// reads a decoded METAR report
// loads up temp, humidity pressure, wind, clouds, weather
// uses auxiliary ICAO METAR list icao.js
//   to supplement missing station description and lat/long
// creates a JSON param object suitable for rendering as a pixie
//
// weather conditions
// SN -SN +SN snow, light snow, heavy snow
// SHSN snow showers, -SHSN light snow showers
// DZ -DZ +DZ drizzle, light drizzle, heavy drizzle
// RA -RA +RA rain, light rain, heavy rain
// SHRA rain showers, -SHRA light rain showers
// GR hail
// TSGRRA hail with thunder, rain
// TSRAGR rain with thunder, hail
// BR mist
// FG fog, BCFG patches of fog, VCFG fog in the vicinity
// HZ haze
// FU smoke
// DU dust
// TS thunder, +TSRA heavy rain with thunder
// SQ squalls
// LTG lightning
// SH showers, VCSH showers in the vicinity

// wind gusts
// 36010G17KT 360 (North) 10 (10 KT) G17 (gusting to 17 KT)
// 26017G028KT 260 (WSW) 17 (17 KT) G028 (gusting to 28 KT)

var stationCode = function(obs) {
  var regex = /^([A-Z][A-Z0-9]{3}) /;
  var result = regex.exec(obs);
  if (result) { return result[1] };
  return "????";
};

var stationDesc = function(code, decoded, icaoMap) {
  var lines = decoded.split('\n');
  if (lines && lines[0].includes(code) ) {
    return lines[0];
  } else if (icaoMap[code]) {
    return icaoMap[code];
  } else {
    return code;
  }
};

// e.g. "12.3 minutes since the observation"
// depends on Date.now() which we might want to pass in
const minutesSince = function(obsDate) {
  const msec_per_minute = 60 * 1000;
  const msec_since = Date.now() - obsDate[Symbol.toPrimitive]('number');
  return (msec_since / msec_per_minute).toFixed(1);
}

//ob: EGSC 171550Z 23019KT CAVOK 32/14 Q1016
//example: 171550Z -> 17th of the month, 15:50 UT
var withZuluTime = function(params, metar) {
  var regex = /(\d{2})(\d{2})(\d{2}Z)/;
  var result = regex.exec(metar);
  if (result) {
   params.zuluTime = "" + result[2] + ':' + result[3];
   params.zuluDayOfMonth = "" + result[1];
   let zuluDate = new Date(); // "now" provides year and month guesses
   zuluDate.setUTCDate(Number(result[1]));
   zuluDate.setUTCHours(Number(result[2]));
   zuluDate.setUTCMinutes(Number(result[3].substring(0,2)));
   zuluDate.setUTCSeconds(0);
   zuluDate.setUTCMilliseconds(0);
  // is it an invalid date? (June 31? Feb 30?)
  // is it negative? maybe we at a month or year turn and mistaken to use now.month or now.month/now.year.
  // TODO: heuristic fixes for (now - obs date) over a calendar turn, presuming fairly current obs.
  // example: ob 20201231 2023h as 312023, now 20210101 0030h, zuluDate ~ 20210131 2023h, future.
  // are we at a month turn? subtract a month so we're not in the future.
  // older than a month it's kinda what-do-we-do?
   params.zuluDate = zuluDate;
   params.zMinutesSince = minutesSince(zuluDate);
  } else {
   params.zuluTime = "(no time)";
  }
  return params;
}

var hectoPressure = function(obs) {
  // observation in the form Q1010 = 1010 hectopascals, 1010 hPa
  var regex = /\bQ(\d{3,4})/;
  var result = regex.exec(obs);
  if (result) { return result[1]; }
  var hgPressure = inHgPressure(obs);
  if (hgPressure) {
    var hgP = parseInt(hgPressure.replace('.', ''), 10);
    var hPa = (hgP * 1017 + 15) / 3000;
    var hPaStr = "" + hPa;
    var digits = 4; if (hPa < 1000) { digits = 3; };
    return hPaStr.slice(0,digits);
  };
  return '';
};

var inHgPressure = function(obs) {
  // observation in the form A3010 = 30.10 inHg
  var regex = /\bA(\d{1,2})(\d{2})/;
  var result = regex.exec(obs);
  if (result) { return result[1] + "." + result[2]; }
  if (obs.match( /\bQ(\d{3,4})/)) {
  var hPressure = hectoPressure(obs);
  if (hPressure) {
    var hP = parseInt(hPressure, 10);
    var hInHg = (hP * 30 * 100 + 509) / 1017;
    var hInHgStr = "" + hInHg;
    return hInHgStr.slice(0,2) + "." + hInHgStr.slice(2,4);   };
  }
  return '';
};

var numDegreesC = function(obs) {
  // before slash is observed temperature C, after slash is dew point. %hum is a nonlinear fn.
  // okay the end has to be not a space but a whitespace character or line ending, maybe \b?
  // and sometimes you don't have a dew point but just "31///"
  var shortTemp = /\b(M?)(\d{1,2})\/((\/\/)|(M?(\d{1,2})))?( |$)/; // "10/M1", "20/", "7/5", "29/20\n" not "1 3/4SM"
  var result = shortTemp.exec(obs);
  if (result) { var plusMinus = 1.0;
                if (result[1] == 'M') { plusMinus = -1.0; };
                return plusMinus * parseInt(result[2], 10); };
  return null;
};

var degreesC = function(obs) {
  var dC = numDegreesC(obs); if (typeof dC === 'number' && isFinite(dC)) { return dC; }
  return null;
}

var degreesF = function(obs) {
  var dC = numDegreesC(obs);  if (typeof dC === 'number' && isFinite(dC)) {    return (32 + (dC * 9 / 5));  }   return null;
};

const windSpeed = function(obs) {
    // needs to be consistent with dirMatcher
    var windMatcher = / (\/\/\/|VRB|\d{3})(0?\d{2}|\/\/)(G0?(\d{2}))?(KT|MPS)/;
    var result = windMatcher.exec(obs);
    var retval = null;
    if (result) {
      retval = {};
      if (result[2] == '//') {
    	  return '';
      }
      var speed = parseInt(result[2], 10);
      var gust = false;
      if (result[4]) {
        gust = parseInt(result[4], 10);
      }
      var speedUnit = result[5];
      retval[speedUnit] = speed;
      if ('KT' == speedUnit) {
          retval['MPH'] = (1.15 * speed).toFixed(0);
          retval['MPHNUM'] = retval['MPH'];
          retval['KPH'] = (1.86 * speed).toFixed(0);
          if (gust) {
            retval['MPHNUM'] = 1.15 * gust;
            retval['MPH'] = "" +retval['MPH'] + "-" + (1.15 * gust).toFixed(0);
            retval['KPH'] = "" +retval['KPH'] + "-" + (1.86 * gust).toFixed(0);
          }
      } else if ('MPS' == speedUnit) {
          retval['KPH'] = (3.6 * speed).toFixed(0);
          retval['MPH'] = (2.23 * speed).toFixed(0);
          retval['MPHNUM'] = retval['MPH'];
          if (gust) {
            retval['MPHNUM'] = 3.6 * gust;
            retval['KPH'] = "" +retval['KPH'] + "-" + (3.6 * gust).toFixed(0);
            retval['MPH'] = "" +retval['MPH'] + "-" + (2.23 * gust).toFixed(0);
          }
      }
    }
    return retval;
};

var windSpeedStr = function(obs) {
	var wsp = windSpeed(obs);
	return wsp ? wsp.toString() : wsp;
};

var windSpeedKph = function(obs) {
	var result = windSpeed(obs);
	if (result) {
		return result['KPH'];
	}
	return '';
};

var windSpeedMph = function(obs) {
	var result = windSpeed(obs);
	if (result) {
		return result['MPH'];
	}
	return '';
};

var windDir = function(obs) {
    // needs to be consistent with windMatcher
    var dirMatcher = / (VRB|\d{3})(0?\d{2}|\/\/)(G0?(\d{2}))?(KT|MPS)/;
    var result = dirMatcher.exec(obs);
    if (result) {
      if (result[1] == "VRB") {
        return "Vrbl";
      } else if (result[1] == "///") {
    	  return "";
      } else if (result[2] == "00") {
        return "Calm";
      } else {
        var compass = parseInt(result[1], 10);
        if (compass < 11 || compass > 349) {
          return "N";
        } else if (compass < 34) {
          return "NNE";
        } else if (compass < 56) {
          return "NE";
        } else if (compass < 79) {
          return "ENE";
        } else if (compass < 101) {
          return "E";
        } else if (compass < 124) {
          return "ESE";
        } else if (compass < 146) {
          return "SE";
        } else if (compass < 169) {
          return "SSE";
        } else if (compass < 191) {
          return "S";
        } else if (compass < 214) {
          return "SSW";
        } else if (compass < 236) {
          return "SW";
        } else if (compass < 259) {
          return "WSW";
        } else if (compass < 281) {
          return "W";
        } else if (compass < 304) {
          return "WNW";
        } else if (compass < 326) {
          return "NW";
        } else {
          return "NNW";
        }
      }
    }
  };

var metarObsLine = function(decoded) {
  var regex = /ob: (.*)\n/
  var result = regex.exec(decoded);
  if (result) { return result[1] };
  return "";
}

var skyCover = function(decoded) {
// clear, mostly clear, mostly cloudy,
// obscured, overcast, partly cloudy
  var regex = /Sky conditions: (.*)\n/
  var result = regex.exec(decoded);
  if (result) { return result[1] };
  return 'clear';  // default to guessing clear, could check CAVOK or Visibility
};

var humidity = function(decoded) {
  var regex = /Relative Humidity: (.*)\n/
  var result = regex.exec(decoded);
  if (result) { return result[1] };
  return "";
}

var weatherlist = function(decoded) {
    var conditions = [];
    // example "Weather: light rain; mist"
    var weatherex = /Weather: .+/
    var result = weatherex.exec(decoded);
    if(result) {
       conditions = result[0].split(/[,;:] ?/).slice(1);
    }
    return conditions;
};

const latlong = function(decoded, fallbackLocation) {
  // name and location  (KABC) dd?-mm(-ss)?[NS] ddd-mm(-ss)?[EW] ddddM
  // OPP/ANDALUSIA, AL, United States (K79J) 31-18N 86-23W 94M
  // Okmulgee, Okmulgee Municipal Airport, OK, United States (KOKM) 35-40-05N 095-56-55W
  const latlongex = /\b(\d\d?)-(\d\d)(-(\d\d))?([NS]) (\d\d?\d?)-(\d\d)(-(\d\d))?([EW])/
  var result = latlongex.exec(decoded);
  var latLongReturned = {};
  if (!result) {
    result = latlongex.exec(fallbackLocation);
  }
  if (result) {
    var lat, long;
    lat  = Number(result[1])+(Number(result[2]) / 60);
    if (result[4]) { lat = lat + Number(result[4]) / 3600 };
    if (result[5] == "S") { lat = lat * -1 };
    long = Number(result[6])+(Number(result[7]) / 60);
    if (result[9]) { long = long + Number(result[9]) / 3600 };
    if (result[10] == "W") { long = long * -1 };
    latLongReturned = { degLat: lat, degLong: long };
    return latLongReturned;
  } else {
    return null;
  }
}


// format of a date line from a decoded text report:
//  Dec 07, 2020 - 12:53 AM EST / 2020.12.07 0553 UTC
const dateTimeUTC = function(decoded) {
  const dtex = / (\d\d\d\d).(\d\d).(\d\d) (\d\d)(\d\d) UTC/
  var result = dtex.exec(decoded);
  var dtReturned = {};
  if (result) {
    dtReturned  = { year:    Number(result[1]),
                    month:   Number(result[2]),
                    day:     Number(result[3]),
                    hours:   Number(result[4]),
                    minutes: Number(result[5]),
                    seconds: 0,
                  }
    let utcDate = new Date();
    utcDate.setUTCFullYear(dtReturned.year);
    utcDate.setUTCMonth(dtReturned.month - 1); // whyyyy zero based months?
    utcDate.setUTCDate(dtReturned.day);
    utcDate.setUTCHours(dtReturned.hours);
    utcDate.setUTCMinutes(dtReturned.minutes);
    utcDate.setUTCSeconds(dtReturned.seconds);
    dtReturned.utcDate = utcDate;
    dtReturned.minutesSince = minutesSince(utcDate);
    return dtReturned;
  } else {
    return null
  }

}

/////////////////////////////////////begin sunpos
// from www.psa.es/sdg/sunpos.htm
// constants from sunpos.h
const pi = Math.PI;
const twopi = 2*pi;
const rad =  pi/180;
const dEarthMeanRadius  = 6371.01;   // In km
const dAstronomicalUnit = 149597890; // In km

// Input:
//  udtTime{ year, month, day, hours, minutes, seconds }
//  udtLocation { degLat, degLong } degrees North lat, East long
// Output:
//  sunCoords{ azimuth, zenithAngle } // compass deg, deg from zenith
function sunpos(udtTime, udtLocation) {
  // Main variables
  var dElapsedJulianDays, dDecimalHours;
  var dEclipticLongitude, dEclipticObliquity;
  var dRightAscension,    dDeclination;
  var sunCoords = {};

  // Auxiliary variables
  var dY, dX;

    // Calculate difference in days between the current Julian Day
    // and JD 2451545.0, which is noon 1 January 2000 Universal Time
    {
            var dJulianDate;
            var liAux1, liAux2;
            // Calculate time of the day in UT decimal hours
            dDecimalHours = udtTime.hours + (udtTime.minutes
                    + udtTime.seconds / 60.0 ) / 60.0;
            // Calculate current Julian Day
            liAux1 = Math.trunc((udtTime.month-14)/12); // always 0??
            liAux2 = (1461*(udtTime.year + 4800 + liAux1))/4 +
                     (367*(udtTime.month - 2-12*liAux1))/12 -
                     (3*((udtTime.year + 4900 + liAux1)/100))/4 +
                     udtTime.day-32075;
            liAux2 = Math.trunc(liAux2);

            dJulianDate=liAux2 - 0.5 + dDecimalHours/24.0;
            // Calculate difference between current Julian Day and JD 2451545.0
            dElapsedJulianDays = dJulianDate - 2451545.0;
    }

        // Calculate ecliptic coordinates (ecliptic longitude and obliquity of the
        // ecliptic in radians but without limiting the angle to be less than 2*Pi
        // (i.e., the result may be greater than 2*Pi)
        // {
            var dMeanLongitude, dMeanAnomaly, dOmega;
            dOmega=2.1429-(0.0010394594*dElapsedJulianDays);
            dMeanLongitude = 4.8950630 +
              0.017202791698*dElapsedJulianDays; // Radians
            dMeanAnomaly = 6.2400600 + 0.0172019699*dElapsedJulianDays;
            dEclipticLongitude = dMeanLongitude +
              0.03341607*Math.sin( dMeanAnomaly ) +
              0.00034894*Math.sin( 2*dMeanAnomaly ) - 0.0001134 -
              0.0000203*Math.sin(dOmega);
            dEclipticObliquity = 0.4090928 -
                         6.2140e-9 * dElapsedJulianDays +
                         0.0000396 * Math.cos(dOmega);
        // }

    // Calculate celestial coordinates ( right ascension and declination ) in radians
    // but without limiting the angle to be less than 2*Pi (i.e., the result may be
    // greater than 2*Pi)
    // {
        var dSin_EclipticLongitude;
        dSin_EclipticLongitude= Math.sin( dEclipticLongitude );
        dY = Math.cos( dEclipticObliquity ) * dSin_EclipticLongitude;
        dX = Math.cos( dEclipticLongitude );
        dRightAscension = Math.atan2( dY,dX );
        if( dRightAscension < 0.0 ) {
          dRightAscension = dRightAscension + twopi;
        }
        dDeclination = Math.asin( Math.sin( dEclipticObliquity )*dSin_EclipticLongitude );
    // }

    // Calculate local coordinates ( azimuth and zenith angle ) in degrees
        var dGreenwichMeanSiderealTime, dLocalMeanSiderealTime;
        var dLatitudeInRadians, dHourAngle;
        var dCos_Latitude, dSin_Latitude, dCos_HourAngle;
        var dParallax;
        dGreenwichMeanSiderealTime = 6.6974243242 +
            0.0657098283*dElapsedJulianDays + dDecimalHours;
        dLocalMeanSiderealTime = (dGreenwichMeanSiderealTime*15 +
            udtLocation.degLong)*rad;
        dHourAngle = dLocalMeanSiderealTime - dRightAscension;
        dLatitudeInRadians = udtLocation.degLat*rad;
        dCos_Latitude = Math.cos( dLatitudeInRadians );
        dSin_Latitude = Math.sin( dLatitudeInRadians );
        dCos_HourAngle= Math.cos( dHourAngle );
        sunCoords.zenithAngle = (Math.acos( dCos_Latitude*dCos_HourAngle *
            Math.cos(dDeclination) + Math.sin( dDeclination )*dSin_Latitude));
        dY = -Math.sin( dHourAngle );
        dX = Math.tan( dDeclination )*dCos_Latitude - dSin_Latitude*dCos_HourAngle;
        sunCoords.azimuth = Math.atan2( dY, dX );
        if ( sunCoords.azimuth < 0.0 ) {
            sunCoords.azimuth = sunCoords.azimuth + twopi;
        }
        sunCoords.azimuth = sunCoords.azimuth/rad;
        // Parallax Correction
        dParallax=(dEarthMeanRadius/dAstronomicalUnit) *Math.sin(sunCoords.zenithAngle);
        sunCoords.zenithAngle=(sunCoords.zenithAngle + dParallax)/rad;
  return sunCoords;
}

// testing in REPL (read-eval-print loop)
//  udtTime{ year, month, day, hours, minutes, seconds }
//  udtLocation { degLat, degLong } degrees North lat, East long

// var myTime = { year: 2000, month: 1, day: 1, hours: 12, minutes: 0, seconds: 0 };
// var myLoc  = { degLat: 50.0, degLong: 0.0 };
// var seaLoc = {degLat: 47.60, degLong: -122.33};
// sunpos(myTime, myLoc);
/////////////////////////////////////end sunpos

// canonicalize to Unix newlines to support Windows checkouts
// remove CR, leave LF ===  ^J === \n === U+000A
var stripCarriageReturns = function(maybeItsText) {
  if ((typeof maybeItsText === 'string') || (maybeItsText instanceof String)) {
    return maybeItsText.replaceAll('\r', '');
  } else {
    return maybeItsText;
  }
}

    // Recomposing decodedToParamObject here with codeRequested
    // is a push toward composing the METAR parsing and fallbacks
    // more gracefully.
var decodedToParamsForStation = function(decodedRawMetarReport, codeRequested) {
    var decoded = stripCarriageReturns(decodedRawMetarReport);
    var params = {}
    var metar = metarObsLine(decoded);
    params.stationCode = stationCode(metar); // we're wiring '????' for undefined.
    // messy clause for decodedToParamObject no-metar-report '????' behavior
    if (codeRequested && ('????' == params.stationCode || !params.stationCode)) { params.stationCode = codeRequested;}
    params.stationDesc = stationDesc(params.stationCode, decoded, icaoToLocationMap);
    params.hectoPressure = hectoPressure(metar);
    params.inHgPressure = inHgPressure(metar);
    params.degreesC = degreesC(metar);
    if (typeof params.degreesC  === 'number' && isFinite(params.degreesC)) {
      params.degreesCstr = params.degreesC.toFixed(0);
    }
    params.degreesF = degreesF(metar);
    if (typeof params.degreesF  === 'number' && isFinite(params.degreesF)) {
      params.degreesFstr = params.degreesF.toFixed(0);
    }
    params.windSpeed    = windSpeed(metar); // keep details for high wind flags
    params.windSpeedKph = windSpeedKph(metar); // rendered KPH text
    params.windSpeedMph = windSpeedMph(metar); // rendered MPH text
    params.windDir = windDir(metar);
    params = withZuluTime(params, metar);
    params.skyCover = skyCover(decoded);
    params.humidity = humidity(decoded);
    params.weather  = weatherlist(decoded);
    params.metar = metar;
    params.latlong = latlong(decoded, icaoToLocationMap[params.stationCode]);
    params.dateTimeUTC = dateTimeUTC(decoded); // need full date for day/night calc
    if (params.latlong && params.dateTimeUTC) {
      params.sunPos = sunpos(params.dateTimeUTC, params.latlong);
    }
    return params;
};

var decodedToParamObject = function(decodedRawMetarReport) {
  return decodedToParamsForStation(decodedRawMetarReport, null);
}

var computeAltText = function(params) {
  var alttext_label = "Weatherpixie image for ";
  var stationDesc = params.stationDesc.trim().replace(/  /, ' ').replace(/ ,/, ',');
  if (params.stationDesc && params.stationDesc.length > 4) {
    alttext_label = alttext_label + stationDesc;
  } else {
    alttext_label = alttext_label + "ICAO METAR " + params.stationCode;
  }
  // example of above text for alttext_label is:
  // "Weatherpixie image for Miyakojima, Japan (ROMY) 24-47N 125-17E 41M"

  // want to add
  // "showing " + pixel doll description...
  if (params.sceneText) {
    alttext_label = alttext_label + ", showing " + params.sceneText + ", with " + params.dollDescText;
  } else {
    alttext_label = alttext_label + ", showing " + params.dollDescText;
  }


  // escape " in alt text since it's going into a double-quoted attribute String value
  // don't escape ' (Mymble's Daughter) because Twitter doesn't like it.
  alttext_label = alttext_label.replace(/\"/g, '\\\"');
  return alttext_label;
};

var asOxfordCommaList = function(terms) {
  if (!terms || !terms.length) {
     return '';
  }

  if (terms.length < 2) {
     return terms[0];
  }

  const lastTerm = terms.pop();
  const commaList = terms.join(', ');
  return commaList + ' and ' + lastTerm;
}

// a clear/a cloudy/an overcast daytime/night/twilight scene with rain, snow, and haze
var computeSceneText = function(imageLayers) {
  // imageLayers stack of layers: [day/night, skycover, lightning?, pixie, wind?, weather?, frame]
  // OK pixie is always [2] or if lightning is present, [3]; frame is always last
  // a(n) $1 $0 scene [with wind flags, lightning, rain, and fog], showing [pixie]
  const layerNames = imageLayers.map(layer => layer.desc);
  const skycover = layerNames[1];
  const daynight = layerNames[0];

  var scenetext = '';
  if (skycover == 'overcast') {
    scenetext = 'an '; // overcast starts with a vowel
  } else {
    scenetext = 'a '; // cloudy, clear
  }
  scenetext = scenetext + skycover;
  scenetext = scenetext + ' ' + daynight + ' scene';
  // OK now we have maybe-lightning; pixel doll; maybe-wind, maybe-weather; frame

  // this logic might be worth its own unit test
  layerNames.shift(); // base layer
  layerNames.shift(); // sky cover
  layerNames.pop();   // the top layer frame

  if (layerNames[0].match(/lightning/)) {
    var ltng = layerNames.shift();
    layerNames.shift();
    layerNames.unshift(ltng);
  } else {
    // it's a doll description
    layerNames.shift();
  }
  // OK now we have maybe-lightning, maybe-wind, maybe-weather
  // whatever is left can be accumulated as weather
  // [0]  ...scene'
  // [1]  ...scene, with weather1'
  // [2]  ...scene, with weather1 and weather2'
  // [3]  ...scene, with weather1, weather2, and weather3'
  // [4]  ...scene, with weather1, weather2, weather3, and weather4'
  if (layerNames.length > 0) {
    scenetext = scenetext + ', with ' + asOxfordCommaList(layerNames);
  }
  return scenetext;
};


// connect a short description with the image file name
// Layer('pink twilight', bgd + 'pinkbackground.png');
class Layer {
  constructor(desc, path) {
    this.desc = desc;
    this.path = path;
  }
}

var addDollLayerReturnDescText = function(image_layers, no_doll, doll_layers, tempC) {
  var ddtext = "a pixel doll dressed for the weather";
  if (typeof tempC === 'number' && isFinite(tempC)) {
     if (tempC < -9) {
       image_layers.push(doll_layers[0]); // icy
       ddtext = doll_layers[0].desc;
     } else if (tempC < 5) {
       image_layers.push(doll_layers[1]); // cold
       ddtext = doll_layers[1].desc;
     } else if (tempC < 19) {
       image_layers.push(doll_layers[2]); // cool
       ddtext = doll_layers[2].desc;
     } else if (tempC < 28) {
       image_layers.push(doll_layers[3]); // warm
       ddtext = doll_layers[3].desc;
     } else {
       image_layers.push(doll_layers[4]); // hot
       ddtext = doll_layers[4].desc;
     }
   } else {
     image_layers.push(no_doll);
      ddtext = no_doll.desc;
   }

  return ddtext;
}

var computeTheLayers = function(parsedData, layerDefs) {
  var layerfile = [];
  layerfile[0] = layerDefs.bkgd[1]; // default to gray for no sun position
  //  Civil and nautical twilight occur at solar zenith
  //  angles of 96 and 102 degrees respectively.
  //  Details of objects become visible at civil twilight.
  //  At nautical twilight, only outlines are visible.
  if (parsedData.sunPos && parsedData.sunPos.zenithAngle) {
    const z = parsedData.sunPos.zenithAngle;
    if (z < 89) {
      layerfile[0] = layerDefs.bkgd[3]; // day
    } else if (z < 96) {
      layerfile[0] = layerDefs.bkgd[2]; // pink
    } else if (z < 102) {
      layerfile[0] = layerDefs.bkgd[1]; // gray
    } else {
      layerfile[0] = layerDefs.bkgd[0]; // night
    }
  }
  layerfile[1] = layerDefs.skyhash[parsedData['skyCover']];

  // lightning: after clouds, before doll and precipitation
  // fragile, depends on exact match on weather in decoded METAR (as other weather conditions)
  if (parsedData.weather && parsedData.weather.includes('Lightning observed')) {
    layerfile.push(layerDefs.lightningLayer);
  }

  var dollDescText = addDollLayerReturnDescText(layerfile, layerDefs.noDollLayer,
            layerDefs.dollLayerByTemp, parsedData.degreesC);

  parsedData.dollDescText = dollDescText;

  var wspd = windSpeed(parsedData.metar);
  var mph;
  if (wspd && wspd.MPHNUM) {
     mph = windSpeed(parsedData.metar).MPHNUM;
  }
  if (wspd && wspd.MPHNUM && wspd.MPHNUM > 24) {
    var mph = wspd.MPHNUM;
    var windwarning;
    if (mph > 73) {
      windwarning = layerDefs.dayhighwind[3];
    } else if (mph > 54) {
      windwarning = layerDefs.dayhighwind[2];
    } else if (mph > 38) {
      windwarning = layerDefs.dayhighwind[1];
    } else {
      windwarning = layerDefs.dayhighwind[0];
    }
    layerfile.push(windwarning);
  }

  if (parsedData.weather) {
    for (const cond of parsedData.weather) {
       const weatherfile = layerDefs.weatherhash[cond];
       if (weatherfile) {
         layerfile.push(weatherfile);
       }
    }
  }
  layerfile.push(layerDefs.frame);
  return layerfile;
};

var worldMapLink = function(parsedData) {
  const nolink = '';
  if (!parsedData || !parsedData.latlong) { return nolink; }
  const degLat  = parsedData.latlong.degLat;
  const degLong = parsedData.latlong.degLong;
  // negative is south latitude
  if (isNaN(degLat) || !isFinite(degLat) || degLat > 90.0 || degLat < -90.0) {
    return nolink;
  }
  // negative is west longitude
  if (isNaN(degLong) || !isFinite(degLong) || degLong > 180.0 || degLong < -180.0) {
    return nolink;
  }
  //sample: https://www.openstreetmap.org/#map=10/47.6233/-122.4316

  const link = `https://www.openstreetmap.org/#map=11/${degLat.toFixed(2)}/${degLong.toFixed(2)}`;

  return link;
};

exports.decodedToParamObject = decodedToParamObject;
exports.decodedToParamsForStation = decodedToParamsForStation;
exports.windSpeed = windSpeed;
exports.computeAltText = computeAltText;
exports.Layer = Layer;
exports.computeTheLayers = computeTheLayers;
exports.computeSceneText = computeSceneText;
exports.worldMapLink = worldMapLink;
