-- Create driver debts table
CREATE TABLE driver_debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount_owed DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'partially_paid', 'paid', 'written_off')),
  created_at TIMESTAMP DEFAULT NOW(),
  settled_at TIMESTAMP,
  settlement_payout_id UUID
);

-- Create indexes for faster lookups
CREATE INDEX idx_driver_debts_driver_id ON driver_debts(driver_id);
CREATE INDEX idx_driver_debts_order_id ON driver_debts(order_id);
CREATE INDEX idx_driver_debts_status ON driver_debts(status);
