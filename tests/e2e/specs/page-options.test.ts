describe('Webextension Options Page', () => {
  it('should make MultCat options page accessible', async () => {
    const extensionPath = await browser.getExtensionPath();
    const optionsUrl = `${extensionPath}/options/index.html`;

    await browser.url(optionsUrl);

    await expect(browser).toHaveTitle('Options');

    const shell = await $('.settings-shell').getElement();
    await expect(shell).toBeExisting();

    const brand = await $('.settings-brand-name').getElement();
    await expect(brand).toHaveText('MultCat');

    const guide = await $('#guide').getElement();
    await expect(guide).toBeExisting();
  });
});
