import { AttributeType } from "../kurier";

type LatitudeLongitudeAttribute = { lat: number; lng: number };

const LatitudeLongitude = AttributeType<string, LatitudeLongitudeAttribute>("LatitudeLongitude", {
  jsonType: Object,
  isSensitive: false,
  serialize(value) {
    const [lat, lng] = value.split(",");
    return { lat: Number(lat), lng: Number(lng) };
  },
  deserialize({ lat, lng }) {
    return `${lat},${lng}`;
  },
});

export default LatitudeLongitude;
