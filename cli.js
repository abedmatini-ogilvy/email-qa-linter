const fs = require('fs');
const { lintEmailHTML } = require('./linter');

// Get the files passed from the command line
const files = process.argv.slice(2);
let hasErrors = false;

files.forEach(file => {
    // Only check HTML files
    if (!file.endsWith('.html')) return;

    const htmlString = fs.readFileSync(file, 'utf8');
    const errors = lintEmailHTML(htmlString);

    if (errors.length > 0) {
        console.error(`\n❌ QA Failed for: ${file}`);
        errors.forEach(err => {
            console.error(`   - [${err.type}] ${err.message}`);
        });
        hasErrors = true;
    } else {
        console.log(`\n✅ ${file} passed QA!`);
    }
});

// If there are errors, force the process to fail (this stops the Git commit)
if (hasErrors) {
    process.exit(1);
}