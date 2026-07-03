-- Create transaction ledger table
CREATE TABLE transaction_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('earning', 'deduction', 'payout', 'deposit', 'refund', 'debt', 'credit', 'adjustment', 'withhold', 'release')),
  amount DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,
  reference_id UUID,
  reference_type VARCHAR(50),
  description TEXT,
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX idx_transaction_ledger_wallet_id ON transaction_ledger(wallet_id);
CREATE INDEX idx_transaction_ledger_transaction_type ON transaction_ledger(transaction_type);
CREATE INDEX idx_transaction_ledger_reference ON transaction_ledger(reference_id, reference_type);
CREATE INDEX idx_transaction_ledger_created_at ON transaction_ledger(created_at);
