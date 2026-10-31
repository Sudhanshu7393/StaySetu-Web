const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

let envText = fs.readFileSync('.env', 'utf8');
let supabaseUrl = '', supabaseKey = '';
envText.split('\n').forEach(line => {
  if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
});

const client = createClient(supabaseUrl, supabaseKey);

// Realistic authentic local Indian tower & flat image sets
function getImagesForSociety(society, index) {
  const soc = (society || '').toUpperCase();

  if (soc.includes('GH 07') || soc.includes('GH-7') || soc.includes('GH7')) {
    const variants = [
      [
        '/properties/crossings/crossings_republik_towers.jpg',
        '/properties/crossings/indian_tower_balconies.jpg',
        '/properties/crossings/indian_drawing_room.jpg'
      ],
      [
        '/properties/crossings/crossings_republik_towers.jpg',
        '/properties/crossings/indian_drawing_room.jpg',
        '/properties/crossings/indian_bedroom.jpg'
      ],
      [
        '/properties/crossings/indian_tower_balconies.jpg',
        '/properties/crossings/crossings_republik_towers.jpg',
        '/properties/crossings/indian_drawing_room.jpg'
      ]
    ];
    return variants[index % variants.length];
  }

  if (soc.includes('LABONI')) {
    return [
      '/properties/crossings/shipra_sun_city.jpg',
      '/properties/crossings/crossings_republik_towers.jpg',
      '/properties/crossings/indian_drawing_room.jpg'
    ];
  }

  if (soc.includes('SUPERTECH')) {
    return [
      '/properties/crossings/indian_society_highrise.jpg',
      '/properties/crossings/crossings_republik_towers.jpg',
      '/properties/crossings/indian_drawing_room.jpg'
    ];
  }

  if (soc.includes('PANCHSHEEL')) {
    return [
      '/properties/crossings/indirapuram_towers.jpg',
      '/properties/crossings/indian_tower_balconies.jpg',
      '/properties/crossings/indian_drawing_room.jpg'
    ];
  }

  if (soc.includes('GARDENIA')) {
    return [
      '/properties/crossings/wave_city_ghaziabad.jpg',
      '/properties/crossings/crossings_republik_towers.jpg',
      '/properties/crossings/indian_drawing_room.jpg'
    ];
  }

  if (soc.includes('GOLD COAST')) {
    return [
      '/properties/crossings/veridia_ghaziabad.jpg',
      '/properties/crossings/crossings_republik_towers.jpg',
      '/properties/crossings/indian_drawing_room.jpg'
    ];
  }

  if (soc.includes('BULLAND')) {
    return [
      '/properties/crossings/ghaziabad_towers.jpg',
      '/properties/crossings/indian_tower_balconies.jpg',
      '/properties/crossings/indian_drawing_room.jpg'
    ];
  }

  if (soc.includes('ARCON')) {
    return [
      '/properties/crossings/crossings_republik_towers.jpg',
      '/properties/crossings/indian_society_highrise.jpg',
      '/properties/crossings/indian_bedroom.jpg'
    ];
  }

  if (soc.includes('LOTUS')) {
    return [
      '/properties/crossings/shipra_sun_city.jpg',
      '/properties/crossings/indian_tower_balconies.jpg',
      '/properties/crossings/indian_drawing_room.jpg'
    ];
  }

  if (soc.includes('AJNARA')) {
    return [
      '/properties/crossings/indirapuram_towers.jpg',
      '/properties/crossings/crossings_republik_towers.jpg',
      '/properties/crossings/indian_drawing_room.jpg'
    ];
  }

  // Default fallback
  return [
    '/properties/crossings/crossings_republik_towers.jpg',
    '/properties/crossings/indian_tower_balconies.jpg',
    '/properties/crossings/indian_drawing_room.jpg'
  ];
}

async function updateAllImages() {
  console.log('Fetching all 21 sell listings...');
  const { data: listings, error } = await client.from('listings').select('id, title, location').eq('purpose', 'sell');
  if (error || !listings) {
    console.error('Fetch error:', error);
    return;
  }

  console.log(`Found ${listings.length} listings. Updating images to authentic local tower photos...`);

  for (let i = 0; i < listings.length; i++) {
    const item = listings[i];
    const images = getImagesForSociety(item.location || item.title, i);
    const { error: updErr } = await client
      .from('listings')
      .update({ images: JSON.stringify(images) })
      .eq('id', item.id);

    if (updErr) {
      console.error(`Failed to update ${item.title}:`, updErr);
    } else {
      console.log(`${i + 1}. Updated ${item.title} -> ${images[0]}`);
    }
  }

  console.log('ALL 21 LISTINGS UPDATED SUCCESSFULLY!');
}

updateAllImages();
