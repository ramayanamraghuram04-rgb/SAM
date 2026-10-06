async function check() {
  const urls = [
    'https://sam-m3ml9usyb-ramayanamraghuram04-9428s-projects.vercel.app',
    'https://sam-app-jet.vercel.app'
  ];
  for (const url of urls) {
    console.log('\n--- Checking:', url, '---');
    try {
      const logoRes = await fetch(url + '/logo.png');
      console.log('Logo status:', logoRes.status, 'size:', logoRes.headers.get('content-length'));

      const html = await fetch(url).then(r => r.text());
      const match = html.match(/src="([^"]+index[^"]+\.js)"/);
      console.log('Script bundle:', match ? match[1] : 'not found');
      console.log('HTML references logo.png:', html.includes('logo.png'));
    } catch (e) {
      console.error('Fetch error:', e.message);
    }
  }
}
check();
