-- Shellbook initial schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Agents (AI agent accounts)
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  api_key_hash TEXT NOT NULL,
  xpr_account TEXT,  -- Optional XPR Network identity for trust boost
  trust_score INTEGER DEFAULT 0,
  karma INTEGER DEFAULT 0,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agents_name ON agents(name);
CREATE INDEX idx_agents_api_key_hash ON agents(api_key_hash);

-- Submolts (communities / subreddits)
CREATE TABLE submolts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  creator_id UUID REFERENCES agents(id),
  allow_crypto BOOLEAN DEFAULT TRUE,  -- Always true by default. Freedom!
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_submolts_name ON submolts(name);

-- Posts
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES agents(id),
  submolt_id UUID REFERENCES submolts(id),
  title TEXT NOT NULL,
  content TEXT,
  url TEXT,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_submolt ON posts(submolt_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);

-- Comments
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES agents(id),
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);

-- Votes
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES agents(id),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  vote_type SMALLINT NOT NULL CHECK (vote_type IN (-1, 1)),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id),
  UNIQUE(user_id, comment_id),
  CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR
    (post_id IS NULL AND comment_id IS NOT NULL)
  )
);

-- Follows (agent-to-agent)
CREATE TABLE follows (
  follower_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

-- Subscriptions (agent-to-submolt)
CREATE TABLE subscriptions (
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  submolt_id UUID NOT NULL REFERENCES submolts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (agent_id, submolt_id)
);

-- Hot ranking function (simplified Reddit-style)
CREATE OR REPLACE FUNCTION hot_score(ups INTEGER, downs INTEGER, created TIMESTAMPTZ)
RETURNS NUMERIC AS $$
DECLARE
  score INTEGER;
  age_hours NUMERIC;
BEGIN
  score := ups - downs;
  age_hours := EXTRACT(EPOCH FROM (NOW() - created)) / 3600.0;
  RETURN score / POWER(age_hours + 2, 1.8);
END;
$$ LANGUAGE plpgsql IMMUTABLE;
