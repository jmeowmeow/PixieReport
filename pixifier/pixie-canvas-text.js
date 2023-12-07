var tightenLocationSpacing = function(location) {
  var loc = location;
  loc = loc.replace(" *", " ");
  loc = loc.replace(/( ){2,}/g, " ");
  loc = loc.replace(/ ,/g, ",");
  return loc;
}

var abbreviateLocation = function(location) {
  var loc = location;
  loc = loc.replace(/^([A-Za-z ]*), (\1)/, '$1'); // "City, City Airport..."
  loc = loc.replace("Automatic", "Auto");
  loc = loc.replace("AUTOMATIC", "AUTO");
  loc = loc.replace("International", "Intl");
  loc = loc.replace("INTERNATIONAL", "INTL");
  loc = loc.replace('INTERNTL', 'INTL'); // KLAX
  loc = loc.replace("Regional", "Regl");
  loc = loc.replace("REGIONAL", "REGL");
  loc = loc.replace("Municipal", "Muni");
  loc = loc.replace("MUNICIPAL", "MUNI");
  loc = loc.replace("Airport", "Apt");
  loc = loc.replace("AIRPORT", "APT");
  loc = loc.replace("Field", "Fld");
  loc = loc.replace("FIELD", "FLD");
  loc = loc.replace("Island", "Isl");
  loc = loc.replace("ISLAND", "ISL");
  loc = loc.replace("Lake ", "Lk "); // Lakenheath Royal Air Force Base
  loc = loc.replace("LAKE ", "LK ");
  loc = loc.replace("Auxiliary", "Aux");
  loc = loc.replace("AUXILIARY", "AUX");
  loc = loc.replace("AIR FORCE BASE", "AFB");
  loc = loc.replace("Air Force Base", "AFB");
  loc = loc.replace("AIR FORCE", "AF"); // must come after AFB
  loc = loc.replace("Air Force", "AF");
  loc = loc.replace("United States", "USA");
  loc = loc.replace("UNITED STATES", "USA");
  loc = loc.replace("United Kingdom", "UK");
  loc = loc.replace("UNITED KINGDOM", "UK");
  loc = loc.replace("New Zealand", "NZ");
  loc = loc.replace("NEW ZEALAND", "NZ");
  loc = tightenLocationSpacing(loc);
  return loc;
}

function useMetric(params) {
  if (params.stationCode.startsWith("K")) {
    return false; // Continental US plus one 'VI'
  }
  if (params.stationCode.startsWith("TJ")) {
    return false; // Puerto Rico
  }
  if (params.stationCode.startsWith("PH")) {
    return false; // Hawaii
  }
  if (params.stationCode.startsWith("P") && params.latlong.degLat > 50.0) {
    return false; // Alaska
  }
  // "P...": missing some stations in US Pacific island territories
  return true;
}

// write after top layer black frame loaded
// alt text can include a version of this weather report text.
function writeTextOnPixie(canvas_2d, params) {
  const c2d = canvas_2d;
  const tilt_ccw =  -1.570796326795; // -90 degrees in radians
  const tilt_cw  =   1.570796326795; //  90 degrees in radians
  const weatherFont = 'bold 11px Courier';
  const timeFont = 'bold 9px Courier';
  var temphum = ''; var windbar = '';
  if (useMetric(params)) {
    if (params.degreesCstr) {
      temphum = temphum + params.degreesCstr + 'C ';
    } else {
      temphum = '     ';
    }
    if (params.humidity) {
      temphum = temphum + params.humidity;
    }
    if (!params.windDir) {
        windbar = '       ';
    } else if (params.windDir == "Calm") {
        windbar = '' + params.windDir  + '  ';
    } else {
        windbar = '' + params.windDir  + ' ' + params.windSpeedKph + 'kph ';
    }
    if (params.hectoPressure == '') {
    } else {
      windbar = windbar + params.hectoPressure + 'hPa';
    }
  } else { // non-metric
    if (params.degreesFstr) {
      temphum = temphum + params.degreesFstr + 'F ';
    } else {
      temphum = '     ';
    }
    if (params.humidity) {
      temphum = temphum + params.humidity;
    }
    if (!params.windDir) {
        windbar = '       ';
    } else if (params.windDir == "Calm") {
      windbar = '' + params.windDir  + '  ';
    } else {
      windbar = '' + params.windDir  + ' ' + params.windSpeedMph + 'mph ';
    }
    if (params.inHgPressure == '') {
    } else {
      windbar = windbar + params.inHgPressure + 'mmHg';
    }
  }

  // choose a side label to ID the location
  var location_label = params.stationCode;

  var guess_at_name_end = params.stationDesc.lastIndexOf(' (');
  if (guess_at_name_end > 0) {
    location_label = params.stationDesc.substring(0, guess_at_name_end);
    location_label = abbreviateLocation(location_label);
  }

  // computed text: temphum, windbar, zuluTime, location_label
  //   caution: params.fieldName and fn(metar)->text names aliased, e.g. zuluTime
  // console.log("Computed from weather params: ["+temphum+", "+windbar+", "+params.zuluTime+", "+location_label+".]");


  // weather
  c2d.font = weatherFont;
  c2d.fillStyle = 'rgba(255,255,255,1.0)';
  c2d.fillText(temphum, 2, 160);
  c2d.fillText(windbar, 2, 172);

  // time
  c2d.fillStyle = 'rgba(127,255,127,1.0)';
  c2d.font = timeFont;
  c2d.fillText(params.zuluTime, 77, 160);


  // text going upward along L or R margin
  // right side: const lineY=120; const textY=123;
  // left side:  const lineY=5;   const textY=8;
  const lineY=5; const textY=8;
  c2d.rotate(tilt_ccw)
  var textextent = c2d.measureText(location_label);
  c2d.strokeStyle = 'rgba(255,63,63,0.3)';
  c2d.lineWidth = 10.0;
  c2d.beginPath();
  c2d.lineTo(-150, lineY); c2d.lineTo(-146 + textextent.width, lineY);
  c2d.stroke();

  c2d.fillText(location_label, -148, textY);
  c2d.rotate(tilt_cw)
}
export const writePixieCanvasText = writeTextOnPixie;
