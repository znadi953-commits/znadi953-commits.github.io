import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    if (req.method === 'GET') {
      const { prompt_id, limit } = req.query;
      let query = supabase.from('reviews').select('*, prompts(id,title,preview_image_url)').order('created_at', { ascending: false });
      if (prompt_id) query = query.eq('prompt_id', prompt_id);
      if (limit) query = query.limit(Number(limit));
      const { data, error } = await query;
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      const { prompt_id, author_name, rating, comment } = req.body || {};
      if (!prompt_id || !author_name || !rating || !comment) return res.status(400).json({ error: 'Tous les champs sont requis.' });
      const ratingNum = Number(rating);
      if (ratingNum < 1 || ratingNum > 5) return res.status(400).json({ error: 'La note doit etre entre 1 et 5.' });
      const { data: review, error: insertError } = await supabase.from('reviews').insert({ prompt_id: Number(prompt_id), author_name, rating: ratingNum, comment }).select().single();
      if (insertError) throw insertError;
      const { data: all } = await supabase.from('reviews').select('rating').eq('prompt_id', Number(prompt_id));
      if (all && all.length > 0) {
        const avg = all.reduce((s, r) => s + r.rating, 0) / all.length;
        await supabase.from('prompts').update({ rating: Math.round(avg * 10) / 10, reviews_count: all.length }).eq('id', Number(prompt_id));
      }
      return res.status(201).json(review);
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API reviews error:', err);
    return res.status(500).json({ error: err.message });
  }
}
