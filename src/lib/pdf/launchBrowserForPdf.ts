function isServerlessPdfEnv(): boolean {
    return (
        process.env.VERCEL === "1" ||
        Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME) ||
        Boolean(process.env.AWS_EXECUTION_ENV)
    );
}

/** Puppeteer voor werkbon-PDF: lokaal bundled Chrome, op Vercel @sparticuz/chromium. */
export async function launchBrowserForPdf() {
    if (isServerlessPdfEnv()) {
        const chromium = (await import("@sparticuz/chromium")).default;
        const puppeteer = await import("puppeteer-core");

        return puppeteer.default.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
        });
    }

    const puppeteer = await import("puppeteer");

    return puppeteer.default.launch({
        headless: true,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
        ],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    });
}
