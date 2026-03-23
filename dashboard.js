const fs = require('fs');
const { lintEmailHTML } = require('./linter');

// Grab the file name from the terminal command
const file = process.argv[2];

if (!file || !file.endsWith('.html')) {
    console.error('❌ Please provide an HTML file. Example: node dashboard.js email.html');
    process.exit(1);
}

// Read the email and run our linter!
const htmlString = fs.readFileSync(file, 'utf8');
const errors = lintEmailHTML(htmlString);

if (errors.length === 0) {
    console.log(`✅ ${file} passed QA! No report needed.`);
    process.exit(0);
}

// --- BUILD THE HTML REPORT ---
let reportHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>QA Report: ${file}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f4f4f5; padding: 40px; color: #18181b; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
        h1 { margin-top: 0; color: #e11d48; border-bottom: 2px solid #f4f4f5; padding-bottom: 15px; }
        .error-card { background: #fff1f2; border-left: 4px solid #e11d48; padding: 15px 20px; margin-bottom: 15px; border-radius: 0 8px 8px 0; }
        .type { display: inline-block; background: #ffe4e6; color: #be123c; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-bottom: 8px; text-transform: uppercase; }
        .message { font-weight: bold; margin-bottom: 8px; font-size: 15px; }
        .snippet { background: #18181b; color: #a1a1aa; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 13px; overflow-x: auto; margin: 0; white-space: pre-wrap; }
        .highlight { color: #18181b; background-color: #fde047; font-weight: bold; padding: 2px 4px; border-radius: 3px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>❌ QA Failed: ${file}</h1>
        <p>Found <strong>${errors.length}</strong> issues that need to be fixed.</p>
`;

// Loop through each error and create a visual card for it
errors.forEach(err => {
    let visualSnippet = err.snippet || '';

    // If it's a formatting error, inject bright yellow HTML highlights so we can actually see the spaces!
    if (err.type === 'Formatting') {
        visualSnippet = visualSnippet.replace(/ {2,}/g, '<span class="highlight">[DOUBLE SPACE]</span>');
        visualSnippet = visualSnippet.replace(/ ([,.])/g, '<span class="highlight">[SPACE]</span>$1');
    }

    reportHtml += `
        <div class="error-card">
            <div class="type">${err.type}</div>
            <div class="message">${err.message}</div>
            ${visualSnippet ? `<pre class="snippet">${visualSnippet}</pre>` : ''}
        </div>
    `;
});

reportHtml += `
    </div>
</body>
</html>
`;

// Save the HTML string to a physical file
fs.writeFileSync('qa-report.html', reportHtml, 'utf8');

console.log(`\n🚨 Found ${errors.length} errors!`);
console.log(`📊 I generated a visual dashboard for you. Open "qa-report.html" in your browser to view it!`);