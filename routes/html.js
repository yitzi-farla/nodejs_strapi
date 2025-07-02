const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

const STRAPI_URL = process.env.STRAPI_URL;
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

router.get('/:slug', async (req, res) => {
  const slug = req.params.slug;

  try {
    const response = await fetch(
      `${STRAPI_URL}/api/products?filters[slug][$eq]=${slug}&populate=deep`,
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

    const json = await response.json();
    const product = json.data?.[0];

    if (!product) {
      return res.status(404).send('Product not found');
    }

    const attrs = product;

    const title = attrs.ctaTitle || attrs.slug || 'Untitled Product';
    const summary = (attrs.summary || [])
      .map(p => p.children?.map(c => c.text).join('') || '')
      .join('<br>');

    const heroImages = attrs.heroImages || [];
    const gallery = attrs.gallery || [];
    const specs = attrs.specs || [];
    const features = attrs.features || [];
    const benefits = attrs.benefits || [];

    const specTable = specs.length
      ? `
        <table>
          <thead><tr><th>Label</th><th>Value</th></tr></thead>
          <tbody>
            ${specs.map(s => `<tr><td>${s.label}</td><td>${s.value}</td></tr>`).join('')}
          </tbody>
        </table>`
      : '';

    const featureBlocks = features.map(f => {
      const desc = f.description?.map(p => p.children?.map(c => c.text).join('') || '').join('<br>') || '';
      return `
        <div class="feature">
          <h3>${f.title}</h3>
          <p>${desc}</p>
        </div>`;
    }).join('');

    const benefitList = benefits.length
      ? `<ul>${benefits.map(b => `<li><strong>${b.title}</strong>: ${b.description}</li>`).join('')}</ul>`
      : '';

    const heroHTML = heroImages.map(img => `
      <img src="${STRAPI_URL}${img.url}" alt="${img.name}" class="hero-img" />
    `).join('');

    const galleryHTML = gallery.map(img => `
      <img src="${STRAPI_URL}${img.url}" alt="${img.name}" class="gallery-img" />
    `).join('');

    res.send(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body {
              font-family: "Segoe UI", sans-serif;
              padding: 30px;
              max-width: 900px;
              margin: auto;
              background: #fdfdfd;
              color: #333;
            }

            h1, h2, h3 {
              color: #222;
            }

            .hero {
              display: flex;
              gap: 20px;
              margin-bottom: 30px;
              flex-wrap: wrap;
              justify-content: center;
            }

            .hero-img {
              max-width: 200px;
              border-radius: 12px;
              box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            }

            .gallery {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
              gap: 15px;
              margin-top: 20px;
            }

            .gallery-img {
              width: 100%;
              border-radius: 10px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 30px;
              background: #fff;
              border: 1px solid #ccc;
            }

            th, td {
              border: 1px solid #ccc;
              padding: 10px;
              text-align: left;
            }

            .features {
              margin-top: 40px;
            }

            .feature {
              background: #f7f9fb;
              padding: 20px;
              border-radius: 10px;
              margin-bottom: 20px;
            }

            .benefits {
              margin-top: 30px;
              background: #f1f9f1;
              padding: 20px;
              border-radius: 10px;
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p>${summary}</p>

          ${heroImages.length ? `<div class="hero">${heroHTML}</div>` : ''}

          ${specTable}

          ${features.length ? `<div class="features"><h2>Features</h2>${featureBlocks}</div>` : ''}

          ${benefits.length ? `<div class="benefits"><h2>Benefits</h2>${benefitList}</div>` : ''}

          ${gallery.length ? `<div class="gallery">${galleryHTML}</div>` : ''}
        </body>
      </html>
    `);
  } catch (err) {
    console.error('[ERROR] Failed to generate HTML:', err);
    res.status(500).send('Error generating HTML');
  }
});

module.exports = router;
