CREATE TABLE IF NOT EXISTS post_index (
  category_id TEXT NOT NULL,
  post_id TEXT NOT NULL,
  title TEXT NOT NULL,
  published_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  author TEXT NOT NULL,
  summary TEXT NOT NULL,
  tags TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (category_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_post_index_published_at ON post_index (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_index_category_published_at ON post_index (category_id, published_at DESC);
