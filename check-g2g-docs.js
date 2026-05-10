require('dotenv').config();
const axios = require('axios');

async function fetchG2GDocs() {
  console.log('Fetching G2G API documentation...\n');

  const urls = [
    'https://docs.g2g.com/',
    'https://docs.g2g.com/webhook-overview',
    'https://docs.g2g.com/webhook-events',
    'https://docs.g2g.com/delivery-api'
  ];

  for (const url of urls) {
    try {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`URL: ${url}`);
      console.log('='.repeat(60));

      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml',
        },
        timeout: 15000,
        maxContentLength: 100000
      });

      // Extract meaningful content
      let text = response.data
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&/g, '&')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/&quot;/g, '"')
        .trim();

      console.log(text.substring(0, 6000));

    } catch (err) {
      console.error(`Error: ${err.message}`);
    }
  }
}

fetchG2GDocs();