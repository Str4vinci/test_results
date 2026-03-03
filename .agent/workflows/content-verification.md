---
description: Procedures for generating and refining content
---

# Content Generation and Verification Workflow

When generating articles, documentation, or any content containing external or internal links, follow these steps:

1. **Draft Content**: Write the content as per the requirements.
2. **Identify Links**: Scan the draft for any URLs or relative paths.
3. **Verify Links**:
    - For external links: Use the `read_url_content` or `browser_subagent` tool to verify that the URL is reachable and the content is relevant.
    - For internal links: Check the local project structure to ensure the file exists and the path is correct.
4. **Fix Broken Links**: Replace or correct any links that result in a 404 or other error.
5. **Final Review**: Perform a final check of the rendered content if possible (e.g., via the browser if it's a web page).
