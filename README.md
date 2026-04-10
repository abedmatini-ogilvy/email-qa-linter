# HTML Email QA Linter

## 📖 Project Context
Reviewing HTML emails for microscopic errors—like double spaces, unencoded ampersands, and tracking pixel attributes—is tedious and highly prone to human error. This project is a **programmatic, automated QA linter** built with Node.js and Cheerio. 

Instead of manually checking code after the fact, this tool allows developers to instantly parse their HTML against a strict set of agency and client rules. It also includes Git hook integration to physically prevent developers from committing broken or unformatted code.

---

## 🚀 Phases of Development

### Phase 1: Client-Specific Rules (Completed)
This phase addresses historical client feedback and edge cases that frequently cause revisions.
* **Double Spaces & Invisible Characters:** Flags any instance of two or more consecutive spaces within text nodes.
* **Leading Spaces in URLs:** Flags leading spaces inside `href` attributes (e.g., `href=" https..."`).
* **Spaces Before Punctuation:** Flags empty spaces immediately preceding commas or periods.
* **Unencoded HTML Entities:** Ensures ampersands (`&`) in text are properly encoded as `&amp;`.
* **Tracking Pixels:** Ensures `<img>` tags with `width="1"` and `height="1"` strictly contain `alt=""` and `role="presentation"`, stripping out incorrect text like "Tracking pixel".
* **Structural Hierarchy:** Verifies specific header strings (e.g., "Everyday Value") are wrapped in `<h2>` tags, not `<p>` tags.
* **Font-Size Mismatches:** Flags nested elements with conflicting inline font sizes.

### Phase 2: Gloo Ogilvy Comprehensive Checklist (Completed)
This phase implements the broader agency QA standards, including:
* Checking for DOCTYPE declarations.
* Ensuring all `<img>` tags have `alt` attributes.
* Flagging the use of `<script>` tags or external stylesheets.
* Enforcing `HTTPS` on all links.
* Flagging smart/curly quotes and em/en dashes.
* Checking accessibility minimums (e.g., body font sizes >= 14px).
* Ensuring maximum email width constraints (650px).

---

## 🛠️ Installation & Setup

**Prerequisites:** You must have [Node.js](https://nodejs.org/) installed on your machine.

1. Clone or download this repository.
2. Open your terminal in the root folder and run:
   ```bash
   npm install
   ```
   *(This installs `cheerio` for DOM parsing, `express` for the interactive dashboard, `jest` for testing, and `husky`/`lint-staged` for Git hooks).*

---

## 💻 How to Use

### 1. Interactive DX Dashboard (Recommended)
This spins up a local web server to visually display all errors with code snippets. It also includes an **Auto-Fix** button that can programmatically clean up Formatting, Encoding, and Typography issues!
```bash
npm run report path/to/email.html
# OR
node server.js path/to/email.html
```
* **View:** Open `http://localhost:3000` in your browser.

### 2. Manual Testing (CLI)
You can manually run the linter in your terminal. This is great for a quick, text-based check without firing up a browser.
```bash
npm run qa path/to/email.html
# OR
node cli.js path/to/email.html
```
* **Pass:** `✅ path/to/email.html passed QA!`
* **Fail:** `❌ QA Failed for: path/to/email.html` followed by a list of specific errors and code snippets.

### 3. Automated Git Pre-Commit Hook
This project uses **Husky** and **lint-staged**. When a developer runs `git commit`, the linter automatically runs `node dashboard.js` on any staged `.html` files. 
* If the code passes, the commit succeeds.
* If the code fails, the commit is **blocked**, and the tool instantly generates a physical `qa-report.html` file in your directory. You can open this file in your browser to view a visual dashboard of exactly what needs fixing before you can commit.

### 4. Running the Automated Test Suite
We use Jest to ensure our linter rules work correctly against mock HTML snippets. If you update the linter, always run the test suite to ensure you haven't broken existing rules.
```bash
npm test
```

### 5. Using Copilot Instructions in This Repo
This repository includes workspace-level guidance for GitHub Copilot Chat in [.github/copilot-instructions.md](.github/copilot-instructions.md).

How it works:
1. When you ask Copilot Chat to review or fix an email, it uses the rules in that file as behavioral instructions.
2. Those instructions are not a command-line script; they are prompt context for Copilot in this workspace.
3. The instructions cover the same QA areas enforced by this project (formatting, typography, accessibility, structure, HTTPS, and width).

How to run it in practice:
1. Open an HTML email file in VS Code.
2. In Copilot Chat, ask for a targeted action, for example:
   - "Fix QA for this file based on our Copilot instructions"
   - "Review this email for spacing, ampersands, tracking pixels, and font-size issues"
3. Apply the generated edits, then validate with the CLI:

```bash
npm run qa path/to/email.html
```

When to use each workflow:
1. Use Copilot Chat for guided edits and fast remediation.
2. Use `npm run qa` as the deterministic pass/fail check.
3. Use `npm run report` to inspect issues in the browser dashboard.

---

## 📂 File Structure

* `linter.js`: The core engine. Contains the `lintEmailHTML()` function, Cheerio DOM parsing, and Regex rules.
* `cli.js`: A command-line wrapper that prints errors directly to the terminal.
* `server.js`: An Express server that hosts a highly visual, interactive QA dashboard with auto-fix capabilities.
* `dashboard.js`: Generates a static offline HTML report (`qa-report.html`) and blocks bad code. Triggered automatically during git commits.
* `linter.test.js`: Built-in Jest test suite to verify each linter rule works.
* `package.json`: Contains project dependencies and npm scripts (`npm run qa`, `npm run report`).
* `.husky/pre-commit`: The Git hook trigger.

---

## 🤖 AI Prompt History (For Context & Recreation)

This project was initially scaffolded using generative AI (GitHub Copilot / Cursor). Below are the exact prompts used to generate the core logic.

**Phase 1 Prompt:**
> **# Role and Context**
> You are an expert Node.js developer specializing in HTML email development and Quality Assurance. We are building an automated QA script to parse HTML email files and identify formatting, structural, and semantic errors before they are sent to clients for review. We will use the `cheerio` library to traverse the DOM and regular expressions for strict string matching.
>
> **# Core Functionality**
> Please write a JavaScript module with an exportable function `lintEmailHTML(htmlString)` that processes the code and returns an array of structured error objects. Include details like the issue type, a snippet of the context, and suggested fixes. 
> 
> **# Phase 1: Client-Specific Rules**
> Implement strict checks for the following historical client feedback points:
> 1. **Double Spaces:** Flag two or more consecutive spaces.
> 2. **Spaces Before Punctuation:** Flag spaces before commas/periods.
> 3. **Leading Spaces in URLs:** Flag spaces inside href attributes.
> 4. **Tracking Pixels:** Find 1x1 imgs. Enforce `alt=""` and `role="presentation"`.
> 5. **Structural Hierarchy:** Check specific text nodes (e.g., "Everyday Value") are in `<h2>`.
> 6. **Font-Size Mismatches:** Identify parent/child inline style conflicts.

**Phase 2 Prompt:**
> **# Task: Phase 2 Implementation**
> Update BOTH `linter.js` and `linter.test.js` to include new programmatic checks based on our agency's standard QA checklist.
> 
> **# The New Rules to Implement:**
> 1. **External Assets:** Flag `<script>` and `<link rel="stylesheet">`.
> 2. **Link Security:** Flag `http://` (require `https://`, `mailto:`, `tel:`).
> 3. **Typography:** Flag curly quotes and em/en dashes.
> 4. **Accessibility:** Flag inline font-sizes < 14px on structural tags.
> 5. **Email Width:** Flag explicit width > 650px on main tables.