import edgeLocations from "./data/cloudflare-edge-locations.json" with { type: "json" };

export interface EdgeLocation {
  code?:         string;
  city:          string;
  country:       string;
  countryCode:   string;
  latitude:      number;
  longitude:     number;
}

export interface EdgeLocations {
  [key: string]: EdgeLocation;
}

const cloudflareEdgeLocations = edgeLocations as EdgeLocations;

export default class CloudFlareEdgeLocations {
  constructor() {}

  getLocationCount (): number {
    return Object.getOwnPropertyNames(cloudflareEdgeLocations).length;
  }

  getLocations (): EdgeLocations {
    return cloudflareEdgeLocations;
  }

  lookup (code: string): EdgeLocation | false {
    if (cloudflareEdgeLocations.hasOwnProperty(code.toUpperCase())) {
      return cloudflareEdgeLocations[code.toUpperCase()];
    } else {
      return false;
    }
  }
}
