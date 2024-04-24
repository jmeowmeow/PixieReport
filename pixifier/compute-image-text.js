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
  loc = loc.replace("Station", "Stn");
  loc = loc.replace("STATION", "STN");
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

const computeImageTextValues = function (params) {
    // compute the text values to be written on the image
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
            windbar = '' + params.windDir + '  ';
        } else {
            windbar = '' + params.windDir + ' ' + params.windSpeedKph + 'kph ';
        }
        if (params.hectoPressure == '') {
        } else {
            windbar = windbar + params.hectoPressure + 'hPa';
        }
    } else { // non-metric
        if (params.degreesFstr) {
            temphum = temphum + params.degreesFstr + 'F  ';
        } else {
            temphum = '     ';
        }
        if (params.humidity) {
            temphum = temphum + params.humidity;
        }
        if (!params.windDir) {
            windbar = '       ';
        } else if (params.windDir == "Calm") {
            windbar = '' + params.windDir + '  ';
        } else {
            windbar = '' + params.windDir + ' ' + params.windSpeedMph + 'mph ';
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
    // return all the things
    let imageText = {
        temphum: temphum,
        windbar: windbar,
        zuluTime: params.zuluTime,
        locationLabel: location_label,
    };
    return imageText;
}

exports.computeImageTextValues = computeImageTextValues;
