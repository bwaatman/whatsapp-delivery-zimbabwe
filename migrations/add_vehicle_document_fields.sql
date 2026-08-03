-- Add vehicle-specific document fields to driver_registration_requests table

-- Bicycle-specific documents
ALTER TABLE driver_registration_requests
ADD COLUMN IF NOT EXISTS bicycle_photo_doc_id UUID REFERENCES documents(id),
ADD COLUMN IF NOT EXISTS bicycle_brand VARCHAR(100),
ADD COLUMN IF NOT EXISTS frame_number VARCHAR(100);

-- Motorcycle/Car/Van documents
ALTER TABLE driver_registration_requests
ADD COLUMN IF NOT EXISTS driver_licence_doc_id UUID REFERENCES documents(id),
ADD COLUMN IF NOT EXISTS vehicle_registration_book_doc_id UUID REFERENCES documents(id),
ADD COLUMN IF NOT EXISTS motorcycle_photo_doc_id UUID REFERENCES documents(id),
ADD COLUMN IF NOT EXISTS vehicle_photo_doc_id UUID REFERENCES documents(id),
ADD COLUMN IF NOT EXISTS insurance_doc_id UUID REFERENCES documents(id);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_driver_registration_requests_vehicle_docs ON driver_registration_requests(driver_licence_doc_id, vehicle_registration_book_doc_id, vehicle_photo_doc_id);
