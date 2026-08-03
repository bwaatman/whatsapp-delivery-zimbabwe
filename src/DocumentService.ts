import { supabase } from './database';
import { createClient } from '@supabase/supabase-js';

export interface Document {
  id: string;
  entity_type: 'driver' | 'vendor';
  entity_id: string;
  document_type: string;
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  upload_status: 'pending' | 'uploaded' | 'failed';
  admin_review_status: 'pending' | 'approved' | 'rejected' | 'needs_resubmission';
  admin_comments?: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentUploadResult {
  success: boolean;
  document_id?: string;
  file_path?: string;
  error?: string;
}

export class DocumentService {
  private supabaseStorage: any;
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/pdf'
  ];

  constructor() {
    // Initialize Supabase storage client
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
    this.supabaseStorage = createClient(supabaseUrl, supabaseServiceKey);
  }

  /**
   * Validate file before upload
   */
  private validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return { valid: false, error: `File size exceeds maximum of ${this.MAX_FILE_SIZE / 1024 / 1024}MB` };
    }

    // Check file type
    if (!this.ALLOWED_MIME_TYPES.includes(file.type)) {
      return { valid: false, error: `Invalid file type. Allowed types: ${this.ALLOWED_MIME_TYPES.join(', ')}` };
    }

    return { valid: true };
  }

  /**
   * Upload a document from buffer to Supabase storage and create database record
   */
  async uploadDocumentFromBuffer(
    entityType: 'driver' | 'vendor',
    entityId: string,
    documentType: string,
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    userId?: string
  ): Promise<DocumentUploadResult> {
    try {
      console.log(`📄 Uploading document from buffer: ${documentType} for ${entityType} ${entityId}`);

      // Validate file size
      if (buffer.length > this.MAX_FILE_SIZE) {
        return { success: false, error: `File size exceeds maximum of ${this.MAX_FILE_SIZE / 1024 / 1024}MB` };
      }

      // Validate file type
      if (!this.ALLOWED_MIME_TYPES.includes(mimeType)) {
        return { success: false, error: `Invalid file type. Allowed types: ${this.ALLOWED_MIME_TYPES.join(', ')}` };
      }

      // Generate unique file name
      const fileExtension = fileName.split('.').pop();
      const uniqueFileName = `${entityType}/${entityId}/${documentType}_${Date.now()}.${fileExtension}`;

      // Convert buffer to Uint8Array for upload
      const uint8Array = new Uint8Array(buffer);

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await this.supabaseStorage.storage
        .from('documents')
        .upload(uniqueFileName, uint8Array, {
          contentType: mimeType,
          upsert: false
        });

      if (uploadError) {
        console.error('❌ Error uploading file to storage:', uploadError);
        return { success: false, error: 'Failed to upload file to storage' };
      }

      // Get public URL (or signed URL for private access)
      const { data: urlData } = this.supabaseStorage.storage
        .from('documents')
        .getPublicUrl(uniqueFileName);

      // Create database record
      const { data: documentData, error: dbError } = await supabase
        .from('documents')
        .insert({
          entity_type: entityType,
          entity_id: entityId,
          document_type: documentType,
          file_path: uniqueFileName,
          file_name: fileName,
          file_size: buffer.length,
          mime_type: mimeType,
          upload_status: 'uploaded',
          admin_review_status: 'pending'
        })
        .select()
        .single();

      if (dbError) {
        console.error('❌ Error creating document record:', dbError);
        // Clean up uploaded file if database insert fails
        await this.supabaseStorage.storage.from('documents').remove([uniqueFileName]);
        return { success: false, error: 'Failed to create document record' };
      }

      console.log('✅ Document uploaded successfully:', documentData.id);
      return {
        success: true,
        document_id: documentData.id,
        file_path: uniqueFileName
      };
    } catch (error) {
      console.error('❌ Exception in uploadDocumentFromBuffer:', error);
      return { success: false, error: 'Failed to upload document' };
    }
  }

  /**
   * Upload a document to Supabase storage and create database record
   */
  async uploadDocument(
    entityType: 'driver' | 'vendor',
    entityId: string,
    documentType: string,
    file: File,
    userId?: string
  ): Promise<DocumentUploadResult> {
    try {
      console.log(`📄 Uploading document: ${documentType} for ${entityType} ${entityId}`);

      // Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Generate unique file name
      const fileExtension = file.name.split('.').pop();
      const uniqueFileName = `${entityType}/${entityId}/${documentType}_${Date.now()}.${fileExtension}`;

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await this.supabaseStorage.storage
        .from('documents')
        .upload(uniqueFileName, file);

      if (uploadError) {
        console.error('❌ Error uploading file to storage:', uploadError);
        return { success: false, error: 'Failed to upload file to storage' };
      }

      // Get public URL (or signed URL for private access)
      const { data: urlData } = this.supabaseStorage.storage
        .from('documents')
        .getPublicUrl(uniqueFileName);

      // Create database record
      const { data: documentData, error: dbError } = await supabase
        .from('documents')
        .insert({
          entity_type: entityType,
          entity_id: entityId,
          document_type: documentType,
          file_path: uniqueFileName,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          upload_status: 'uploaded',
          admin_review_status: 'pending'
        })
        .select()
        .single();

      if (dbError) {
        console.error('❌ Error creating document record:', dbError);
        // Clean up uploaded file if database insert fails
        await this.supabaseStorage.storage.from('documents').remove([uniqueFileName]);
        return { success: false, error: 'Failed to create document record' };
      }

      console.log('✅ Document uploaded successfully:', documentData.id);
      return {
        success: true,
        document_id: documentData.id,
        file_path: uniqueFileName
      };
    } catch (error) {
      console.error('❌ Exception in uploadDocument:', error);
      return { success: false, error: 'Failed to upload document' };
    }
  }

  /**
   * Get a document by ID
   */
  async getDocument(documentId: string): Promise<Document | null> {
    try {
      console.log('📄 Getting document:', documentId);

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (error) {
        console.error('❌ Error getting document:', error);
        return null;
      }

      return data as Document;
    } catch (error) {
      console.error('❌ Exception in getDocument:', error);
      return null;
    }
  }

  /**
   * Get all documents for an entity (driver or vendor)
   */
  async getDocumentsByEntity(
    entityType: 'driver' | 'vendor',
    entityId: string
  ): Promise<Document[]> {
    try {
      console.log(`📄 Getting documents for ${entityType} ${entityId}`);

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error getting documents:', error);
        return [];
      }

      return data as Document[];
    } catch (error) {
      console.error('❌ Exception in getDocumentsByEntity:', error);
      return [];
    }
  }

  /**
   * Update document review status (admin only)
   */
  async updateDocumentReviewStatus(
    documentId: string,
    reviewStatus: 'approved' | 'rejected' | 'needs_resubmission',
    adminComments?: string
  ): Promise<boolean> {
    try {
      console.log(`📄 Updating document ${documentId} review status to ${reviewStatus}`);

      const { error } = await supabase
        .from('documents')
        .update({
          admin_review_status: reviewStatus,
          admin_comments: adminComments || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);

      if (error) {
        console.error('❌ Error updating document review status:', error);
        return false;
      }

      console.log('✅ Document review status updated successfully');
      return true;
    } catch (error) {
      console.error('❌ Exception in updateDocumentReviewStatus:', error);
      return false;
    }
  }

  /**
   * Delete a document (admin only)
   */
  async deleteDocument(documentId: string): Promise<boolean> {
    try {
      console.log('📄 Deleting document:', documentId);

      // Get document details first
      const document = await this.getDocument(documentId);
      if (!document) {
        return false;
      }

      // Delete from storage
      const { error: storageError } = await this.supabaseStorage.storage
        .from('documents')
        .remove([document.file_path]);

      if (storageError) {
        console.error('❌ Error deleting file from storage:', storageError);
        return false;
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (dbError) {
        console.error('❌ Error deleting document from database:', dbError);
        return false;
      }

      console.log('✅ Document deleted successfully');
      return true;
    } catch (error) {
      console.error('❌ Exception in deleteDocument:', error);
      return false;
    }
  }

  /**
   * Get signed URL for secure document access
   */
  async getSignedUrl(documentId: string, expiresIn: number = 3600): Promise<string | null> {
    try {
      const document = await this.getDocument(documentId);
      if (!document) {
        return null;
      }

      const { data, error } = await this.supabaseStorage.storage
        .from('documents')
        .createSignedUrl(document.file_path, expiresIn);

      if (error) {
        console.error('❌ Error creating signed URL:', error);
        return null;
      }

      return data.signedUrl;
    } catch (error) {
      console.error('❌ Exception in getSignedUrl:', error);
      return null;
    }
  }
}
