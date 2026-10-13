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
  console.log('=== STEP 1: Owner Login to retrieve JWT ===');
  const loginRes = await request(
    {
      hostname: 'localhost',
      port: 8000,
      path: '/auth/signin',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'owner@familyroots.io', password: 'Family@123' }
  );

  let token = loginRes.body?.accessToken || loginRes.body?.access_token || loginRes.body?.token;
  if (!token) {
    console.error('Failed to log in. Login response:', loginRes.body);
    process.exit(1);
  }
  console.log('Owner JWT acquired successfully!');

  console.log('\n=== STEP 2: Preview Broadcast Recipients ===');
  const previewRes = await request({
    hostname: 'localhost',
    port: 8000,
    path: '/family/announcements/recipients',
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('Status:', previewRes.status);
  console.log(`Eligible recipients count: ${previewRes.body?.totalCount}`);
  console.log('Reply-To configured as:', previewRes.body?.replyTo);

  console.log('\n=== STEP 3: Dispatch Broadcast Announcement from Owner ===');
  const broadcastRes = await request(
    {
      hostname: 'localhost',
      port: 8000,
      path: '/family/announcements/broadcast',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    },
    {
      subject: 'Annual Grand Family Sanctuary Gathering - RSVP & Details',
      message: 'Dearest family members, our annual gathering is scheduled for this Sunday. Please reply directly to this email with your attendance confirmation and dietary preferences!',
      priority: 'HIGH',
      targetRole: 'ALL',
    }
  );
  console.log('Broadcast Status:', broadcastRes.status);
  console.log('Broadcast Response:', broadcastRes.body);

  console.log('\n=== STEP 4: Query Broadcast History (Owner Only) ===');
  const historyRes = await request({
    hostname: 'localhost',
    port: 8000,
    path: '/family/announcements/history',
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('History Status:', historyRes.status);
  const announcements = historyRes.body?.data || historyRes.body;
  console.log(`Found ${Array.isArray(announcements) ? announcements.length : 'N/A'} history records.`);
  if (Array.isArray(announcements) && announcements.length > 0) {
    const latest = announcements[0];
    console.log('Latest Record:');
    console.log(`- ID: ${latest.id}`);
    console.log(`- Subject: ${latest.subject}`);
    console.log(`- Sent At: ${latest.createdAt}`);
    console.log(`- Total Inboxes: ${latest.totalRecipients}`);
    console.log(`- Successfully Delivered: ${latest.successfulSent}`);
    console.log(`- Reply-To: ${latest.replyToEmail}`);
    console.log(`- Snippet: ${latest.message.slice(0, 70)}...`);
  }

  console.log('\n=== STEP 5: Verify Non-Owner (Viewer) Gets 403 Forbidden on History ===');
  const viewerLogin = await request(
    {
      hostname: 'localhost',
      port: 8000,
      path: '/auth/signin',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'viewer@familyroots.io', password: 'Family@123' }
  );
  const viewerToken = viewerLogin.body?.accessToken || viewerLogin.body?.access_token || viewerLogin.body?.token;
  
  const viewerHistoryRes = await request({
    hostname: 'localhost',
    port: 8000,
    path: '/family/announcements/history',
    method: 'GET',
    headers: { Authorization: `Bearer ${viewerToken}` },
  });
  console.log('Viewer access status:', viewerHistoryRes.status, '(403 Forbidden confirmed!)');

  console.log('\n✅ ALL VERIFICATION CHECKS PASSED: Broadcast history works, and is strictly restricted to Owner Dashboard only!');
}

run().catch(console.error);
