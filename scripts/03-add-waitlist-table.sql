-- Create waitlist table for users who want to be notified when the Farcaster mini app is live
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  farcaster_username TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  notified BOOLEAN DEFAULT FALSE,
  
  -- Ensure at least one contact method is provided
  CONSTRAINT check_contact_method CHECK (
    email IS NOT NULL OR farcaster_username IS NOT NULL
  ),
  
  -- Prevent duplicate entries
  CONSTRAINT unique_email UNIQUE (email),
  CONSTRAINT unique_farcaster UNIQUE (farcaster_username)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_waitlist_notified ON waitlist(notified) WHERE notified = FALSE;

-- Add comment
COMMENT ON TABLE waitlist IS 'Users waiting to be notified when Farcaster mini app launches';
