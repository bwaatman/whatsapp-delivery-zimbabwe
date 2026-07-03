-- Create payout batches table
CREATE TABLE payout_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_number INTEGER NOT NULL,
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  processed_by UUID
);

-- Create indexes for faster lookups
CREATE INDEX idx_payout_batches_batch_number ON payout_batches(batch_number);
CREATE INDEX idx_payout_batches_status ON payout_batches(status);
CREATE INDEX idx_payout_batches_period ON payout_batches(period_start, period_end);
