/**
 * ST. CECILIA'S COLLEGE ALUMNI MANAGEMENT SYSTEM
 * SECTION 7: TESTING AND QUALITY ASSURANCE AUTOMATED TEST RUNNER
 */

const BASE_URL = 'http://localhost:3000';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${testName}`);
  } else {
    console.error(`  [FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
  }
}

async function runTests() {
  console.log('================================================================');
  console.log('   SECTION 7: TESTING AND QUALITY ASSURANCE VERIFICATION SUITE   ');
  console.log('================================================================\n');

  // --------------------------------------------------------------------------
  // SUITE 1: AUTHENTICATION, TOKENS, REFRESH & SESSION RESTORATION
  // --------------------------------------------------------------------------
  console.log('--- 1. Authentication, Tokens, Refresh & Session Restoration ---');
  let adminToken = '';
  let alumniToken = '';
  let employerToken = '';

  // 1.1 Login as Admin
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@stcecilia.edu', password: 'Password123!' })
    });
    const data = await res.json();
    assert(res.status === 200 && !!data.token, 'Admin login succeeds with valid token', JSON.stringify(data));
    adminToken = data.token;
  } catch (err: any) {
    assert(false, 'Admin login', err.message);
  }

  // 1.2 Login as Alumni
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alumni@stcecilia.edu', password: 'Password123!' })
    });
    const data = await res.json();
    assert(res.status === 200 && !!data.token, 'Alumni login succeeds with valid token', JSON.stringify(data));
    alumniToken = data.token;
  } catch (err: any) {
    assert(false, 'Alumni login', err.message);
  }

  // 1.3 Login as Employer
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'employer@stcecilia.edu', password: 'Password123!' })
    });
    const data = await res.json();
    assert(res.status === 200 && !!data.token, 'Employer login succeeds with valid token', JSON.stringify(data));
    employerToken = data.token;
  } catch (err: any) {
    assert(false, 'Employer login', err.message);
  }

  // 1.4 Active Session Restoration Verification (Browser Refresh simulation)
  try {
    const res = await fetch(`${BASE_URL}/api/auth/session`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await res.json();
    assert(res.status === 200 && data.user?.role === 'admin', 'Admin session restores securely on reload');
  } catch (err: any) {
    assert(false, 'Admin session restoration', err.message);
  }

  try {
    const res = await fetch(`${BASE_URL}/api/auth/session`, {
      headers: { Authorization: `Bearer ${alumniToken}` }
    });
    const data = await res.json();
    assert(res.status === 200 && data.user?.role === 'alumni', 'Alumni session restores securely on reload');
  } catch (err: any) {
    assert(false, 'Alumni session restoration', err.message);
  }

  try {
    const res = await fetch(`${BASE_URL}/api/auth/session`, {
      headers: { Authorization: `Bearer ${employerToken}` }
    });
    const data = await res.json();
    assert(res.status === 200 && data.user?.role === 'employer', 'Employer session restores securely on reload');
  } catch (err: any) {
    assert(false, 'Employer session restoration', err.message);
  }

  // 1.5 Expired Token Rejection
  try {
    const expiredPayload = {
      uid: 'usr_test_expired',
      email: 'expired@stcecilia.edu',
      role: 'alumni',
      exp: Math.floor(Date.now() / 1000) - 3600 // Expired 1 hour ago
    };
    const expiredToken = Buffer.from(JSON.stringify(expiredPayload)).toString('base64');
    const res = await fetch(`${BASE_URL}/api/auth/session`, {
      headers: { Authorization: `Bearer ${expiredToken}` }
    });
    assert(res.status === 401, 'Expired session token is rejected with 401 Unauthorized');
  } catch (err: any) {
    assert(false, 'Expired token check', err.message);
  }

  // 1.6 Malformed / Tampered Token Rejection
  try {
    const res = await fetch(`${BASE_URL}/api/auth/session`, {
      headers: { Authorization: 'Bearer this-is-not-a-valid-token' }
    });
    assert(res.status === 401, 'Malformed session token is rejected with 401 Unauthorized');
  } catch (err: any) {
    assert(false, 'Malformed token check', err.message);
  }

  // --------------------------------------------------------------------------
  // SUITE 2: ALUMNI RESTRICTIONS FOR EVENTS AND JOB CREATION
  // --------------------------------------------------------------------------
  console.log('\n--- 2. Alumni Restrictions for Event & Job Creation ---');

  // 2.1 Alumni Attempt to Create Event (Direct API request -> 403 Forbidden)
  try {
    const res = await fetch(`${BASE_URL}/api/events/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${alumniToken}`
      },
      body: JSON.stringify({
        title: 'Unauthorized Alumni Event',
        description: 'Should be rejected',
        startDate: '2026-11-01',
        endDate: '2026-11-02',
        location: 'Main Auditorium'
      })
    });
    assert(res.status === 403, 'Alumni user creating event receives 403 Forbidden');
    const data = await res.json();
    assert(data.code === 'ALUMNI_EVENT_PERMISSION_DENIED', 'Rejection code indicates alumni event restriction');
  } catch (err: any) {
    assert(false, 'Alumni event creation restriction', err.message);
  }

  // 2.2 Alumni Attempt to Modify Event (403 Forbidden)
  try {
    const res = await fetch(`${BASE_URL}/api/events/evt_123`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${alumniToken}`
      },
      body: JSON.stringify({ title: 'Hacked Event' })
    });
    assert(res.status === 403, 'Alumni user updating event receives 403 Forbidden');
  } catch (err: any) {
    assert(false, 'Alumni event update restriction', err.message);
  }

  // 2.3 Alumni Attempt to Post Job Opportunity (403 Forbidden)
  try {
    const res = await fetch(`${BASE_URL}/api/opportunities/post`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${alumniToken}`
      },
      body: JSON.stringify({
        title: 'Unauthorized Junior Developer',
        company: 'Rogue Tech',
        description: 'Should be rejected'
      })
    });
    assert(res.status === 403, 'Alumni user posting job receives 403 Forbidden');
    const data = await res.json();
    assert(data.code === 'ALUMNI_JOB_CREATION_FORBIDDEN', 'Rejection code indicates alumni job posting restriction');
  } catch (err: any) {
    assert(false, 'Alumni job creation restriction', err.message);
  }

  // 2.4 Alumni Attempt to Sync Job Opportunity (403 Forbidden)
  try {
    const res = await fetch(`${BASE_URL}/api/opportunities/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${alumniToken}`
      },
      body: JSON.stringify({
        id: 'opp_hacked_1',
        title: 'Unauthorized Sync Job'
      })
    });
    assert(res.status === 403, 'Alumni user syncing job receives 403 Forbidden');
  } catch (err: any) {
    assert(false, 'Alumni job sync restriction', err.message);
  }

  // --------------------------------------------------------------------------
  // SUITE 3: EMPLOYER JOB APPLICATION MANAGEMENT WORKFLOW & DATA ISOLATION
  // --------------------------------------------------------------------------
  console.log('\n--- 3. Employer Job Application Workflow & Data Isolation ---');

  // 3.1 Employer Fetches Applications for Their Own Job Postings
  try {
    const res = await fetch(`${BASE_URL}/api/employer/applications`, {
      headers: { Authorization: `Bearer ${employerToken}` }
    });
    const data = await res.json();
    assert(res.status === 200, 'Employer can fetch applications with 200 OK');
    assert(Array.isArray(data.applications), 'Applications list returned as array');
  } catch (err: any) {
    assert(false, 'Employer applications fetch', err.message);
  }

  // 3.2 Alumni Attempt to Access Employer Applications (403 Forbidden)
  try {
    const res = await fetch(`${BASE_URL}/api/employer/applications`, {
      headers: { Authorization: `Bearer ${alumniToken}` }
    });
    assert(res.status === 403, 'Alumni blocked from accessing employer applications with 403 Forbidden');
  } catch (err: any) {
    assert(false, 'Alumni access to employer applications', err.message);
  }

  // 3.3 Candidate Submits Application to a Job
  let testAppId = `app_test_${Date.now()}`;
  try {
    const applyRes = await fetch(`${BASE_URL}/api/applications/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${alumniToken}`
      },
      body: JSON.stringify({
        id: testAppId,
        jobId: 'opp_1',
        jobTitle: 'Junior Software Engineer',
        companyName: 'Nexora Systems Philippines',
        employerUid: 'usr_employer_cecilia',
        applicantName: 'Maria Santos',
        applicantEmail: 'alumni@stcecilia.edu',
        applicantCourse: 'BS Information Technology',
        applicantBatch: '2024',
        coverLetter: 'I am excited to apply for this engineering role at Nexora Systems!'
      })
    });
    const applyData = await applyRes.json();
    assert(applyRes.status === 201 && applyData.success, 'Candidate can apply to job with 201 Created');
  } catch (err: any) {
    assert(false, 'Candidate application submission', err.message);
  }

  // 3.4 Employer Updates Application Status (Workflow: Pending -> Shortlisted)
  try {
    const statusRes = await fetch(`${BASE_URL}/api/employer/applications/${testAppId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${employerToken}`
      },
      body: JSON.stringify({
        status: 'Shortlisted',
        notes: 'Impressive portfolio and academic background. Moving to interview.'
      })
    });
    const statusData = await statusRes.json();
    assert(statusRes.status === 200 && statusData.application?.status === 'Shortlisted',
      'Employer can update applicant status to Shortlisted');
  } catch (err: any) {
    assert(false, 'Employer status update', err.message);
  }

  // 3.5 Status Workflow: Shortlisted -> Interview
  try {
    const statusRes = await fetch(`${BASE_URL}/api/employer/applications/${testAppId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${employerToken}`
      },
      body: JSON.stringify({
        status: 'Interview',
        notes: 'Interview scheduled for Friday 10:00 AM.'
      })
    });
    const statusData = await statusRes.json();
    assert(statusRes.status === 200 && statusData.application?.status === 'Interview',
      'Employer can advance application to Interview status');
  } catch (err: any) {
    assert(false, 'Employer interview stage advance', err.message);
  }

  // 3.6 Cross-Employer Data Leakage Defense
  // Create a rogue employer token with a different company identity
  try {
    const roguePayload = {
      uid: 'usr_employer_rogue_999',
      email: 'rogue@differentcompany.com',
      role: 'employer',
      companyName: 'Different Organization LLC',
      exp: Math.floor(Date.now() / 1000) + 3600
    };
    const rogueToken = Buffer.from(JSON.stringify(roguePayload)).toString('base64');

    // Attempt to modify Nexora Systems' application with Rogue Employer token
    const unauthStatusRes = await fetch(`${BASE_URL}/api/employer/applications/${testAppId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rogueToken}`
      },
      body: JSON.stringify({ status: 'Rejected' })
    });
    const unauthStatusText = await unauthStatusRes.text();
    assert(unauthStatusRes.status === 403,
      'Cross-organization employer blocked from modifying foreign applicants with 403 Forbidden',
      `Received status: ${unauthStatusRes.status}, body: ${unauthStatusText}`);
  } catch (err: any) {
    assert(false, 'Cross-employer isolation check', err.message);
  }

  // --------------------------------------------------------------------------
  // SUITE 4: BACKEND AUTHORIZATION & DIRECT URL ACCESS REJECTION
  // --------------------------------------------------------------------------
  console.log('\n--- 4. Backend Authorization & Direct Access Checks ---');

  // 4.1 Unauthenticated Direct Request to Admin Endpoints
  const protectedAdminEndpoints: Array<{ path: string; method?: string }> = [
    { path: '/api/admin/users', method: 'GET' },
    { path: '/api/admin/create-user', method: 'POST' },
    { path: '/api/admin/promote-user', method: 'POST' },
    { path: '/api/admin/governance/requests', method: 'GET' }
  ];

  for (const ep of protectedAdminEndpoints) {
    try {
      const res = await fetch(`${BASE_URL}${ep.path}`, {
        method: ep.method || 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: ep.method === 'POST' ? JSON.stringify({}) : undefined
      });
      assert(res.status === 401, `Direct unauthenticated request to ${ep.path} receives 401 Unauthorized`);
    } catch (err: any) {
      assert(false, `Direct request ${ep.path}`, err.message);
    }
  }

  // 4.2 Alumni Attempt to Access Admin User List
  try {
    const res = await fetch(`${BASE_URL}/api/admin/users`, {
      headers: { Authorization: `Bearer ${alumniToken}` }
    });
    assert(res.status === 403, 'Alumni attempting to access /api/admin/users receives 403 Forbidden');
  } catch (err: any) {
    assert(false, 'Alumni access admin users', err.message);
  }

  // 4.3 Employer Attempt to Access Admin User List
  try {
    const res = await fetch(`${BASE_URL}/api/admin/users`, {
      headers: { Authorization: `Bearer ${employerToken}` }
    });
    assert(res.status === 403, 'Employer attempting to access /api/admin/users receives 403 Forbidden');
  } catch (err: any) {
    assert(false, 'Employer access admin users', err.message);
  }

  // 4.4 Authorized Admin Access to User List
  try {
    const res = await fetch(`${BASE_URL}/api/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(res.status === 200, 'Authorized administrator accesses /api/admin/users with 200 OK');
  } catch (err: any) {
    assert(false, 'Admin user list', err.message);
  }

  // --------------------------------------------------------------------------
  // SUITE 5: LOGOUT & TOKEN REVOCATION
  // --------------------------------------------------------------------------
  console.log('\n--- 5. Logout & Token Revocation ---');

  try {
    const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(logoutRes.status === 200, 'Logout request succeeds with 200 OK');

    // Attempt to reuse revoked token
    const reuseRes = await fetch(`${BASE_URL}/api/auth/session`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(reuseRes.status === 401, 'Reusing revoked token is immediately rejected with 401 Unauthorized');
  } catch (err: any) {
    assert(false, 'Logout and revocation test', err.message);
  }

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`   TEST RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('================================================================');
  if (passedTests === totalTests) {
    console.log('ALL SECTION 7 QUALITY ASSURANCE CHECKS PASSED SUCCESSFULLY.');
    process.exit(0);
  } else {
    console.error(`FAILED: ${totalTests - passedTests} tests failed.`);
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
