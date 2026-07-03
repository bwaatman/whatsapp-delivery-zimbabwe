-- Create payouts table
CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES payout_batches(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('driver', 'vendor')),
  gross_amount DECIMAL(10,2) NOT NULL,
  debt_deductions DECIMAL(10,2) DEFAULT 0,
  credit_additions DECIMAL(10,2) DEFAULT 0,
  net_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processing', 'completed', 'failed', 'rejected')),
  bank_account_details JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  transaction_reference VARCHAR(100),
  notes TEXT
);

-- Create indexes for faster lookups
CREATE INDEX idx_payouts_batch_id ON payouts(batch_id);
CREATE INDEX idx_payouts_user_id ON payouts(user_id);
CREATE INDEX idx_payouts_status ON payouts(status);
CREATE INDEX idx_payouts_user_type ON payouts(user_type);
