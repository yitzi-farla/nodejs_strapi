const express = require('express');
const router = express.Router();

const STRAPI_URL = process.env.STRAPI_URL || process.env.URL || 'http://localhost:1337';
const API_TOKEN = process.env.STRAPI_API_TOKEN;

router.get('/:slug', async (req, res) => {
  const { slug } = req.params;

  try {
    const response = await fetch(
      `${STRAPI_URL}/api/products?filters[slug][$eq]=${slug}&populate=deep`,
      {
        headers: {
          Authorization: `Bearer ${API_TOKEN}`
        }
      }
    );

    const json = await response.json();
    const data = json?.data?.[0]?.attributes;

    if (!data) {
      return res.status(404).send('Product not found');
    }

    const html = generateHTML(data);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);

  } catch (err) {
    console.error('[ERROR] Failed to generate HTML:', err);
    res.status(500).send('Error generating HTML');
  }
});

function generateHTML(data) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${data.title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            line-height: 1.6;
            color: #1a1a1a;
          }
          h1, h2 {
            color: #1a1a1a;
          }
          img {
            max-width: 100%;
            border-radius: 8px;
          }
          .section {
            margin-bottom: 40px;
          }
          .gallery {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
          }
          .specs ul,
          .inclusions ul {
            list-style: none;
            padding: 0;
          }
          .specs li,
          .inclusions li {
            margin-bottom: 6px;
          }
          .cta-button {
            display: inline-block;
            margin-top: 10px;
            padding: 10px 20px;
            background: #007acc;
            color: #fff;
            text-decoration: none;
            border-radius: 4px;
          }
        </style>
      </head>
      <body>
        <h1>${data.title}</h1>
        <p>${data.summary || ''}</p>

        ${data.heroImages?.data?.map(img => `<img src="${img.attributes.url}" alt="Hero Image" />`).join('') || ''}

        ${data.features?.map(block => `
          <div class="section feature-block">
            <h2>${block.title}</h2>
            <p>${block.description}</p>
            ${block.image?.data ? `<img src="${block.image.data.attributes.url}" alt="Feature Image" />` : ''}
          </div>
        `).join('') || ''}

        ${data.specs?.length ? `
          <div class="section specs">
            <h2>Specifications</h2>
            <ul>
              ${data.specs.map(item => `<li><strong>${item.label}:</strong> ${item.value}</li>`).join('')}
            </ul>
          </div>` : ''}

        ${data.inclusions?.length ? `
          <div class="section inclusions">
            <h2>What's Included</h2>
            <ul>
              ${data.inclusions.map(i => `<li>${i.item}</li>`).join('')}
            </ul>
          </div>` : ''}

        ${data.benefits?.length ? `
          <div class="section benefits">
            <h2>Key Benefits</h2>
            ${data.benefits.map(i => `<p><strong>${i.title}:</strong> ${i.description}</p>`).join('')}
          </div>` : ''}

        ${data.gallery?.data?.length ? `
          <div class="section gallery">
            ${data.gallery.data.map(img => `<img src="${img.attributes.url}" alt="Gallery Image" />`).join('')}
          </div>` : ''}

        ${data.certificationNote ? `
          <div class="section certification-note">
            <p><strong>${data.certificationNote}</strong></p>
          </div>` : ''}

        ${data.ctaTitle ? `
          <div class="section cta">
            <h2>${data.ctaTitle}</h2>
            <p>${data.ctaText}</p>
            ${data.ctaButtonLabel && data.ctaButtonLink ? `
              <a class="cta-button" href="${data.ctaButtonLink}">${data.ctaButtonLabel}</a>` : ''}
          </div>` : ''}
      </body>
    </html>
  `;
}

module.exports = router;
