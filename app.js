const express = require('express');
const puppeteer = require('puppeteer');
const axios = require('axios');

const app = express();

app.get('/pdf/:slug', async (req, res) => {
  const slug = req.params.slug;
  const apiUrl = `https://your-strapi-url/api/product-pages?filters[slug][$eq]=${slug}&populate=deep`;

  const { data } = await axios.get(apiUrl);
  const product = data.data[0].attributes;

  const html = generateHTML(product); // same as your existing Shopify generator

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
  await browser.close();

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${slug}.pdf`);
  res.send(pdfBuffer);
});

app.listen(3000, () => console.log("PDF generator running on port 3000"));

function generateHTML(p) {
  // Reuse your Shopify HTML logic here.
  return `<html><body><h1>${p.title}</h1><p>${p.summary}</p></body></html>`;
}
