-- Existing installations may already have the original post_index table from
-- before metric keys were separated from public category directory IDs.
ALTER TABLE post_index ADD COLUMN metric_category_id TEXT NOT NULL DEFAULT '';

-- Old rows used category_id for both values; preserve that mapping on upgrade.
UPDATE post_index
SET metric_category_id = category_id
WHERE metric_category_id = '';
