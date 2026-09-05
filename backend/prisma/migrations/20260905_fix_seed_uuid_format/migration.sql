-- The original seed script used placeholder ids like
-- '11111111-1111-1111-1111-111111111111' for the default location/register/
-- tax categories/admin user. Those are syntactically UUID-shaped but don't
-- carry a valid RFC4122 version/variant nibble, so class-validator's
-- @IsUUID() rejects them wherever they get sent back to the API — e.g.
-- "locationId must be a UUID" when recording a stock movement against the
-- seeded "Main Store" location.
--
-- This updates any rows still using the old placeholder ids to the fixed
-- ids now used in prisma/seed.ts. All the relevant foreign keys are
-- declared ON UPDATE CASCADE (see the baseline migration), so updating
-- just the parent row's id is enough — Postgres propagates it to every
-- referencing row automatically. Safe to run even if seeding hasn't
-- happened yet (the WHERE clauses simply match zero rows).

UPDATE "tax_categories" SET "id" = '33333333-3333-4333-8333-333333333333' WHERE "id" = '33333333-3333-3333-3333-333333333333';
UPDATE "tax_categories" SET "id" = '44444444-4444-4444-8444-444444444444' WHERE "id" = '44444444-4444-4444-4444-444444444444';
UPDATE "tax_categories" SET "id" = '55555555-5555-5555-8555-555555555555' WHERE "id" = '55555555-5555-5555-5555-555555555555';
UPDATE "locations"      SET "id" = '11111111-1111-1111-8111-111111111111' WHERE "id" = '11111111-1111-1111-1111-111111111111';
UPDATE "registers"      SET "id" = '22222222-2222-2222-8222-222222222222' WHERE "id" = '22222222-2222-2222-2222-222222222222';
UPDATE "users"          SET "id" = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' WHERE "id" = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
