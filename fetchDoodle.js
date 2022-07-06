const { Builder, By, until } = require('selenium-webdriver');
const fsp = require('fs').promises;
const path = require('path');
const config = require('./config.json');

(async function firstScript() {

    try {
        let driver = await new Builder().forBrowser('firefox').build();

        await driver.get('https://doodle.com/dashboard');

        await driver.getTitle();

        await driver.manage().setTimeouts({ implicit: 1000 })

        await driver.wait(until.elementLocated(By.id('onetrust-accept-btn-handler')), 10000);
        let cookieButton = await driver.findElement(By.id('onetrust-accept-btn-handler'));
        await cookieButton.click();

        let mailBox = await driver.findElement(By.id('username'));
        await mailBox.sendKeys(config.mail);
        let pwBox = await driver.findElement(By.id('password'));
        await pwBox.sendKeys(config.pw);

        let loginButton = await driver.findElement(By.name('login'));
        await loginButton.click();

        await driver.wait(until.elementLocated(By.className("Menu")), 10000);

        let invitationBoxes = await (await driver.findElement(By.css('[class^=ActivitiesList]'))).findElements(By.css('[class^=Link]'))
        let invitations = await Promise.all(invitationBoxes.map(async (box) => {
            try {
                await box.findElement(By.className('DateStack'))
                return null;
            } catch (e) {
                // Perfect, still active
            }
            let invite = {};
            invite.name = (await (await box.findElement(By.css('[class^=Title]'))).getText()).trim()
            invite.link = await box.getAttribute('href')
            invite.id = invite.link.split('/').slice(-1)[0];
            return invite
        }));
        invitations = invitations.filter(inv => inv !== null);
        for (let index = 0; index < invitations.length; index++) {
            const invite = invitations[index];
            await driver.get(invite.link);
            try {
                await driver.wait(until.elementLocated(By.className("ParticipationTable")), 10000);

                const tableBox = await driver.findElement(By.className('ParticipationTable'));
                const thBox = await tableBox.findElements(By.css('thead th'));
                const header = await Promise.all(thBox.map(async (th) => {
                    return (await th.getText()).trim();
                }))
                const rows = await tableBox.findElements(By.css('tbody tr'));
                invite.participations = await Promise.all(rows.map(async (row) => {
                    const participation = {}
                    try {
                        const thBox = await row.findElement(By.css('th'));
                        participation.name = (await thBox.getText()).trim();
                        const participationTds = await row.findElements(By.css('td'));
                        participation.options = await Promise.all(participationTds.map(async (td, index) => {
                            return {
                                date: header[index + 1],
                                value: (await td.getText()).trim()
                            }
                        }));
                    } catch (e) {
                        // no biggy
                    }
                    return participation;
                }));
            } catch (e) {
                continue;
            }
        }

        await fsp.writeFile(path.resolve(__dirname, './doodle.json'), JSON.stringify(invitations), 'utf8')
        await driver.quit();
    } catch (error) {
        console.log(error)
    }
})();
