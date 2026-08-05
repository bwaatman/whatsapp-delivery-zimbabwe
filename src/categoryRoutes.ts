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

// Update category delivery radius (admin only)
router.put('/categories/:id/radius', async (req: Request, res: Response) => {
  try {
    const { radius_km } = req.body;

    if (typeof radius_km !== 'number' || radius_km < 0) {
      return res.status(400).json({ error: 'Invalid radius value' });
    }

    const { data, error } = await supabase
      .from('business_categories')
      .update({ default_delivery_radius_km: radius_km })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating category radius:', error);
      return res.status(500).json({ error: 'Failed to update category radius' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error updating category radius:', error);
    res.status(500).json({ error: 'Failed to update category radius' });
  }
});

export default router;
