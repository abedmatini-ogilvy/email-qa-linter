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

// Map our linter rules to the Agency Checklist
const agencyChecklist = [
    {
        category: 'HTML Validation', checks: [
            { label: 'DOCTYPE declaration is present and correct', errorMatches: ['DOCTYPE'] },
            { label: 'Inline CSS only (no external stylesheets)', errorMatches: ['stylesheets'] },
            { label: 'No JavaScript', errorMatches: ['JavaScript'] }
        ]
    },
    {
        category: 'Content & Security', checks: [
            { label: 'All links use HTTPS (not HTTP)', errorMatches: ['HTTPS'] },
            { label: 'Alt text and ARIA roles present on all images', errorMatches: ['alt attribute', 'Tracking pixel'] }
        ]
    },
    {
        category: 'Text & Formatting', checks: [
            { label: 'No smart quotes or curly quotes', errorMatches: ['Smart/curly'] },
            { label: 'No em dashes or en dashes', errorMatches: ['Em/En dash'] },
            { label: 'No invisible characters or extra spaces', errorMatches: ['Double space', 'Space before', 'Leading space'] },
            { label: 'Special characters are HTML encoded', errorMatches: ['Unencoded'] }
        ]
    },
    {
        category: 'Design & Accessibility', checks: [
            { label: 'Email width is 600-650px maximum', errorMatches: ['width'] },
            { label: 'Font sizes are appropriate (minimum 14px)', errorMatches: ['too small'] },
            { label: 'Semantic HTML structure used (H2 vs P)', errorMatches: ['wrapped in an <h2>'] }
        ]
    }
];

app.get('/', (req, res) => {
    const htmlString = fs.readFileSync(file, 'utf8');
    const errors = lintEmailHTML(htmlString);

    const fixableTypes = ['Formatting', 'Encoding', 'Typography'];
    const fixableCount = errors.filter(e => fixableTypes.includes(e.type)).length;

    // Generate Checklist HTML
    let checklistHtml = '';
    let passedCount = 0;
    let totalChecks = 0;

    agencyChecklist.forEach(section => {
        checklistHtml += `<div class="checklist-section"><h4>${section.category}</h4><ul class="checklist">`;
        section.checks.forEach(check => {
            totalChecks++;
            // Check if any error messages match this checklist item
            const hasFailed = errors.some(err => check.errorMatches.some(match => err.message.includes(match)));
            if (!hasFailed) passedCount++;

            checklistHtml += `
                <li class="${hasFailed ? 'fail' : 'pass'}">
                    <span class="icon">${hasFailed ? '❌' : '✅'}</span>
                    <span>${check.label}</span>
                </li>
            `;
        });
        checklistHtml += `</ul></div>`;
    });

    let reportHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>QA Dashboard: ${file}</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f4f4f5; color: #18181b; margin: 0; }
            .header { background: white; padding: 20px 40px; border-bottom: 1px solid #e4e4e7; position: sticky; top: 0; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); z-index: 10; }
            .layout { display: grid; grid-template-columns: 350px 1fr; gap: 30px; max-width: 1400px; margin: 40px auto; padding: 0 40px; align-items: start; }
            
            /* Checklist Panel */
            .panel { background: white; padding: 25px; border-radius: 8px; box-shadow: 0 1px 3px rgb(0 0 0 / 0.1); }
            .checklist-section h4 { margin: 0 0 10px 0; color: #3f3f46; text-transform: uppercase; font-size: 12px; letter-spacing: 0.5px; }
            .checklist { list-style: none; padding: 0; margin: 0 0 20px 0; font-size: 14px; }
            .checklist li { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 8px; color: #52525b; line-height: 1.4; }
            .checklist li.pass { color: #166534; font-weight: 500; }
            .checklist li.fail { color: #be123c; font-weight: 500; }
            .progress-bar { background: #e4e4e7; height: 8px; border-radius: 4px; margin: 15px 0; overflow: hidden; }
            .progress-fill { background: #10b981; height: 100%; width: ${(passedCount / totalChecks) * 100}%; transition: width 0.5s; }

            /* Errors Panel */
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
            .success-msg { background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; padding: 40px; border-radius: 8px; text-align: center; }
        </style>
    </head>
    <body>
        <div class="header">
            <div>
                <h2 style="margin:0; color: #18181b;">Agency QA Dashboard</h2>
                <p style="margin: 5px 0 0 0; color: #71717a; font-size: 14px;">Analyzing: <strong>${file}</strong></p>
            </div>
            <div>
                ${fixableCount > 0
            ? `<button class="btn" onclick="fixErrors()">✨ Auto-Fix ${fixableCount} Issues</button>`
            : `<button class="btn" disabled>No Auto-Fixable Issues</button>`
        }
            </div>
        </div>

        <div class="layout">
            <div class="panel">
                <h3 style="margin-top: 0;">Automated Checks</h3>
                <div style="font-size: 24px; font-weight: bold; color: #18181b;">
                    ${passedCount} / ${totalChecks} Passed
                </div>
                <div class="progress-bar"><div class="progress-fill"></div></div>
                <p style="font-size: 12px; color: #71717a; margin-bottom: 20px;">
                    *Note: Litmus, proofreading, and image optimizations must still be checked manually.
                </p>
                ${checklistHtml}
            </div>

            <div>
    `;

    if (errors.length === 0) {
        reportHtml += `
            <div class="success-msg">
                <h1 style="font-size: 40px; margin: 0 0 10px 0;">🎉</h1>
                <h2 style="margin: 0 0 10px 0;">All automated QA checks passed!</h2>
                <p style="margin: 0;">This file is clean and ready for manual Litmus testing.</p>
            </div>
        `;
    } else {
        reportHtml += `<h3 style="color: #e11d48; margin-top: 0;">Found ${errors.length} issues requiring attention:</h3>`;
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
    }

    reportHtml += `
            </div>
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