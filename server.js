const express = require('express');
const fs = require('fs');
const { lintEmailHTML } = require('./linter');

const app = express();
const port = 3000;
const file = process.argv[2];

if (!file || !file.endsWith('.html')) {
    console.error('❌ Please provide an HTML file. Example: node server.js email.html');
    process.exit(1);
}

function autoFixHTML(filePath) {
    let htmlString = fs.readFileSync(filePath, 'utf8');
    htmlString = htmlString.replace(/\s+([.,])/g, '$1');
    htmlString = htmlString.replace(/href="\s+(http)/g, 'href="$1');
    htmlString = htmlString.replace(/ & /g, ' &amp; ');
    htmlString = htmlString.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
    fs.writeFileSync(filePath, htmlString, 'utf8');
}

app.get('/', (req, res) => {
    const htmlString = fs.readFileSync(file, 'utf8');
    const errors = lintEmailHTML(htmlString);

    const fixableTypes = ['Formatting', 'Encoding', 'Typography'];
    const fixableCount = errors.filter(e => fixableTypes.includes(e.type)).length;

    if (errors.length === 0) {
        return res.send(`
            <body style="font-family: sans-serif; background: #ecfdf5; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; color: #065f46;">
                <div style="text-align: center;">
                    <h1 style="font-size: 50px; margin: 0;">🎉</h1>
                    <h2>All QA Checks Passed!</h2>
                    <p><strong>${file}</strong> is completely clean.</p>
                </div>
            </body>
        `);
    }

    let reportHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>QA Dashboard: ${file}</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f4f4f5; padding: 40px; color: #18181b; margin: 0; }
            .header { background: white; padding: 20px 40px; border-bottom: 1px solid #e4e4e7; position: sticky; top: 0; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); z-index: 10; }
            .container { max-width: 900px; margin: 40px auto; }
            .error-card { background: white; border-left: 4px solid #e11d48; padding: 20px; margin-bottom: 15px; border-radius: 4px; box-shadow: 0 1px 3px rgb(0 0 0 / 0.1); }
            .badge-container { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
            .type { background: #ffe4e6; color: #be123c; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
            .line-number { background: #3f3f46; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; font-family: monospace; }
            .type.fixable { background: #fef08a; color: #854d0e; border-left-color: #eab308; }
            .error-card.fixable { border-left-color: #eab308; }
            .message { font-weight: bold; margin-bottom: 10px; font-size: 15px; }
            .snippet { background: #18181b; color: #a1a1aa; padding: 15px; border-radius: 4px; font-family: monospace; font-size: 13px; overflow-x: auto; margin: 0; white-space: pre-wrap; line-height: 1.5; }
            .highlight { color: #18181b; background-color: #fde047; font-weight: bold; padding: 2px 4px; border-radius: 3px; }
            .btn { background: #10b981; color: white; border: none; padding: 10px 20px; font-weight: bold; border-radius: 6px; cursor: pointer; font-size: 14px; transition: 0.2s; }
            .btn:hover { background: #059669; }
            .btn:disabled { background: #a1a1aa; cursor: not-allowed; }
        </style>
    </head>
    <body>
        <div class="header">
            <div>
                <h2 style="margin:0; color: #18181b;">QA Dashboard</h2>
                <p style="margin: 5px 0 0 0; color: #71717a; font-size: 14px;">Analyzing: <strong>${file}</strong></p>
            </div>
            <div>
                ${fixableCount > 0
            ? `<button class="btn" onclick="fixErrors()">✨ Auto-Fix ${fixableCount} Issues</button>`
            : `<button class="btn" disabled>No Auto-Fixable Issues</button>`
        }
            </div>
        </div>
        <div class="container">
            <h3 style="color: #e11d48;">Found ${errors.length} total issues requiring attention:</h3>
    `;

    errors.forEach(err => {
        let visualSnippet = err.snippet || '';
        const isFixable = fixableTypes.includes(err.type);

        if (err.type === 'Formatting') {
            visualSnippet = visualSnippet.replace(/ {2,}/g, '<span class="highlight">[DOUBLE SPACE]</span>');
            visualSnippet = visualSnippet.replace(/ ([,.])/g, '<span class="highlight">[SPACE]</span>$1');
        }

        reportHtml += `
            <div class="error-card ${isFixable ? 'fixable' : ''}">
                <div class="badge-container">
                    <div class="type ${isFixable ? 'fixable' : ''}">${err.type}</div>
                    <div class="line-number">Line ${err.line}</div>
                </div>
                <div class="message">${err.message}</div>
                ${visualSnippet ? `<pre class="snippet">${visualSnippet}</pre>` : ''}
            </div>
        `;
    });

    reportHtml += `
        </div>
        <script>
            function fixErrors() {
                const btn = document.querySelector('.btn');
                btn.innerText = 'Fixing...';
                btn.disabled = true;
                
                fetch('/fix', { method: 'POST' })
                    .then(() => {
                        window.location.reload();
                    });
            }
        </script>
    </body>
    </html>
    `;

    res.send(reportHtml);
});

app.post('/fix', (req, res) => {
    autoFixHTML(file);
    res.sendStatus(200);
});

app.listen(port, () => {
    console.log(`\n🚀 Interactive DX Dashboard running!`);
    console.log(`👉 Open your browser to: http://localhost:${port}\n`);
});