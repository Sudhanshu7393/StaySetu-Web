const https = require('https');

async function get(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    }).on('error', (e) => {
      console.error(e);
      resolve('');
    });
  });
}

async function test() {
  const urls = [
    'https://housing.com/in/buy/projects/page/6520-crossings-gh7-by-crossings-infrastructure-in-crossings-republik',
    'https://www.magicbricks.com/crossing-republic-gh-7-crossings-republik-ghaziabad-pdpid-4d42353032333630'
  ];

  for (const u of urls) {
    console.log('Fetching', u);
    const html = await get(u);
    const matches = html.match(/https:\/\/[^"'\s\\]+\.(?:jpg|jpeg|png|webp)/gi) || [];
    const filtered = [...new Set(matches.filter(m => m.includes('housingcdn') || m.includes('staticmb') || m.includes('project')))];
    console.log('Results for', u, filtered.slice(0, 10));
  }
}

test();
