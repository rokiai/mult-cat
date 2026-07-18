describe('Webextension Content Script', () => {
  it('should log MultCat content script loaded on any page', async () => {
    await browser.sessionSubscribe({ events: ['log.entryAdded'] });
    const logs: (string | null)[] = [];

    browser.on('log.entryAdded', logEntry => {
      logs.push(logEntry.text);
    });

    await browser.url('https://www.example.com');

    const EXPECTED_LOG_MESSAGE = '[CEB] All content script loaded';
    await browser.waitUntil(() => logs.includes(EXPECTED_LOG_MESSAGE), {
      timeout: 20000,
      interval: 250,
      timeoutMsg: `Content script log not seen. Captured: ${JSON.stringify(logs.slice(-20))}`,
    });

    expect(logs).toContain(EXPECTED_LOG_MESSAGE);
  });
});
