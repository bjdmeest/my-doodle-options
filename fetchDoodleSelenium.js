const { Builder, By, until } = require('selenium-webdriver');
const fsp = require('fs').promises;
const path = require('path');
const config = require('./config');

(async function firstScript() {

    try {
        let driver = await new Builder().forBrowser('firefox').build();

        await driver.get('https://doodle.com/dashboard');

        await driver.getTitle();

        await driver.manage().setTimeouts({ implicit: 1000 })

        await driver.wait(until.elementLocated(By.id('onetrust-accept-btn-handler')), 10000);
        let cookieButton = await driver.findElement(By.id('onetrust-accept-btn-handler'));
        await cookieButton.click();
        await driver.wait(until.elementIsNotVisible(cookieButton), 4000);

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
        console.log(`Found invitations ${invitations.map(i => i.name).join(', ')}`)
        for (let index = 0; index < invitations.length; index++) {
            const invite = invitations[index];
            if (config.only.length > 0 && config.only.indexOf(invite.name) == -1) {
                continue;
            }
            invite.participations = [];
            const participation = {
                name: '\nYou',
                options: []
            }
            // go to overview
            await driver.get(invite.link);
            // click 'change reponse' button
            const actionDiv = await getByClassStart(driver, 'post-submission-module_post-submission__top-actions');
            console.log(await actionDiv.getText())
            const changeButton = await actionDiv.findElement(By.css('button'));
            console.log(await changeButton.getText())
            await changeButton.click();
            // click 'Continue' button
            const continuePar = await driver.findElement(By.css('[data-testid="meeting-votable-continue"]'));
            await continuePar.click();
            let buttons;
            do {
                // get all selected YES options: class starts with selected-option-module_selected-option--yes
                const yesDivs = await getAllByClassStart(driver, 'selected-option-module_selected-option--yes');
                participation.options = participation.options.concat(await Promise.all(yesDivs.map(async (div, index) => {
                    return {
                        date: (await div.getText()).trim(),
                        value: "Yes"
                    }
                })));
                // get all selected MAYBE options: class starts with selected-option-module_selected-option--maybe
                const maybeDivs = await getAllByClassStart(driver, 'selected-option-module_selected-option--maybe');
                participation.options = participation.options.concat(await Promise.all(maybeDivs.map(async (div, index) => {
                    return {
                        date: (await div.getText()).trim(),
                        value: "Yes"
                    }
                })));

                let nextButton;
                const pagDiv = await driver.findElement(By.css(`[class*="votes-options-pagination-module_votes-options-pagination"]`));
                buttons = await pagDiv.findElements(By.css('button'));


                if (await buttons[1].isEnabled()){
                    await buttons[1].click();
                }
            } while (await buttons[1].isEnabled()) {
                await buttons[1].click();
            }
            invite.participations.push(participation);
        }

        await fsp.writeFile(path.resolve(__dirname, './doodle.json'), JSON.stringify(invitations), 'utf8')
        await driver.quit();
    } catch (error) {
        console.log(error)
    }
})();

async function getByClassStart(driver, className) {
    await driver.wait(until.elementLocated(By.css(`[class*="${className}"]`)), 10000);
    return driver.findElement(By.css(`[class*="${className}"]`));
}

async function getAllByClassStart(driver, className) {
    await driver.wait(until.elementLocated(By.css(`[class*="${className}"]`)), 10000);
    return driver.findElements(By.css(`[class*="${className}"]`));
}
