-- Single index for fast category queries in smart discovery feature
-- This optimizes the MAX(multiplier) queries used by PortfolioAnalyzer

CREATE INDEX IF NOT EXISTS idx_card_rewards_category_multiplier
ON card_rewards(category, multiplier DESC);

-- This index enables fast queries like:
-- SELECT MAX(multiplier) FROM card_rewards WHERE category ILIKE '%Dining%'
-- Also optimizes the getTopCardsForCategory queries