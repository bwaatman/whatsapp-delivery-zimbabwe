import { Router, Request, Response } from 'express';
import { supabase } from './database';

const router = Router();

// Get all business categories
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('business_categories')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error getting categories:', error);
      return res.status(500).json({ error: 'Failed to get categories' });
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

// Get category by ID
router.get('/categories/:id', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('business_categories')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (error) {
      console.error('Error getting category:', error);
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error getting category:', error);
    res.status(500).json({ error: 'Failed to get category' });
  }
});

export default router;
