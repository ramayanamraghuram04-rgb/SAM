async function check() {
  const html = await fetch('https://sam-app-jet.vercel.app/').then(r => r.text());
  const match = html.match(/src="([^"]+index[^"]+\.js)"/);
  console.log('Script tag match:', match ? match[1] : 'not found');
  if (match) {
    const jsUrl = 'https://sam-app-jet.vercel.app' + match[1];
    console.log('Fetching:', jsUrl);
    const js = await fetch(jsUrl).then(r => r.text());
    console.log('Live bundle contains "Capture Assignment Pages":', js.includes('Capture Assignment Pages'));
    console.log('Live bundle contains "YOUR ASSIGNMENT VERIFICATION CODE":', js.includes('YOUR ASSIGNMENT VERIFICATION CODE'));
    console.log('Live bundle contains "I\'ve Written the Code — Start Camera":', js.includes("I've Written the Code — Start Camera"));
    console.log('Live bundle contains "sam/assignments":', js.includes('sam/assignments'));
    console.log('Live bundle contains "Camera permission is required":', js.includes('Camera permission is required'));
    console.log('Live bundle contains "Assignment Submitted Successfully":', js.includes('Assignment Submitted Successfully'));
    console.log('Live bundle contains "Paste Google Drive Link":', js.includes('Paste Google Drive Link'));
    console.log('Live bundle contains "Enter Google Drive link":', js.includes('Enter Google Drive link'));
  }
}
check().catch(console.error);
