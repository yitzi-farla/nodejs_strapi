const express = require('express');
const puppeteer = require('puppeteer');
const axios = require('axios');
const router = express.Router();

// Replace with your live Strapi API
const STRAPI_API = 'https://your-strapi-url/api/product-pages?populate=deep';

router.get('/:slug', async (req, res) => {
  const slug = req.params.slug;
  try {
    const { data } = await axios.get(`${STRAPI_API}&filters[slug][$eq]=${slug}`);
    const product = data.data[0].attributes;

    const html = generateHTML(product); // Reuse your Shopify HTML generation here

    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${slug}.pdf`);
    res.send(pdf);
  } catch (err) {
    res.status(500).send(`Error: ${err.message}`);
  }
});

function generateHTML(p) {
  return `
    <html>
    <head><style>body { font-family: Arial; }</style></head>
    <body>
      <h1>${p.title}</h1>
      <p>${p.summary || ''}</p>
    </body>
    </html>
  `;
}

module.exports = router;
