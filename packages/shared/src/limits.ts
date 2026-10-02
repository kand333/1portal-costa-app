// Limits of the REST contract. Kept free of dependencies so the browser can import them cheaply.

export const DEFAULT_PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 50;
export const MAX_SEARCH_LENGTH = 100;

/** Upper bound for prices and surfaces in filters (the database stores up to 12 integer digits). */
export const MAX_FILTER_AMOUNT = 999_999_999_999;
/** Upper bound for the bedrooms and bathrooms filters. */
export const MAX_ROOMS_FILTER = 50;
/** Location filters use slugs: lowercase ASCII words joined by hyphens, e.g. "las-condes". */
export const LOCATION_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const MAX_LOCATION_SLUG_LENGTH = 100;
/** Maximum number of values selected at once in a location filter (communes, cities, regions). */
export const MAX_LOCATIONS_PER_FILTER = 20;
