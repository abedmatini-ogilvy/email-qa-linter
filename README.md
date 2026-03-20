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

### Phase 2: Gloo Ogilvy Comprehensive Checklist (Upcoming)
This phase implements the broader agency QA standards, including:
* Checking for DOCTYPE declarations.
* Ensuring all `<img>` tags have `alt` attributes.
* Flagging the use of `<script>` tags or external stylesheets.
* Enforcing `HTTPS` on all links.
* Flagging smart/curly quotes and em/en dashes.
* Checking accessibility minimums (e.g., body font sizes >= 14px).
* Ensuring maximum email width constraints (600-650px).

---

## 🛠️ Installation & Setup

**Prerequisites:** You must have [Node.js](https://nodejs.org/) installed on your machine.

1. Clone or download this repository.
2. Open your terminal in the root folder and run:
   \`\`\`bash
   npm install
   \`\`\`
   *(This installs `cheerio` for DOM parsing, `jest` for testing, and `husky`/`lint-staged` for Git hooks).*

---

## 💻 How to Use

### 1. Manual Testing (CLI)
You can manually run the linter on any HTML file without committing it.
\`\`\`bash
node cli.js ./path/to/your/email.html
\`\`\`
* **Pass:** `✅ ./email.html passed QA!`
* **Fail:** `❌ QA Failed for: ./email.html` followed by a list of specific errors.

### 2. Running the Automated Test Suite
We use Jest to ensure our linter rules work correctly against mock HTML snippets. If you update the linter, always run the test suite to ensure you haven't broken existing rules.
\`\`\`bash
npm test
\`\`\`

### 3. Automated Git Pre-Commit Hook
This project uses **Husky** and **lint-staged**. When a developer runs `git commit`, the linter automatically runs on any staged `.html` files. 
* If the code passes, the commit succeeds.
* If the code fails, the commit is **blocked** and the developer must fix the errors in their code before trying again.

---

## 📂 File Structure

* `linter.js`: The core engine. Contains the `lintEmailHTML()` function, Cheerio DOM parsing, and Regex rules.
* `cli.js`: The command-line wrapper that reads physical `.html` files and passes them into the linter.
* `linter.test.js`: The Jest test suite containing mock HTML strings to verify each rule works.
* `package.json`: Contains project dependencies and the `lint-staged` configuration.
* `.husky/pre-commit`: The Git hook trigger.

---

## 🤖 AI Prompt History (For Context & Recreation)

This project was initially scaffolded using generative AI (GitHub Copilot / Cursor). Below are the exact prompts used to generate the core logic.

**Phase 1 Prompt:**
> **# Role and Context**
> You are an expert Node.js developer specializing in HTML email development and Quality Assurance. We are building an automated QA script to parse HTML email files and identify formatting, structural, and semantic errors before they are sent to clients for review. We will use the \`cheerio\` library to traverse the DOM and regular expressions for strict string matching.
>
> **# Core Functionality**
> Please write a JavaScript module with an exportable function \`lintEmailHTML(htmlString)\` that processes the code and returns an array of structured error objects. Include details like the issue type, a snippet of the context, and suggested fixes. 
> 
> **# Phase 1: Client-Specific Rules**
> Implement strict checks for the following historical client feedback points:
> 1. **Double Spaces:** Flag two or more consecutive spaces.
> 2. **Spaces Before Punctuation:** Flag spaces before commas/periods.
> 3. **Leading Spaces in URLs:** Flag spaces inside href attributes.
> 4. **Tracking Pixels:** Find 1x1 imgs. Enforce \`alt=""\` and \`role="presentation"\`.
> 5. **Structural Hierarchy:** Check specific text nodes (e.g., "Everyday Value") are in \`<h2>\`.
> 6. **Font-Size Mismatches:** Identify parent/child inline style conflicts.

**Phase 2 Prompt:**
> **# Task: Phase 2 Implementation**
> Update BOTH \`linter.js\` and \`linter.test.js\` to include new programmatic checks based on our agency's standard QA checklist.
> 
> **# The New Rules to Implement:**
> 1. **External Assets:** Flag \`<script>\` and \`<link rel="stylesheet">\`.
> 2. **Link Security:** Flag \`http://\` (require \`https://\`, \`mailto:\`, \`tel:\`).
> 3. **Typography:** Flag curly quotes and em/en dashes.
> 4. **Accessibility:** Flag inline font-sizes < 14px on structural tags.
> 5. **Email Width:** Flag explicit width > 650px on main tables.