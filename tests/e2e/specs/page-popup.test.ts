describe('Webextension Popup', () => {
  it('should open the MultCat popup successfully', async () => {
    const extensionPath = await browser.getExtensionPath();
    const popupUrl = `${extensionPath}/popup/index.html`;
    await browser.url(popupUrl);

    await expect(browser).toHaveTitle('Popup');

    const shell = await $('.popup-shell').getElement();
    await expect(shell).toBeExisting();

    const title = await $('.popup-title').getElement();
    await expect(title).toHaveText('MultCat');

    const translateBtn = await $('.popup-translate-main').getElement();
    await expect(translateBtn).toBeExisting();
  });
});
