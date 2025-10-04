import { expect } from 'chai';
import CloudFlareEdgeLocations from '../src/index';

describe("# Testing the cloudflare-edge-locations functionality", function() {
  describe("## Basic functionality testing", function () {
    it("should return the data for IAD", function (done) {
      const el = new CloudFlareEdgeLocations();

      expect(el.lookup('IAD')).to.be.a('object');
      expect(el.lookup('IAD')).to.eql({
        "city": "Ashburn",
        "country": "United States",
        "countryCode": "US",
        "latitude": 38.94449997,
        "longitude": -77.45580292
      });
      done();
    });

    it("should return 'false' if code isn't found", function (done) {
      const el = new CloudFlareEdgeLocations();

      expect(el.lookup('FOO')).to.eql(false);
      done();
    });
  });
});
