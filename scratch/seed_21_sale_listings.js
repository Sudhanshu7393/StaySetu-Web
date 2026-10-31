const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

let envText = fs.readFileSync('.env', 'utf8');
let supabaseUrl = '', supabaseKey = '';
envText.split('\n').forEach(line => {
  if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
});

const client = createClient(supabaseUrl, supabaseKey);

const imagePool = [
  [
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=80',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80'
  ],
  [
    'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=1200&q=80',
    'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=1200&q=80',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80'
  ],
  [
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80',
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80',
    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&q=80'
  ],
  [
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80'
  ]
];

const rawData = [
  { society: 'GH 07', type: '3 BHK', size: '1725 sqft area', price: 11000000, demandStr: '1.10 cr' },
  { society: 'GH 07', type: '2 BHK', size: '1270 sqft area', price: 8900000, demandStr: '89 lacs' },
  { society: 'GH 07', type: '2 BHK', size: '1270 sqft area', price: 8500000, demandStr: '85 lacs' },
  { society: 'PROVIEW LABONI', type: '3 BHK', size: '1680 sqft area', price: 10900000, demandStr: '1.09 cr' },
  { society: 'GH 07', type: '2 BHK', size: '1270 sqft area', price: 7600000, demandStr: '76 lacs' },
  { society: 'GH 07', type: '3 BHK', size: '1725 sqft area', price: 11800000, demandStr: '1.18 cr' },
  { society: 'SUPERTECH LIVINGSTONS', type: '3 BHK', size: '1577 sqft area', price: 11000000, demandStr: '1.10 cr' },
  { society: 'PANCHSHEEL', type: '2 BHK', size: '1150 sqft area', price: 6600000, demandStr: '66 lacs' },
  { society: 'LABONI', type: '3 BHK', size: '1680 sqf', price: 10500000, demandStr: '1.05 cr' },
  { society: 'GARDENIA', type: '3 BHK', size: '1475 sqft area', price: 10500000, demandStr: '1.05 cr' },
  { society: 'GOLD COAST', type: '3 BHK', size: '1435 sqft area', price: 15000000, demandStr: '1.5 cr' },
  { society: 'GH 07', type: '2 BHK', size: '1270 sqft area', price: 8200000, demandStr: '82 lacs' },
  { society: 'BULLAND HEIGHTS', type: '3 BHK', size: '1851 sqft area', price: 10300000, demandStr: '1.03 cr' },
  { society: 'PANCHSHEEL', type: '3 BHK', size: '1700 sqft area', price: 13000000, demandStr: '1.30 cr' },
  { society: 'GH 07', type: '2 BHK', size: '1270 sqft area', price: 8000000, demandStr: '80 lacs' },
  { society: 'GH 07', type: '3 BHK', size: '1725 sqft area', price: 11000000, demandStr: '1.1 cr' },
  { society: 'ARCON', type: '3 BHK', size: '1600 sqft area', price: 12500000, demandStr: '1.25 cr' },
  { society: 'LOTUS', type: '2 BHK', size: '1022 sqft area', price: 7400000, demandStr: '74 lacs' },
  { society: 'LOTUS', type: '2 BHK', size: '1022 sqft area', price: 7200000, demandStr: '72 lacs' },
  { society: 'AJNARA', type: '2+STUDY', size: '1395 sqft area', price: 10800000, demandStr: '1.08 cr' },
  { society: 'AJNARA GEN X', type: '2 BHK', size: '1250 sqft area', price: 8200000, demandStr: '82 lacs' }
];

async function seed() {
  console.log('1. Deleting existing sell listings...');
  const { error: delErr } = await client.from('listings').delete().eq('purpose', 'sell');
  if (delErr) {
    console.error('Delete error:', delErr);
  } else {
    console.log('Deleted old sell listings.');
  }

  console.log('2. Preparing 21 listings from user image...');
  const toInsert = rawData.map((item, idx) => {
    const images = imagePool[idx % imagePool.length];
    const isStudy = item.type.toUpperCase().includes('STUDY');
    const typeLabel = isStudy ? '2 BHK + Study' : item.type;
    return {
      title: `${typeLabel} Flat in ${item.society}, Crossings Republik`,
      description: `Verified ${typeLabel} apartment for sale in ${item.society}, Crossings Republik, Ghaziabad. Super built-up area: ${item.size}. Features spacious layout, good sunlight, balconies, 24x7 security, power backup and dedicated parking in a prime gated society. Direct verified seller.`,
      price: item.price,
      security_deposit: 0,
      brokerage_fee: 0,
      property_type: 'Flat',
      type: 'Flat',
      purpose: 'sell',
      city: 'Ghaziabad',
      locality: 'Crossings Republik',
      location: `${item.society}, Crossings Republik, Ghaziabad`,
      address: `${item.society}, Crossings Republik, NH-24, Ghaziabad, UP`,
      latitude: 28.6280 + (idx * 0.0002),
      longitude: 77.4320 + (idx * 0.0002),
      gender_preference: 'all',
      occupancy: 'family',
      amenities: JSON.stringify(['Gated Society', '24x7 Security', 'Power Backup', 'Lift', 'Car Parking', 'Park / Clubhouse']),
      images: JSON.stringify(images),
      owner_name: 'Verified Seller / StaySetu Desk',
      owner_phone: '7393011350',
      whatsapp_number: '7393011350',
      is_verified: true,
      is_featured: idx < 3,
      status: 'approved',
      views_count: 15 + (idx * 4)
    };
  });

  console.log('3. Inserting 21 listings into Supabase...');
  const { data: inserted, error: insErr } = await client.from('listings').insert(toInsert).select('id, title, price, location');
  if (insErr) {
    console.error('Error inserting listings:', insErr);
  } else {
    console.log(`SUCCESS! Inserted ${inserted.length} listings:`);
    inserted.forEach((item, i) => {
      console.log(`${i + 1}. [${item.id}] ${item.title} -> ₹${item.price} (${item.location})`);
    });
  }
}

seed();
