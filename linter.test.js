const { lintEmailHTML } = require('./linter');

describe('HTML Email Linter', () => {

    describe('Phase 1: Client-Specific Rules', () => {
        it('should flag missing DOCTYPE declarations', () => {
            const errors = lintEmailHTML(`<html><body><p>Hello</p></body></html>`);
            expect(errors.find(e => e.message.includes('DOCTYPE'))).toBeDefined();
        });

        it('should strictly enforce tracking pixel attributes', () => {
            const badPixel = `<!DOCTYPE html><html><body><img src="tracker.gif" width="1" height="1" alt="Tracking pixel" /></body></html>`;
            expect(lintEmailHTML(badPixel).find(e => e.type === 'Tracking Pixel')).toBeDefined();
        });

        it('should flag missing general alt attributes on images', () => {
            const badImage = `<!DOCTYPE html><html><body><img src="logo.png" /></body></html>`;
            expect(lintEmailHTML(badImage).find(e => e.message.includes('missing an alt attribute'))).toBeDefined();
        });

        it('should flag leading spaces in URLs', () => {
            const badLink = `<!DOCTYPE html><html><body><a href=" https://link.com">Terms</a></body></html>`;
            expect(lintEmailHTML(badLink).find(e => e.message.includes('Leading space'))).toBeDefined();
        });

        it('should flag double spaces in text', () => {
            const doubleSpace = `<!DOCTYPE html><html><body><p>Double  space</p></body></html>`;
            expect(lintEmailHTML(doubleSpace).find(e => e.message.includes('Double space'))).toBeDefined();
        });

        it('should flag spaces before punctuation', () => {
            const badPunctuation = `<!DOCTYPE html><html><body><p>airports , where</p></body></html>`;
            expect(lintEmailHTML(badPunctuation).find(e => e.message.includes('Space before punctuation'))).toBeDefined();
        });
    });

    describe('Phase 2: Gloo Ogilvy Checklist Rules', () => {
        it('should flag <script> tags and external stylesheets', () => {
            const badJS = `<!DOCTYPE html><html><body><script>alert("hi")</script></body></html>`;
            expect(lintEmailHTML(badJS).find(e => e.message.includes('JavaScript'))).toBeDefined();

            const badCSS = `<!DOCTYPE html><html><head><link rel="stylesheet" href="style.css"></head><body></body></html>`;
            expect(lintEmailHTML(badCSS).find(e => e.message.includes('External stylesheets'))).toBeDefined();
        });

        it('should flag HTTP links', () => {
            const badLink = `<!DOCTYPE html><html><body><a href="http://example.com">Link</a></body></html>`;
            expect(lintEmailHTML(badLink).find(e => e.message.includes('Insecure link'))).toBeDefined();
        });

        it('should flag smart quotes and em/en dashes', () => {
            const badQuotes = `<!DOCTYPE html><html><body><p>“Smart quotes”</p></body></html>`;
            expect(lintEmailHTML(badQuotes).find(e => e.message.includes('Smart/curly quotes'))).toBeDefined();

            const badDash = `<!DOCTYPE html><html><body><p>Text — more text</p></body></html>`;
            expect(lintEmailHTML(badDash).find(e => e.message.includes('Em/En dash'))).toBeDefined();
        });

        it('should flag font sizes under 14px', () => {
            const smallFont = `<!DOCTYPE html><html><body><p style="font-size: 12px;">Tiny text</p></body></html>`;
            expect(lintEmailHTML(smallFont).find(e => e.message.includes('Font size is too small'))).toBeDefined();
        });

        it('should flag table widths over 650px', () => {
            const wideTable = `<!DOCTYPE html><html><body><table width="700"><tr><td>Wide</td></tr></table></body></html>`;
            expect(lintEmailHTML(wideTable).find(e => e.message.includes('exceeds 650px'))).toBeDefined();
        });
    });
});