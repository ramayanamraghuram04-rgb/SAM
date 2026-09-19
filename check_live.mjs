async function check() {
  const html = await fetch('https://sam-app-jet.vercel.app/').then(r => r.text());
  const match = html.match(/src="([^"]+index[^"]+\.js)"/);
  console.log('Script tag match:', match ? match[1] : 'not found');
  if (match) {
    const jsUrl = 'https://sam-app-jet.vercel.app' + match[1];
    console.log('Fetching:', jsUrl);
    const js = await fetch(jsUrl).then(r => r.text());
    console.log('Live bundle contains "Admin Portal":', js.includes('Admin Portal'));
    console.log('Live bundle contains "Admin Sign In":', js.includes('Admin Sign In'));
    console.log('Live bundle contains "Faculty & Staff":', js.includes('Faculty & Staff'));
    console.log('Live bundle contains "Curricular Subjects":', js.includes('Curricular Subjects'));
  }
}
check().catch(console.error);
