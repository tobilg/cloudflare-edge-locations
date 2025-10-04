import puppeteer from 'puppeteer';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { EOL } from 'os';
import * as utf8 from 'utf8';
import { airportOverridesData } from './lib/airportOverrides';

// Load large airport data
const largeAirportData: LargeCityData[] = JSON.parse(readFileSync(join(__dirname, 'temp', 'large-airports.json'), 'utf8'));
// Load all airport data
const allAirportData: LargeCityData[] = JSON.parse(readFileSync(join(__dirname, 'temp', 'airport-codes.json'), 'utf8'));
// Load countries data
const countriesData: CountryData[] = JSON.parse(readFileSync(join(__dirname, 'temp', 'country-codes.json'), 'utf8'));

interface LargeCityData {
  continent:    string;
  coordinates:  string;
  elevation_ft: string;
  gps_code:     string;
  iata_code:    string;
  ident:        string;
  iso_country:  string;
  iso_region:   string;
  local_code:   string | null;
  municipality: string;
  name:         string;
  type:         string;
}

interface CountryData {
  Code: string;
  Name: string;
}

interface EdgeLocation {
  code?: string;
  city: string;
  country?: string;
  countryCode?: string;
  latitude?: number;
  longitude?: number;
}

const writeCSV = (locations: EdgeLocation[]): void => {
  const csvPath = join(__dirname, 'data', 'cloudflare-edge-locations.csv');
  const data = locations.map(e => {
    return `${getCode(e.code)},${e.city},${e.country},${e.countryCode},${e.latitude},${e.longitude}`;
  });
  // Add header
  data.unshift('code,city,country,country_code,latitude,longitude');
  writeFileSync(csvPath, data.join(EOL), 'utf8');
}

let invalidCounter = 1;

const getCode = (airportCode?: string): string => {
  let code: string;
  if (airportCode) {
    code = airportCode;
  } else {
    code = `INV${invalidCounter}`;
    invalidCounter++;
  }
  console.log(airportCode, code);
  return code;
}

const writeJSON = (locations: EdgeLocation[]): void => {
  const jsonPath = join(__dirname, 'data', 'cloudflare-edge-locations.json');
  const data: { [key: string]: EdgeLocation } = {};
  locations.forEach(location => {
    data[getCode(location.code)] = {
      city: location.city,
      country: location.country || '',
      countryCode: location.countryCode || '',
      latitude: location.latitude || 0,
      longitude: location.longitude || 0,
    }
  });
  writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
}

const lookupCountry = (countryCode: string): string => {
  const foundCountry = countriesData.filter(country => country.Code === countryCode);
  if (foundCountry.length === 1) {
    return foundCountry[0].Name;
  } else {
    return '';
  }
}

const lookupAirport = (city: string, originalName: string, dataSource: LargeCityData[] = largeAirportData): LargeCityData | null => {
  const matches: LargeCityData[] = [];
  let match: LargeCityData | null = null;
  
  // Function to normalize city names by removing common suffixes
  const normalizeCityName = (name: string): string => {
    return name
      .replace(/\s+(City|Town|Village|Borough|District|County|Province|State|Region)$/i, '')
      .replace(/\s*\([^)]*\)$/, '') // Remove parenthetical suffixes like "(Xiaogang)"
      .trim();
  };
  
  const normalizedCity = normalizeCityName(city);
  const normalizedOriginalName = normalizeCityName(originalName);
  
  // First, search for matches by municipality (city name)
  dataSource.forEach(entry => {
    if (entry.municipality) {
      const normalizedMunicipality = normalizeCityName(entry.municipality);
      if (normalizedMunicipality.toLowerCase() === normalizedCity.toLowerCase()) {
        matches.push(entry);
      }
    }
  });
  
  // If no matches found by municipality, search by airport name using normalized originalName
  if (matches.length === 0) {
    allAirportData.forEach(entry => {
      if (entry.name) {
        const normalizedAirportName = normalizeCityName(entry.name);
        if (normalizedAirportName.toLowerCase().includes(normalizedOriginalName.toLowerCase())) {
          matches.push(entry);
        }
      }
    });
  }
  
  if (matches.length > 1) { // Handle multiple matches
    const tempMatches: LargeCityData[] = [];
    matches.forEach(m => {
      if (m.name.toLowerCase().indexOf('international') !== -1) {
        tempMatches.push(m);
      }
    });
    if (tempMatches.length > 0) { // Multiple matches, take first one, kind of random selection
      match = tempMatches[0];
    } else { // no "international" tempMatches, fallback to first el of unfiltered matches
      match = matches[0];
    }
  } else { // Single match
    match = matches[0];
  }
  return match;
}

const run = async (): Promise<void> => {
  const browser = await puppeteer.launch({
    args: [
      '--lang=en-US',
      '--accept-lang=en-US,en',
      '--disable-web-security',
      '--disable-features=TranslateUI',
      '--no-sandbox'
    ]
  });
  const page = await browser.newPage();

  // Set the language forcefully on javascript
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "language", {
        get: function() {
            return "en-US";
        }
    });
    Object.defineProperty(navigator, "languages", {
        get: function() {
            return ["en-US", "en"];
        }
    });
  });

  page.on('console', consoleObj => console.log(consoleObj.text()));

  const response = await page.goto('https://www.cloudflare.com/network/', { waitUntil: 'networkidle0' })

  if (response && response.status() > 399) {
    throw new Error(`Failed with response code ${response.status()}`)
  }

  const data = await page.evaluate(() => {
    const cities = [];
    const rawCities = document.evaluate('//*[starts-with(@id,"accordion__panel-regionlist-id-")]/div/div[*]/div', document);
  
    // First iterator
    let citiesIterator = rawCities.iterateNext();

    // Iterate over entries
    while (citiesIterator) {
      cities.push(citiesIterator.textContent || ''); 
      citiesIterator = rawCities.iterateNext();
    }

    // Function to normalize accented characters to their plain representations
    const normalizeAccents = (str) => {
      return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    };

    const cleanedCities = cities.map((city) => {
      const temp = city.split(', ');
      const originalName = temp.length === 2 ? temp[0] : temp[0];
      let cleanedName = originalName;
      
      // Normalize accented characters first
      cleanedName = normalizeAccents(cleanedName);
      
      // Remove asterisks from city names
      cleanedName = cleanedName.replace(/\*/g, '');
      
      // Apply specific city name corrections
      cleanedName = cleanedName.replace('Frankfurt', 'Frankfurt am Main');
      cleanedName = cleanedName.replace('Luxembourg City', 'Luxembourg');
      cleanedName = cleanedName.replace('Ekaterinburg', 'Yekaterinburg');
      cleanedName = cleanedName.replace('Bhubaneshwar', 'Bhubaneswar');
      cleanedName = cleanedName.replace('Basra', 'Basrah');
      
      return {
        cleanedName: cleanedName,
        originalName: originalName
      };
    });

    return cleanedCities;
  });

  await page.close();
  await browser.close();

  const withAirports = data.map((cityData) => {
    const location: EdgeLocation = {
      city: cityData.cleanedName
    };
    const airport = lookupAirport(utf8.encode(cityData.cleanedName), cityData.originalName);
    if (airportOverridesData.hasOwnProperty(location.city.toLowerCase())) {
      const overrideData = airportOverridesData[location.city.toLowerCase()];
      location.code = overrideData.code;
      location.countryCode = overrideData.countryCode;
      location.country = lookupCountry(overrideData.countryCode);
      location.latitude = overrideData.latitude;
      location.longitude = overrideData.longitude;
    } else if (airport) {
      location.code = airport.iata_code;
      location.countryCode = airport.iso_country;
      location.country = lookupCountry(airport.iso_country);
      const coordinate = airport.coordinates.split(', ');
      location.latitude = parseFloat(coordinate[1]);
      location.longitude = parseFloat(coordinate[0]);
    } else {
      // Run a second pass with all airports if not found before. Increases data quality
      const smallAirport = lookupAirport(utf8.encode(location.city), cityData.originalName, allAirportData);
      if (smallAirport) {
        location.code = smallAirport.iata_code;
        location.countryCode = smallAirport.iso_country;
        location.country = lookupCountry(smallAirport.iso_country);
        const coordinate = smallAirport.coordinates.split(', ');
        location.latitude = parseFloat(coordinate[1]);
        location.longitude = parseFloat(coordinate[0]);
      }
    }
    return location;
  });

  writeJSON(withAirports);

  invalidCounter = 1;

  writeCSV(withAirports);
}

run();
