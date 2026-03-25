const express = require('express');
const { lintEmailHTML } = require('./linter');
const path = require('path');

const app = express();
const port = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Helper to prevent HTML tags from rendering as actual elements on the screen
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

const agencyChecklist = [
    { category: 'HTML Validation', checks: [
        { label: 'DOCTYPE declaration is present and correct', errorMatches: ['DOCTYPE'] },
        { label: 'Inline CSS only (no external stylesheets)', errorMatches: ['stylesheets'] },
        { label: 'No JavaScript', errorMatches: ['JavaScript'] },
        { label: 'Character encoding is set (UTF-8)', errorMatches: ['Character encoding'] }
    ]},
    { category: 'Content & Security', checks: [
        { label: 'All links use HTTPS (not HTTP)', errorMatches: ['HTTPS'] },
        { label: 'Alt text and ARIA roles present on images', errorMatches: ['alt attribute', 'Tracking pixel'] },
        { label: 'Email addresses are clickable (mailto)', errorMatches: ['mailto'] }
    ]},
    { category: 'Text & Formatting', checks: [
        { label: 'No smart quotes or curly quotes', errorMatches: ['Smart/curly'] },
        { label: 'No em dashes or en dashes', errorMatches: ['Em/En dash'] },
        { label: 'No invisible characters or extra spaces', errorMatches: ['Double space', 'Space before', 'Leading space'] },
        { label: 'Special characters are HTML encoded', errorMatches: ['Unencoded'] },
        { label: 'No deprecated HTML tags', errorMatches: ['Deprecated'] }
    ]},
    { category: 'Design & Accessibility', checks: [
        { label: 'Email width is 600-650px maximum', errorMatches: ['width'] },
        { label: 'Font sizes are appropriate (min 14px)', errorMatches: ['too small'] },
        { label: 'Semantic HTML structure used (H2 vs P)', errorMatches: ['wrapped in an <h2>'] },
        { label: 'Links have descriptive text', errorMatches: ['descriptive enough'] }
    ]}
];

app.post('/api/lint', (req, res) => {
    const htmlString = req.body.html;
    const errors = lintEmailHTML(htmlString);
    const fixableTypes = ['Formatting', 'Encoding', 'Typography'];

    // 1. Generate Checklist Progress
    let passedCount = 0;
    let totalChecks = 0;
    let checklistHtml = '';

    agencyChecklist.forEach(section => {
        checklistHtml += `
            <div style="margin-bottom: 20px;">
                <h4 style="margin: 0 0 10px 0; color: #3f3f46; text-transform: uppercase; font-size: 12px; letter-spacing: 0.5px;">${section.category}</h4>
                <ul style="list-style: none; padding: 0; margin: 0; font-size: 13px;">
        `;
        section.checks.forEach(check => {
            totalChecks++;
            const hasFailed = errors.some(err => check.errorMatches.some(match => err.message.includes(match)));
            if (!hasFailed) passedCount++;
            
            const color = hasFailed ? '#be123c' : '#166534';
            const icon = hasFailed ? '❌' : '✅';
            
            checklistHtml += `
                <li style="display: flex; align-items: flex-start; gap: 8px; margin-bottom: 8px; line-height: 1.4; color: ${color}; font-weight: 500;">
                    <span>${icon}</span>
                    <span>${check.label}</span>
                </li>
            `;
        });
        checklistHtml += `</ul></div>`;
    });

    const progressPercentage = (passedCount / totalChecks) * 100;

    // 2. Generate Error Cards
    let errorsHtml = '';
    if (errors.length === 0) {
        errorsHtml = `
            <div style="background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; padding: 30px; border-radius: 8px; text-align: center;">
                <h1 style="font-size: 40px; margin: 0 0 10px 0;">🎉</h1>
                <h2 style="margin: 0 0 10px 0;">All automated checks passed!</h2>
                <p style="margin: 0;">This code is clean and ready for Litmus testing.</p>
            </div>
        `;
    } else {
        errorsHtml = `<h3 style="color: #e11d48; margin-top: 0;">Found ${errors.length} issues requiring attention:</h3>`;
        errors.forEach(err => {
            let snippetHtml = '';
            
            if (err.snippet) {
                // If it's something we can auto-fix, build the Side-By-Side diff!
                if (fixableTypes.includes(err.type)) {
                    let orig = escapeHtml(err.snippet);
                    let fixed = escapeHtml(err.snippet);

                    // Add Red/Green visual highlights based on the specific error
                    if (err.message.includes('Double space')) {
                        orig = orig.replace(/ {2,}/g, '<span class="diff-removed" title="Double Space">  </span>');
                        fixed = fixed.replace(/ {2,}/g, '<span class="diff-added" title="Single Space"> </span>');
                    } else if (err.message.includes('Space before punctuation')) {
                        orig = orig.replace(/ ([,.])/g, '<span class="diff-removed" title="Extra Space"> </span>$1');
                        fixed = fixed.replace(/ ([,.])/g, '<span class="diff-added"></span>$1');
                    } else if (err.message.includes('Smart/curly quotes')) {
                        orig = orig.replace(/([“”‘’])/g, '<span class="diff-removed">$1</span>');
                        fixed = fixed.replace(/[“”]/g, '<span class="diff-added">"</span>').replace(/[‘’]/g, '<span class="diff-added">\'</span>');
                    } else if (err.message.includes('Unencoded ampersand')) {
                        orig = orig.replace(/&(?![a-zA-Z0-9#]+;)/g, '<span class="diff-removed">&amp;</span>');
                        fixed = fixed.replace(/&(?![a-zA-Z0-9#]+;)/g, '<span class="diff-added">&amp;amp;</span>');
                    } else if (err.message.includes('Leading space found in href')) {
                        orig = orig.replace(/href=&quot;\s+/g, 'href=&quot;<span class="diff-removed" title="Extra Space"> </span>');
                        fixed = fixed.replace(/href=&quot;\s+/g, 'href=&quot;<span class="diff-added"></span>');
                    }

                    snippetHtml = `
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
                            <div>
                                <div style="font-size: 11px; font-weight: bold; color: #9f1239; margin-bottom: 5px; text-transform: uppercase;">🔴 Original Code</div>
                                <pre class="snippet">${orig}</pre>
                            </div>
                            <div>
                                <div style="font-size: 11px; font-weight: bold; color: #166534; margin-bottom: 5px; text-transform: uppercase;">🟢 Fixed Code</div>
                                <pre class="snippet">${fixed}</pre>
                            </div>
                        </div>
                    `;
                } else {
                    // For structural errors (like missing Alt tags), just show one normal box
                    snippetHtml = `<pre class="snippet">${escapeHtml(err.snippet)}</pre>`;
                }
            }

            errorsHtml += `
                <div style="background: white; border: 1px solid #e4e4e7; border-left: 4px solid #e11d48; padding: 20px; margin-bottom: 15px; border-radius: 4px;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                        <span style="background: #ffe4e6; color: #be123c; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; text-transform: uppercase;">${err.type}</span>
                        <span style="background: #3f3f46; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; font-family: monospace;">Line ${err.line}</span>
                    </div>
                    <div style="font-weight: bold; margin-bottom: 10px; font-size: 15px;">${err.message}</div>
                    ${snippetHtml}
                </div>
            `;
        });
    }

    // 3. Combine into the Grid Layout
    const finalHtml = `
        <style>
            .snippet { background: #18181b; color: #a1a1aa; padding: 15px; border-radius: 4px; font-family: monospace; font-size: 13px; overflow-x: auto; margin: 0; white-space: pre-wrap; line-height: 1.5; }
            .diff-removed { background-color: #fecdd3; color: #9f1239; padding: 1px 4px; border-radius: 3px; font-weight: bold; text-decoration: underline; text-decoration-style: wavy; }
            .diff-added { background-color: #bbf7d0; color: #166534; padding: 1px 4px; border-radius: 3px; font-weight: bold; }
        </style>
        <div style="display: grid; grid-template-columns: 320px 1fr; gap: 30px; align-items: start; margin-top: 30px; border-top: 2px solid #f4f4f5; padding-top: 30px;">
            <div style="background: #fafafa; border: 1px solid #e4e4e7; padding: 20px; border-radius: 8px; position: sticky; top: 20px;">
                <h3 style="margin-top: 0; margin-bottom: 5px;">Automated Checks</h3>
                <div style="font-size: 20px; font-weight: bold; color: #18181b;">
                    ${passedCount} / ${totalChecks} Passed
                </div>
                <div style="background: #e4e4e7; height: 8px; border-radius: 4px; margin: 15px 0; overflow: hidden;">
                    <div style="background: #10b981; height: 100%; width: ${progressPercentage}%; transition: width 0.5s;"></div>
                </div>
                <p style="font-size: 11px; color: #71717a; margin-bottom: 20px; line-height: 1.4;">
                    *Litmus, proofreading, and image optimizations must still be checked manually.
                </p>
                ${checklistHtml}
            </div>

            <div>
                ${errorsHtml}
            </div>
        </div>
    `;

    res.send(finalHtml);
});

app.listen(port, () => {
    console.log(`\n🚀 Web App is running!`);
    console.log(`👉 Open your browser to: http://localhost:${port}\n`);
});