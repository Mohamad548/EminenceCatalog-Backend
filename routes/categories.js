import express from 'express';
import { query } from '../db.js';

const router = express.Router();

// GET /categories — دریافت همه دسته‌ها
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM categories ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error('Failed to get categories:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /categories — اضافه کردن دسته جدید
router.post('/', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Missing category name' });

  try {
    const result = await query(
      'INSERT INTO categories (name) VALUES ($1) RETURNING *',
      [name]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Failed to add category:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /categories/:id — ویرایش دسته
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Missing category name' });

  try {
    const result = await query(
      'UPDATE categories SET name = $1 WHERE id = $2 RETURNING *',
      [name, id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Category not found' });

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Failed to update category:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /categories/:id — حذف دسته به همراه محصولات مرتبط
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // حذف محصولات مرتبط با دسته
    await query('DELETE FROM products WHERE category_id = $1', [id]);

    // حذف دسته
    const result = await query(
      'DELETE FROM categories WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Category not found' });

    res.json({ message: 'Category and related products deleted successfully' });
  } catch (error) {
    console.error('Failed to delete category:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
