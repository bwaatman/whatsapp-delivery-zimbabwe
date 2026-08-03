-- Add document verification fields to vendor_registration_requests table

-- Registration type (individual vs registered business)
ALTER TABLE vendor_registration_requests
ADD COLUMN IF NOT EXISTS registration_type VARCHAR(30) DEFAULT 'individual' CHECK (registration_type IN ('individual', 'registered_business'));

-- Document reference fields for individual vendors
ALTER TABLE vendor_registration_requests
ADD COLUMN IF NOT EXISTS national_id_doc_id UUID REFERENCES documents(id),
ADD COLUMN IF NOT EXISTS proof_of_address_doc_id UUID REFERENCES documents(id);

-- Document reference fields for registered businesses
ALTER TABLE vendor_registration_requests
ADD COLUMN IF NOT EXISTS certificate_of_incorporation_doc_id UUID REFERENCES documents(id);

-- Tax and business numbers
ALTER TABLE vendor_registration_requests
ADD COLUMN IF NOT EXISTS tax_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS vat_number VARCHAR(50);

-- Additional business licences
ALTER TABLE vendor_registration_requests
ADD COLUMN IF NOT EXISTS business_licence_doc_id UUID REFERENCES documents(id),
ADD COLUMN IF NOT EXISTS trading_licence_doc_id UUID REFERENCES documents(id);

-- Business photos (required for all vendors)
ALTER TABLE vendor_registration_requests
ADD COLUMN IF NOT EXISTS shop_front_photo_doc_id UUID REFERENCES documents(id),
ADD COLUMN IF NOT EXISTS interior_photo_doc_id UUID REFERENCES documents(id);

-- Optional business area photos
ALTER TABLE vendor_registration_requests
ADD COLUMN IF NOT EXISTS kitchen_photo_doc_id UUID REFERENCES documents(id),
ADD COLUMN IF NOT EXISTS storage_photo_doc_id UUID REFERENCES documents(id);

-- Food vendor optional documents
ALTER TABLE vendor_registration_requests
ADD COLUMN IF NOT EXISTS health_certificate_doc_id UUID REFERENCES documents(id),
ADD COLUMN IF NOT EXISTS food_handling_permit_doc_id UUID REFERENCES documents(id),
ADD COLUMN IF NOT EXISTS restaurant_licence_doc_id UUID REFERENCES documents(id);

-- Verification status
ALTER TABLE vendor_registration_requests
ADD COLUMN IF NOT EXISTS verification_status VARCHAR(30) DEFAULT 'submitted' CHECK (verification_status IN ('submitted', 'under_review', 'approved', 'rejected', 'needs_resubmission')),
ADD COLUMN IF NOT EXISTS admin_review_comments TEXT;

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_vendor_registration_requests_registration_type ON vendor_registration_requests(registration_type);
CREATE INDEX IF NOT EXISTS idx_vendor_registration_requests_verification_status ON vendor_registration_requests(verification_status);
CREATE INDEX IF NOT EXISTS idx_vendor_registration_requests_doc_refs ON vendor_registration_requests(national_id_doc_id, proof_of_address_doc_id, shop_front_photo_doc_id);
