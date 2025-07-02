const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');

const STRAPI_URL = process.env.URL || 'http://localhost:1337';
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

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${slug}.pdf`);
    res.send(pdf);

  } catch (err) {
    console.error(err);
    res.status(500).send('Error generating PDF');
  }
});

function generateHTML(data) {
  return `
    <html>
      <head>
        <meta charset="utf-8">
        <title>${data.title}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
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
          .specs, .benefits, .features, .inclusions {
            margin-top: 20px;
          }
          .spec-item, .benefit-item, .feature-block, .inclusion-item {
            margin-bottom: 10px;
          }
        </style>
      </head>
      <body>
        <h1>${data.title}</h1>
        <p>${data.summary || ''}</p>

        ${data.heroImages?.data?.map(img => `<img src="${img.attributes.url}" />`).join('') || ''}

        ${data.features?.map(block => `
          <div class="feature-block">
            <h2>${block.title}</h2>
            <p>${block.description}</p>
            ${block.image?.data ? `<img src="${block.image.data.attributes.url}" />` : ''}
          </div>
        `).join('') || ''}

        ${data.specs?.length ? `
          <div class="specs">
            <h2>Specifications</h2>
            <ul>
              ${data.specs.map(item => `<li><strong>${item.label}:</strong> ${item.value}</li>`).join('')}
            </ul>
          </div>` : ''}

        ${data.inclusions?.length ? `
          <div class="inclusions">
            <h2>What's Included</h2>
            <ul>
              ${data.inclusions.map(i => `<li>${i.item}</li>`).join('')}
            </ul>
          </div>` : ''}

        ${data.benefits?.length ? `
          <div class="benefits">
            <h2>Key Benefits</h2>
            ${data.benefits.map(i => `<p><strong>${i.title}:</strong> ${i.description}</p>`).join('')}
          </div>` : ''}

        ${data.gallery?.data?.length ? `
          <div class="gallery">
            ${data.gallery.data.map(img => `<img src="${img.attributes.url}" />`).join('')}
          </div>` : ''}

        ${data.certificationNote ? `
          <div class="section">
            <p><strong>${data.certificationNote}</strong></p>
          </div>` : ''}

        ${data.ctaTitle ? `
          <div class="section">
            <h2>${data.ctaTitle}</h2>
            <p>${data.ctaText}</p>
            ${data.ctaButtonLabel && data.ctaButtonLink ? `
              <a href="${data.ctaButtonLink}" style="display:inline-block;padding:10px 20px;background:#007acc;color:#fff;text-decoration:none;border-radius:4px;">
                ${data.ctaButtonLabel}
              </a>` : ''}
          </div>` : ''}
      </body>
    </html>
  `;
}

module.exports = router;
