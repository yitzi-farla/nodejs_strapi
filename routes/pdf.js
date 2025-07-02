const express = require('express');
const puppeteer = require('puppeteer');
const axios = require('axios');
const router = express.Router();

// Use environment variable from Railway (in .env or Railway's UI)
const STRAPI_BASE = process.env.URL || 'https://strapi-production-a5ea.up.railway.app';
const API = `${STRAPI_BASE}/api/product-pages?populate=deep`;

router.get('/:slug', async (req, res) => {
  const slug = req.params.slug;

  try {
    const { data } = await axios.get(`${API}&filters[slug][$eq]=${slug}`);
    const item = data.data[0];

    if (!item) return res.status(404).send('Product not found');

    const product = item.attributes;

    const html = generateHTML(product);

    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${slug}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).send(`Failed to generate PDF: ${err.message}`);
  }
});

function generateHTML(p) {
  const safe = s => s || '';
  const list = (items, fn) => (items || []).map(fn).join('');

  return `
<div style="font-family: Arial, sans-serif; color: #1a1a1a; line-height: 1.6; margin: 0 auto; max-width: 960px; padding: 20px;">

  ${p.title ? `<section style="text-align:center; margin-bottom:40px;">
    <h1 style="font-size:28px; margin-bottom:15px;">${p.title}</h1>
    ${p.summary ? `<p style="font-size:16px; max-width:700px; margin:0 auto;">${p.summary}</p>` : ''}
    ${p.heroImages?.length ? `<div style="margin-top:25px; display:flex; flex-wrap:wrap; justify-content:center; gap:15px;">
      ${list(p.heroImages, i => `<img src="${i.url}" style="max-width:300px;width:100%;border-radius:8px;">`)}
    </div>` : ''}
  </section>` : ''}

  ${list(p.features, f => `
    <section style="display:flex;flex-wrap:wrap;gap:20px;align-items:center;margin-bottom:40px;flex-direction:${f.reverseLayout ? 'row-reverse' : 'row'};">
      <div style="flex:1 1 260px;min-width:260px;">
        ${f.image?.url ? `<img src="${f.image.url}" style="max-width:100%;border-radius:8px;">` : ''}
      </div>
      <div style="flex:1 1 260px;min-width:260px;">
        <h2 style="font-size:20px;margin-bottom:10px;">${safe(f.title)}</h2>
        <p style="font-size:16px;">${safe(f.description)}</p>
      </div>
    </section>
  `)}

  ${p.specs?.length ? `
    <section style="background-color:#f9f9f9;padding:30px;margin-bottom:40px;">
      <h2 style="text-align:center;font-size:20px;margin-bottom:20px;">Specifications</h2>
      <ul style="columns:2;-webkit-columns:2;-moz-columns:2;list-style:none;padding:0;">
        ${list(p.specs, s => `<li><strong>${s.label}:</strong> ${s.value}</li>`)}
      </ul>
    </section>
  ` : ''}

  ${p.inclusions?.length ? `
    <section style="margin-bottom:40px;">
      <h2 style="text-align:center;font-size:20px;margin-bottom:20px;">What’s Included</h2>
      <ul style="max-width:300px;margin:0 auto;list-style:disc;padding-left:20px;">
        ${list(p.inclusions, i => `<li>${i.item}</li>`)}
      </ul>
    </section>
  ` : ''}

  ${p.benefits?.length ? `
    <section style="background-color:#f1f1f1;padding:30px;margin-bottom:40px;">
      <h2 style="text-align:center;font-size:20px;margin-bottom:20px;">Key Benefits</h2>
      <div style="display:flex;flex-wrap:wrap;gap:30px;justify-content:center;">
        ${list(p.benefits, b => `
          <div style="flex:1 1 220px;max-width:300px;">
