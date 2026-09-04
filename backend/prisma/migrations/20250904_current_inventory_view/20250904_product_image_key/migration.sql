-- Add image_key column to products table
-- Stores the R2/S3 object key (e.g. "products/abc123.jpg").
-- imageUrl is derived at runtime as CDN_URL + image_key; never stored.
ALTER TABLE "products" ADD COLUMN "image_key" VARCHAR(512);