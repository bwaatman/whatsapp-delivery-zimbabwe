import { Router, Request, Response } from 'express';
import { DocumentService } from './DocumentService';
const multer = require('multer');

const router = Router();
const documentService = new DocumentService();

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Extend Request type to include file property
interface MulterRequest extends Request {
  file?: any;
}

// Helper function to safely extract string from params
function getParam(param: string | string[]): string {
  return Array.isArray(param) ? param[0] : param;
}

// Upload a document
router.post('/documents/upload', upload.single('file'), async (req: MulterRequest, res: Response) => {
  try {
    const { entityType, entityId, documentType } = req.body;

    if (!entityType || !entityId || !documentType) {
      return res.status(400).json({ error: 'Missing required fields: entityType, entityId, documentType' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate entityType
    if (entityType !== 'driver' && entityType !== 'vendor') {
      return res.status(400).json({ error: 'Invalid entityType. Must be "driver" or "vendor"' });
    }

    // Upload document using buffer directly
    const result = await documentService.uploadDocumentFromBuffer(
      entityType as 'driver' | 'vendor',
      entityId,
      documentType,
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.status(201).json({
      success: true,
      document_id: result.document_id,
      file_path: result.file_path
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// Get a document by ID
router.get('/documents/:id', async (req: Request, res: Response) => {
  try {
    const document = await documentService.getDocument(getParam(req.params.id));
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json(document);
  } catch (error) {
    console.error('Error getting document:', error);
    res.status(500).json({ error: 'Failed to get document' });
  }
});

// Get all documents for an entity
router.get('/documents/entity/:type/:id', async (req: Request, res: Response) => {
  try {
    const entityType = getParam(req.params.type);
    const entityId = getParam(req.params.id);

    if (entityType !== 'driver' && entityType !== 'vendor') {
      return res.status(400).json({ error: 'Invalid entity type. Must be "driver" or "vendor"' });
    }

    const documents = await documentService.getDocumentsByEntity(
      entityType as 'driver' | 'vendor',
      entityId
    );
    res.json(documents);
  } catch (error) {
    console.error('Error getting documents:', error);
    res.status(500).json({ error: 'Failed to get documents' });
  }
});

// Update document review status (admin only)
router.put('/documents/:id/review', async (req: Request, res: Response) => {
  try {
    const { reviewStatus, adminComments } = req.body;

    if (!reviewStatus || !['approved', 'rejected', 'needs_resubmission'].includes(reviewStatus)) {
      return res.status(400).json({ error: 'Invalid review status' });
    }

    const success = await documentService.updateDocumentReviewStatus(
      getParam(req.params.id),
      reviewStatus,
      adminComments
    );

    if (!success) {
      return res.status(400).json({ error: 'Failed to update document review status' });
    }

    res.json({ success: true, message: 'Document review status updated successfully' });
  } catch (error) {
    console.error('Error updating document review status:', error);
    res.status(500).json({ error: 'Failed to update document review status' });
  }
});

// Get signed URL for document access
router.get('/documents/:id/signed-url', async (req: Request, res: Response) => {
  try {
    const expiresIn = req.query.expiresIn ? parseInt(getParam(req.query.expiresIn as string | string[])) : 3600;
    const signedUrl = await documentService.getSignedUrl(getParam(req.params.id), expiresIn);

    if (!signedUrl) {
      return res.status(404).json({ error: 'Document not found or failed to generate signed URL' });
    }

    res.json({ signed_url: signedUrl });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    res.status(500).json({ error: 'Failed to generate signed URL' });
  }
});

// Delete a document (admin only)
router.delete('/documents/:id', async (req: Request, res: Response) => {
  try {
    const success = await documentService.deleteDocument(getParam(req.params.id));

    if (!success) {
      return res.status(400).json({ error: 'Failed to delete document' });
    }

    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

export default router;
