// Some existing routes (checkout stock decrement, newsletter opt-in on
// registration) deliberately fire their side effect without awaiting it, so
// the HTTP response isn't held up by it. Tests that assert on that side
// effect need to poll briefly instead of checking immediately after the
// request resolves.
async function waitFor(check, { timeoutMs = 1000, intervalMs = 25 } = {}) {
  const start = Date.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const result = await check();
    if (result) return result;
    if (Date.now() - start > timeoutMs) return result;
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

module.exports = { waitFor };
