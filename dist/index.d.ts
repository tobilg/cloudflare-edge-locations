export interface EdgeLocation {
    code?: string;
    city: string;
    country: string;
    countryCode: string;
    latitude: number;
    longitude: number;
}
export interface EdgeLocations {
    [key: string]: EdgeLocation;
}
export default class CloudFlareEdgeLocations {
    constructor();
    getLocationCount(): number;
    getLocations(): EdgeLocations;
    lookup(code: string): EdgeLocation | false;
}
