const cheerio = require('cheerio');

// Helper function to calculate line numbers
function getLineNumber(htmlString, node) {
    // If Cheerio gives us the exact starting index of the node
    if (node && node.startIndex !== undefined) {
        return htmlString.substring(0, node.startIndex).split('\n').length;
    }
    return '?';
}

function lintEmailHTML(htmlString) {
    const errors = [];

    // We pass 'sourceCodeLocationInfo' so Cheerio remembers where tags are in the raw file
    const $ = cheerio.load(htmlString, { sourceCodeLocationInfo: true });

    // --- PHASE 1: Client Specific Rules ---

    if (!htmlString.match(/<!DOCTYPE/i)) {
        errors.push({ type: 'Structure', line: 1, message: 'DOCTYPE declaration is missing.' });
    }

    $('img').each((i, el) => {
        const alt = $(el).attr('alt');
        const width = $(el).attr('width');
        const height = $(el).attr('height');
        const line = getLineNumber(htmlString, el);

        if (width === '1' && height === '1') {
            if (alt !== '' || $(el).attr('role') !== 'presentation') {
                errors.push({ type: 'Tracking Pixel', line, message: 'Tracking pixel must have alt="" and role="presentation".', snippet: $.html(el) });
            }
        } else if (alt === undefined) {
            errors.push({ type: 'Accessibility', line, message: 'Image is missing an alt attribute.', snippet: $.html(el) });
        }
    });

    const headerTexts = ["Everyday Value", "Enhanced Experiences", "Safety & Security", "Safety &amp; Security"];
    $('p').each((i, el) => {
        const text = $(el).text().trim();
        if (headerTexts.some(header => text.includes(header))) {
            errors.push({ type: 'Structure', line: getLineNumber(htmlString, el), message: `Header text "${text}" should be wrapped in an <h2>, not a <p>.`, snippet: $.html(el) });
        }
    });

    $('a').each((i, el) => {
        const href = $(el).attr('href');
        if (href && href.startsWith(' ')) {
            errors.push({ type: 'Formatting', line: getLineNumber(htmlString, el), message: 'Leading space found in href attribute.', snippet: $.html(el) });
        }
    });

    // Formatting rules (Double spaces, punctuation, quotes)
    $('body *').not('style, script').contents().filter(function () {
        return this.type === 'text';
    }).each(function () {
        const rawText = $(this).text();
        const cleanText = rawText.replace(/[\r\n\t]\s*/g, ' ').trim();

        if (cleanText.length === 0) return;

        // For text nodes, we get the line number of its parent element to be safe
        const line = getLineNumber(htmlString, $(this).parent()[0]);

        if (/ {2,}/.test(cleanText)) {
            errors.push({ type: 'Formatting', line, message: 'Double space detected in text.', snippet: cleanText.substring(0, 60) + '...' });
        }
        if (/ [,.]/.test(cleanText)) {
            errors.push({ type: 'Formatting', line, message: 'Space before punctuation detected.', snippet: cleanText.substring(0, 60) + '...' });
        }
        if (/[“”‘’]/.test(cleanText)) {
            errors.push({ type: 'Typography', line, message: 'Smart/curly quotes detected. Use straight quotes instead.', snippet: cleanText.substring(0, 60) + '...' });
        }
        if (/[—–]/.test(cleanText)) {
            errors.push({ type: 'Typography', line, message: 'Em/En dash detected. Use double hyphens or regular dashes.', snippet: cleanText.substring(0, 60) + '...' });
        }
    });

    const rawBody = htmlString.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    if (rawBody && rawBody[1]) {
        const textOnly = rawBody[1].replace(/<[^>]+>/g, '');
        if (/&(?![a-zA-Z0-9#]+;)/.test(textOnly)) {
            const badAmpMatch = textOnly.match(/.{0,20}&(?![a-zA-Z0-9#]+;).{0,20}/);
            const snippet = badAmpMatch ? badAmpMatch[0].trim() : '';

            // Rough estimate for line number by searching the raw string
            const roughLine = htmlString.substring(0, htmlString.indexOf(snippet)).split('\n').length;

            errors.push({ type: 'Encoding', line: roughLine, message: 'Unencoded ampersand detected in text.', snippet: snippet });
        }
    }

    $('td').each((i, el) => {
        const tdStyle = $(el).attr('style') || '';
        if (tdStyle.includes('font-size: 20px') || tdStyle.includes('font-size:20px')) {
            const childP = $(el).children('p');
            if (childP.length > 0) {
                const pStyle = childP.attr('style') || '';
                if (pStyle.includes('font-size: 16px') || pStyle.includes('font-size:16px')) {
                    errors.push({ type: 'Styling', line: getLineNumber(htmlString, el), message: 'Font-size mismatch: parent <td> is 20px but child <p> is 16px.', snippet: $.html(el) });
                }
            }
        }
    });

    // --- PHASE 2: Gloo Ogilvy Checklist Rules ---

    $('script').each((i, el) => {
        errors.push({ type: 'Assets', line: getLineNumber(htmlString, el), message: 'JavaScript (<script> tags) is not allowed in emails.' });
    });

    $('link[rel="stylesheet"]').each((i, el) => {
        errors.push({ type: 'Assets', line: getLineNumber(htmlString, el), message: 'External stylesheets (<link rel="stylesheet">) are not allowed. Use inline CSS.' });
    });

    $('a').each((i, el) => {
        const href = $(el).attr('href');
        if (href && href.trim().startsWith('http://')) {
            errors.push({ type: 'Security', line: getLineNumber(htmlString, el), message: 'Insecure link detected. Use HTTPS instead of HTTP.', snippet: $.html(el) });
        }
    });

    $('[style*="font-size"]').each((i, el) => {
        if ($(el).closest('.legal-text, .footer, [data-qa-ignore]').length > 0) return;

        const style = $(el).attr('style');
        const match = style.match(/font-size\s*:\s*(\d+)px/i);
        if (match && parseInt(match[1]) < 14) {
            errors.push({ type: 'Accessibility', line: getLineNumber(htmlString, el), message: `Font size is too small (${match[1]}px). Minimum is 14px.`, snippet: $.html(el).substring(0, 100) + '...' });
        }
    });

    $('table').each((i, el) => {
        const widthAttr = $(el).attr('width');
        const styleAttr = $(el).attr('style') || '';
        const styleMatch = styleAttr.match(/(?:max-)?width\s*:\s*(\d+)px/i);

        let width = parseInt(widthAttr);
        if (isNaN(width) && styleMatch) {
            width = parseInt(styleMatch[1]);
        }

        if (width > 650) {
            errors.push({ type: 'Design', line: getLineNumber(htmlString, el), message: `Table width exceeds 650px maximum (${width}px detected).`, snippet: $.html(el).substring(0, 80) + '...' });
        }
    });

    return errors;
}

module.exports = { lintEmailHTML };