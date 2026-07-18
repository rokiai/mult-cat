describe('Webextension Content Script', () => {
  it('should inject MultCat content script on any page', async () => {
    await browser.url('https://www.example.com');

    // Content scripts run in an isolated world, so console BiDi logs are unreliable in CI.
    // The script marks <html data-ceb-ready="1"> which is visible to the page.
    await browser.waitUntil(
      async () => (await browser.execute(() => document.documentElement.getAttribute('data-ceb-ready'))) === '1',
      {
        timeout: 20000,
        interval: 250,
        timeoutMsg: 'Content script did not set data-ceb-ready on documentElement',
      },
    );

    await expect(await browser.execute(() => document.documentElement.getAttribute('data-ceb-ready'))).toBe('1');
  });
});
