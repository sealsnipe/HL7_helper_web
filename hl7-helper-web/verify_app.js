const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
    console.log('Starting autonomous verification...');
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    try {
        // 1. Navigate to app
        console.log('Navigating to http://localhost:3000...');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

        // Screenshot initial state
        await page.screenshot({ path: 'screenshot_initial.png' });
        console.log('Initial screenshot taken.');

        // 2. Read sample HL7
        const samplePath = path.resolve('..', 'sample.txt');
        if (!fs.existsSync(samplePath)) {
            throw new Error(`Sample file not found at ${samplePath}`);
        }
        const hl7Content = fs.readFileSync(samplePath, 'utf8');
        console.log('Read sample HL7 content.');

        // 3. Paste into textarea
        // Finding textarea by placeholder or class
        const textareaSelector = 'textarea';
        await page.waitForSelector(textareaSelector);
        await page.type(textareaSelector, hl7Content);
        console.log('Typed HL7 content into textarea.');

        // 4. Click Parse
        // Finding button by text content
        const buttons = await page.$$('button');
        let parseButton;
        for (const btn of buttons) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text.includes('Parse Message')) {
                parseButton = btn;
                break;
            }
        }

        if (!parseButton) throw new Error('Parse Message button not found');

        await parseButton.click();
        console.log('Clicked Parse Message.');

        // 5. Wait for result
        // Wait for "Message Editor" text or the update button
        try {
            await page.waitForFunction(
                () => document.body.innerText.includes('Message Editor'),
                { timeout: 10000 }
            );
            console.log('Parsing successful, "Message Editor" visible.');
            // Screenshot result
            await page.screenshot({ path: 'screenshot_parsed.png' });
            console.log('Parsed screenshot taken.');
        } catch (e) {
            console.error('Wait failed. Capturing failure state...');
            await page.screenshot({ path: 'screenshot_failed.png' });
            const text = await page.evaluate(() => document.body.innerText);
            console.log('Page text at failure:', text);
            throw e;
        }

    } catch (error) {
        console.error('Verification failed:', error);
        process.exit(1);
    } finally {
        await browser.close();
        console.log('Browser closed.');
    }
})();
