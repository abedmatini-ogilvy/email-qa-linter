const cheerio = require('cheerio');

function lintEmailHTML(htmlString) {
    const errors = [];
    const $ = cheerio.load(htmlString);

    // --- Phase 1: Client Specific Rules ---

    // 1. Check for missing DOCTYPE
    if (!htmlString.match(/<!DOCTYPE/i)) {
        errors.push({ type: 'Structure', message: 'DOCTYPE declaration is missing.' });
    }

    // 2. Check Image Alt Tags
    $('img').each((i, el) => {
        const alt = $(el).attr('alt');
        const width = $(el).attr('width');
        const height = $(el).attr('height');

        // Tracking pixel rule
        if (width === '1' && height === '1') {
            if (alt !== '' || $(el).attr('role') !== 'presentation') {
                errors.push({ type: 'Tracking Pixel', message: 'Tracking pixel must have alt="" and role="presentation".', snippet: $.html(el) });
            }
        } else if (alt === undefined) {
            // General missing alt attribute rule
            errors.push({ type: 'Accessibility', message: 'Image is missing an alt attribute.', snippet: $.html(el) });
        }
    });

    // ... The AI will fill in the rest of the Regex and Cheerio checks here!

    return errors;
}

module.exports = { lintEmailHTML };