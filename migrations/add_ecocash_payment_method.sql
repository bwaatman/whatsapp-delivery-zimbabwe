-- Update the payment_method check constraint to include 'ecocash'
-- First, drop the existing constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;

-- Then add the new constraint with all three payment methods
ALTER TABLE orders 
ADD CONSTRAINT orders_payment_method_check 
CHECK (payment_method IN ('cash', 'card', 'ecocash'));
