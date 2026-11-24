// tests/host/cloudflare-benchmark.mjs
// Chạy: node tests/host/cloudflare-benchmark.mjs
import worker from '../../src/host/worker/cloudflare.mjs';

const WARMUPS = 20;
const REQUESTS = 100;

// WHY: mọi mẫu dùng cùng endpoint/body shape để đo host nhất quán (P1 · P4).
function makeRequest(message) {
  return new Request('http://worker.test/echo', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ msg: message }),
  });
}

// WHY: nearest-rank p50/p90 làm proof CPU có thể đọc và tái chạy (P1).
function percentile(sorted, p) {
  return sorted[Math.ceil(p * sorted.length) - 1];
}

// WHY: chạy lại cùng entrypoint và cổng CPU trên mỗi lần kiểm tra (P1 · P7).
async function main() {
  for (let i = 0; i < WARMUPS; i++) {
    await worker.fetch(makeRequest('warmup'));
  }

  const samples = [];
  const batchStart = process.cpuUsage();
  for (let i = 0; i < REQUESTS; i++) {
    const message = 'benchmark-' + i;
    const start = process.cpuUsage();
    const response = await worker.fetch(makeRequest(message));
    const body = await response.json();
    const used = process.cpuUsage(start);
    if (response.status !== 200 || body.echo !== message) {
      throw new Error('POST /echo failed at request ' + i);
    }
    samples.push((used.user + used.system) / 1000);
  }
  const batch = process.cpuUsage(batchStart);
  samples.sort((a, b) => a - b);
  const avg = (batch.user + batch.system) / 1000 / REQUESTS;
  const p50 = percentile(samples, 0.50);
  const p90 = percentile(samples, 0.90);
  const max = samples[samples.length - 1];

  console.log('CPU benchmark: process.cpuUsage(), POST /echo, ' + REQUESTS + ' requests, ' + WARMUPS + ' warm-ups');
  console.log('batch avg: ' + avg.toFixed(4) + ' ms/request CPU');
  console.log('sample p50: ' + p50.toFixed(4) + ' ms, p90: ' + p90.toFixed(4) + ' ms, max: ' + max.toFixed(4) + ' ms');
  if (avg >= 10 || p90 >= 10) {
    throw new Error('CPU gate failed: require batch average and p90 below 10 ms');
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
