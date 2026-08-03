-- Create documents table for secure file storage
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('driver', 'vendor')),
    entity_id UUID NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    upload_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (upload_status IN ('pending', 'uploaded', 'failed')),
    admin_review_status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (admin_review_status IN ('pending', 'approved', 'rejected', 'needs_resubmission')),
    admin_comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX idx_documents_entity ON documents(entity_type, entity_id);
CREATE INDEX idx_documents_document_type ON documents(document_type);
CREATE INDEX idx_documents_review_status ON documents(admin_review_status);

-- Add RLS policies for document security
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own documents
CREATE POLICY "Users can view own documents"
    ON documents FOR SELECT
    USING (
        entity_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = true
        )
    );

-- Policy: Only admins can update document review status
CREATE POLICY "Admins can update documents"
    ON documents FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = true
        )
    );

-- Policy: Users can insert their own documents
CREATE POLICY "Users can insert own documents"
    ON documents FOR INSERT
    WITH CHECK (
        entity_id = auth.uid()
    );

-- Policy: Only admins can delete documents
CREATE POLICY "Admins can delete documents"
    ON documents FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM admin_users WHERE id = auth.uid() AND is_active = true
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER documents_updated_at_trigger
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_documents_updated_at();
