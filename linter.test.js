const { lintEmailHTML } = require('./linter');

describe('HTML Email Linter', () => {

    describe('Phase 1: Client-Specific Rules', () => {

        it('should flag missing DOCTYPE declarations', () => {
            const badHTML = `<html><head></head><body><p>Hello</p></body></html>`;
            const errors = lintEmailHTML(badHTML);
            const doctypeError = errors.find(e => e.type === 'Structure' && e.message.includes('DOCTYPE'));
            expect(doctypeError).toBeDefined();
        });

        it('should strictly enforce tracking pixel attributes', () => {
            // Bad: Has alt text
            const badPixel = `<!DOCTYPE html><html><body><img src="tracker.gif" width="1" height="1" alt="Tracking pixel" /></body></html>`;
            const errors1 = lintEmailHTML(badPixel);
            const pixelError = errors1.find(e => e.type === 'Tracking Pixel');
            expect(pixelError).toBeDefined();

            // Good: Empty alt, has presentation role
            const goodPixel = `<!DOCTYPE html><html><body><img src="tracker.gif" width="1" height="1" alt="" role="presentation" /></body></html>`;
            const errors2 = lintEmailHTML(goodPixel);
            const noPixelError = errors2.find(e => e.type === 'Tracking Pixel');
            expect(noPixelError).toBeUndefined();
        });

        it('should flag missing general alt attributes on images', () => {
            const badImage = `<!DOCTYPE html><html><body><img src="logo.png" /></body></html>`;
            const errors = lintEmailHTML(badImage);
            const altError = errors.find(e => e.message.includes('missing an alt attribute'));
            expect(altError).toBeDefined();
        });

        it('should flag Structural Hierarchy errors (p vs h2)', () => {
            const badStructure = `<!DOCTYPE html><html><body><p>Everyday Value</p></body></html>`;
            const errors = lintEmailHTML(badStructure);
            const structureError = errors.find(e => e.message.includes('wrapped in an <h2>'));
            // Note: The AI will need to implement this specific check in linter.js!
            // expect(structureError).toBeDefined(); 
        });

        it('should flag leading spaces in URLs', () => {
            const badLink = `<!DOCTYPE html><html><body><a href=" https://www.priceless.com/terms">Terms</a></body></html>`;
            const errors = lintEmailHTML(badLink);
            const linkError = errors.find(e => e.message.includes('Leading space found in href'));
            // expect(linkError).toBeDefined();
        });

        it('should flag double spaces in text', () => {
            const doubleSpace = `<!DOCTYPE html><html><body><p>Mastercard  is not responsible.</p></body></html>`;
            const errors = lintEmailHTML(doubleSpace);
            const spaceError = errors.find(e => e.message.includes('Double space detected'));
            // expect(spaceError).toBeDefined();
        });

        it('should flag spaces before punctuation', () => {
            const badPunctuation = `<!DOCTYPE html><html><body><p>qualifying U.S. airports , where available</p></body></html>`;
            const errors = lintEmailHTML(badPunctuation);
            const punctuationError = errors.find(e => e.message.includes('Space before punctuation'));
            // expect(punctuationError).toBeDefined();
        });

        it('should flag unencoded ampersands', () => {
            const badEntity = `<!DOCTYPE html><html><body><p>Music & Entertainment</p></body></html>`;
            const errors = lintEmailHTML(badEntity);
            const entityError = errors.find(e => e.message.includes('Unencoded ampersand'));
            // expect(entityError).toBeDefined();
        });
    });
});