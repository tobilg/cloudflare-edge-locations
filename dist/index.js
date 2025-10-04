"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cloudflare_edge_locations_json_1 = __importDefault(require("./data/cloudflare-edge-locations.json"));
const cloudflareEdgeLocations = cloudflare_edge_locations_json_1.default;
class CloudFlareEdgeLocations {
    constructor() { }
    getLocationCount() {
        return Object.getOwnPropertyNames(cloudflareEdgeLocations).length;
    }
    getLocations() {
        return cloudflareEdgeLocations;
    }
    lookup(code) {
        if (cloudflareEdgeLocations.hasOwnProperty(code.toUpperCase())) {
            return cloudflareEdgeLocations[code.toUpperCase()];
        }
        else {
            return false;
        }
    }
}
exports.default = CloudFlareEdgeLocations;
