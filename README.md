# cloudflare-edge-locations
Approximation of cloudflare.com edge locations, usable via a lookup mechanism.

## Installation
To install, you can do the following:

```bash
$ npm i cloudflare-edge-locations
```

## Usage

### Node

```javascript
const CloudFlareEdgeLocations = require('cloudflare-edge-locations').default;
// Or
// import CloudFlareEdgeLocations from 'cloudflare-edge-locations';

const el = new CloudFlareEdgeLocations();
const location = el.lookup('IAD');

/* returns
{
  "city": "Ashburn",
  "country": "United States",
  "countryCode": "US",
  "latitude": 38.94449997,
  "longitude": -77.45580292
}
*/

const invalid = el.lookup('FOO'); // returns false

// Get edge location count
const locationCount = el.getLocationCount(); // returns 285

// Get all edge locations
const locations = el.getLocations();
```

### TypeScript

This package includes TypeScript definitions and can be used in TypeScript projects:

```typescript
import CloudFlareEdgeLocations, { EdgeLocation } from 'cloudflare-edge-locations';

const el = new CloudFlareEdgeLocations();
const location: EdgeLocation | false = el.lookup('IAD');
```

## Data generation

Just run `npm run generate`.

## Data

This project is considered as in the `alpha` stage, so there's **no guarantee that the data is accurate**. Please feel free to test and give feedback either via creating an [issue](https://github.com/tobilg/cloudflare-edge-locations/issues) or a [pr](https://github.com/tobilg/cloudflare-edge-locations/pulls)

The data files can be found at
* [data/cloudflare-edge-locations.csv](data/cloudflare-edge-locations.csv)
* [data/cloudflare-edge-locations.json](data/cloudflare-edge-locations.json)
