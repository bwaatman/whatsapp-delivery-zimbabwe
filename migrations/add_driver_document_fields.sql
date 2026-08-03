-- Add document verification fields to driver_registration_requests table

-- Document reference fields
ALTER TABLE driver_registration_requests
ADD COLUMN IF NOT EXISTS national_id_front_doc_id UUID REFERENCES documents(id),
ADD COLUMN IF NOT EXISTS national_id_back_doc_id UUID REFERENCES documents(id),
ADD COLUMN IF NOT EXISTS selfie_with_id_doc_id UUID REFERENCES documents(id),
ADD COLUMN IF NOT EXISTS profile_photo_doc_id UUID REFERENCES documents(id);

-- Emergency contact details
ALTER TABLE driver_registration_requests
ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS emergency_contact_relationship VARCHAR(100),
ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(20);

-- Payout details
ALTER TABLE driver_registration_requests
ADD COLUMN IF NOT EXISTS payout_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS payout_details JSONB;

-- Verification status
ALTER TABLE driver_registration_requests
ADD COLUMN IF NOT EXISTS verification_status VARCHAR(30) DEFAULT 'submitted' CHECK (verification_status IN ('submitted', 'under_review', 'approved', 'rejected', 'needs_resubmission')),
ADD COLUMN IF NOT EXISTS admin_review_comments TEXT;

-- Update existing records to have default emergency contact from existing fields
UPDATE driver_registration_requests
SET 
    emergency_contact_name = emergency_contact_name,
    emergency_contact_phone = emergency_contact_phone
WHERE emergency_contact_name IS NULL;

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_driver_registration_requests_verification_status ON driver_registration_requests(verification_status);
CREATE INDEX IF NOT EXISTS idx_driver_registration_requests_doc_refs ON driver_registration_requests(national_id_front_doc_id, national_id_back_doc_id, selfie_with_id_doc_id);
