-- Add test drivers for spatial matching testing
-- These drivers are positioned around Harare, Zimbabwe for realistic testing

INSERT INTO drivers (id, name, phone, current_location, is_available) VALUES
-- Driver 1: Right in Harare city center
('550e8400-e29b-41d4-a716-446655440001', 'John Moyo', '+263111111111', 
 ST_SetSRID(ST_MakePoint(31.0539, -17.8292), 4326), true),

-- Driver 2: About 1.5km away from city center  
('550e8400-e29b-41d4-a716-446655440002', 'Mary Chenje', '+263222222222',
 ST_SetSRID(ST_MakePoint(31.0551, -17.8278), 4326), true),

-- Driver 3: About 2km away from city center
('550e8400-e29b-41d4-a716-446655440003', 'James Kuda', '+263333333333',
 ST_SetSRID(ST_MakePoint(31.0520, -17.8310), 4326), true),

-- Driver 4: Unavailable driver (should not be matched)
('550e8400-e29b-41d4-a716-446655440004', 'Sarah Dube', '+263444444444',
 ST_SetSRID(ST_MakePoint(31.0545, -17.8285), 4326), false);

-- Add comment for documentation
COMMENT ON TABLE drivers IS 'Delivery drivers with spatial locations and availability status';
