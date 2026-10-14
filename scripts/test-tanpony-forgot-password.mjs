import http from 'http';

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function run() {
  const email = 'm747p4hujb@tanpony.com';
  console.log(`Sending forgot password request to live API for: ${email}`);
  const res = await request(
    {
      hostname: '127.0.0.1',
      port: 8000,
      path: '/auth/forgot-password',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email }
  );

  console.log('HTTP Status:', res.status);
  console.log('Response Body:', res.body);
}

run();
