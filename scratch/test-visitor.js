const axios = require('axios');

async function main() {
  try {
    const resLogin = await axios.post('https://igloo-vrishinrams-projects.vercel.app/api/auth/login', {
      email: 'rahul@igloo.com',
      password: 'password123'
    });
    const resToken = resLogin.data.token;
    console.log('Resident Rahul:', resLogin.data.user.name, 'Flat:', resLogin.data.user.unitNumber);

    const createRes = await axios.post('https://igloo-vrishinrams-projects.vercel.app/api/visitors/create-pass', {
      visitorName: 'Mahesh Sharma',
      visitorPhone: '9845123456',
      purpose: 'GUEST',
      expectedDate: new Date().toISOString().split('T')[0]
    }, {
      headers: { Authorization: 'Bearer ' + resToken }
    });
    console.log('Pass created:', createRes.data.pass.passCode, 'for Flat:', createRes.data.pass.unitNumber);

    const secLogin = await axios.post('https://igloo-vrishinrams-projects.vercel.app/api/auth/login', {
      email: 'security@igloo.com',
      password: 'password123'
    });
    const secToken = secLogin.data.token;
    console.log('Security logged in');

    const code = createRes.data.pass.passCode;
    const digits = code.replace('IG-', '');
    const queries = [code, digits, code.toLowerCase(), '9845123456', 'A-102'];

    for (const q of queries) {
      try {
        const v = await axios.post('https://igloo-vrishinrams-projects.vercel.app/api/visitors/verify-code', {
          code: q
        }, {
          headers: { Authorization: 'Bearer ' + secToken }
        });
        console.log('Search [', q, '] => SUCCESS: passCode =', v.data.pass.passCode, 'visitor =', v.data.pass.visitorName);
      } catch (e) {
        console.log('Search [', q, '] => FAILED:', e.response ? e.response.data.message : e.message);
      }
    }
  } catch (err) {
    console.error('FAIL:', err.response ? err.response.data : err.message);
  }
}

main();
