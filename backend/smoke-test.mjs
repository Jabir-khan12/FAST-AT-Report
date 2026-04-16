const base = process.env.API_BASE || 'http://localhost:5001';

const sample = {
  evaluatorName: 'Smoke Tester',
  institutionName: 'FAST University',
  programName: 'BS Artificial Intelligence',
make the down  standard1: [4, 4, 4, 4, 4, 4, 4, 4],
  standard2: [4, 4, 4, 4, 4, 4, 4],
  standard3: [4, 4, 4, 4],
  standard4: [4, 4, 4],
  standard5: [4, 4, 4, 4, 4, 4, 4, 4],
  standard6: [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  standard7: [4, 4, 4, 4, 4, 4],
  observations: 'Smoke test submission for API verification.',
};

async function main() {
  const submit = await fetch(`${base}/api/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sample),
  });

  const submitData = await submit.json();
  console.log('Submit status:', submit.status, submitData);

  const list = await fetch(`${base}/api/responses`);
  const listData = await list.json();
  console.log('Responses status:', list.status, 'count=', listData.responses?.length || 0);
}

main().catch((e) => {
  console.error('Smoke test failed:', e.message);
  process.exit(1);
});
