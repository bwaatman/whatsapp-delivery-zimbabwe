-- Add order_details column to store customer's text order information
-- This allows us to capture what the customer wants to order before they send location

ALTER TABLE orders ADD COLUMN order_details TEXT;

-- Add a comment to describe the column purpose
COMMENT ON COLUMN orders.order_details IS 'Customer-provided order details and items requested';
