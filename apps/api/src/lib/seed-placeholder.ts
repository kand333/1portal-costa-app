/**
 * Prefix of the publicId of the development seed's placeholder images. They are public Unsplash
 * photos, NOT assets in our Cloudinary account: never destroy them remotely.
 */
export const SEED_PLACEHOLDER_PUBLIC_ID_PREFIX = "seed-placeholder/";

export const isSeedPlaceholder = (publicId: string) => publicId.startsWith(SEED_PLACEHOLDER_PUBLIC_ID_PREFIX);
