require('dotenv').config();
const axios = require('axios');

const SMMCOST_BASE_URL = 'https://smmcost.com/api/v2';
const keyword = process.argv[2]?.toLowerCase();

async function fetchServices() {
  console.log('\n========================================');
  console.log(' SMMCost Services Lookup');
  console.log('========================================\n');

  if (!process.env.SMMCOST_KEY) {
    console.error('Error: SMMCOST_KEY environment variable is required');
    console.log('Usage: SMMCOST_KEY=xxx node get-services.js [keyword]');
    process.exit(1);
  }

  try {
    console.log('Fetching services from SMMCost...\n');
    
    const response = await axios.post(SMMCOST_BASE_URL, null, {
      params: {
        key: process.env.SMMCOST_KEY,
        action: 'services'
      }
    });

    const services = response.data;

    if (!services || typeof services !== 'object') {
      console.log('No services found or invalid response');
      return;
    }

    const entries = Object.entries(services);
    console.log(`Found ${entries.length} services total\n`);

    if (keyword) {
      console.log(`Filtering by keyword: "${keyword}"\n`);
      
      const filtered = entries.filter(([id, service]) => {
        const name = (service.name || '').toLowerCase();
        const category = (service.category || '').toLowerCase();
        return name.includes(keyword) || category.includes(keyword);
      });

      console.log(`Found ${filtered.length} matching services:\n`);

      filtered.forEach(([id, service]) => {
        console.log(`Service ID: ${id}`);
        console.log(`  Name: ${service.name || 'N/A'}`);
        console.log(`  Category: ${service.category || 'N/A'}`);
        console.log(`  Price: $${service.price || 'N/A'} per ${service.unit || 'unit'}`);
        console.log(`  Min/Max: ${service.min || '?'} / ${service.max || '?'}`);
        console.log('');
      });

      // Also output for easy copying
      console.log('--- Copy-Paste Format ---');
      filtered.forEach(([id, service]) => {
        console.log(`"OFFER_XXX": "${id}"  // ${service.name}`);
      });

    } else {
      // List all services grouped by category
      const categories = {};
      
      entries.forEach(([id, service]) => {
        const cat = service.category || 'Uncategorized';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push({ id, ...service });
      });

      Object.keys(categories).sort().forEach(category => {
        console.log(`\n[${category}]`);
        console.log('-'.repeat(40));
        
        categories[category].forEach(s => {
          console.log(`  ${s.id} - ${s.name || 'N/A'}`);
          console.log(`       Price: $${s.price}/${s.unit || 'unit'} | Min: ${s.min || '?'}`);
        });
      });

      console.log('\n========================================');
      console.log(`Total: ${entries.length} services in ${Object.keys(categories).length} categories`);
      console.log('========================================\n');
    }

  } catch (err) {
    console.error('Error fetching services:', err.message);
    if (err.response?.data) {
      console.error('Response:', JSON.stringify(err.response.data, null, 2));
    }
  }
}

fetchServices();