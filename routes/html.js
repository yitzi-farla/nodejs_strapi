const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

// Load from Railway-provided env vars
const STRAPI_URL = process.env.STRAPI_URL;
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

router.get('/:slug', async (req, res) => {
  const slug = req.params.slug;

  try {
    const response = await fetch(
      `${STRAPI_URL}/api/products?filters[slug][$eq]=${slug}&populate=*`,
      {
        headers: {
          Authorization: `Bearer ${STRAPI_API_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      console.error(`[ERROR] Strapi responded with status ${response.status}`);
      return res.status(500).send('Failed to fetch product data');
    }

    const data = await response.json();
    const product = data.data[0];

    if (!product) {
      return res.status(404).send('Product not found');
    }

    const attrs = product;

    const title = attrs.ctaTitle || 'Product';
    const summary = attrs.summary?.map(s =>
      s.children.map(c => c.text).join(' ')
    ).join('<br>') || '';

    const heroImages = attrs.heroImages || [];
    const specs = attrs.specs || [];

    const specTable = specs.map(s => `<tr><td>${s.label}</td><td>${s.value}</td></tr>`).join('');

    const galleryImgs = (attrs.gallery || [])
      .map(img => `<img src="${STRAPI_URL}${img.url}" style="max-height:150px; margin: 10px;" />`)
      .join('');

    res.send(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            img { border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
            table { border-collapse: collapse; width: 100%; margin-top: 20px; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>

          <p>${summary}</p>

          <div>
            ${heroImages
              .map(
                img => `<img src="${STRAPI_URL}${img.url}" alt="${img.name}" style="max-height:200px; margin: 10px;" />`
              )
              .join('')}
          </div>

          <h2>Specifications</h2>
          <table>
            <tbody>
              ${specTable}
            </tbody>
          </table>

          <h2>Gallery</h2>
          <div>${galleryImgs}</div>
        </body>
      </html>
    `);
  } catch (err) {
    console.error('[ERROR] Failed to generate HTML:', err);
    res.status(500).send('Error generating HTML');
  }
});

module.exports = router;
