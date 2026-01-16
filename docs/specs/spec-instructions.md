## Creating a Spec

### File Structure
- All specs live in `@/docs/specs/`, with one directory per spec
- Each spec directory contains:
  - `requirements.md` (starting point)
  - `spec.md` (your deliverable)
  - `/assets` (design-related images)

### Process
1. **Work Part-by-Part**: `requirements.md` contains multiple Parts (e.g., "Part 1 - Database changes"). Complete one Part at a time, in order.

2. **Ask Clarifying Questions First**: Before writing anything in `spec.md`, ask questions to ensure complete understanding of the current Part.
   - Add a `## Questions` section under the current Part in `requirements.md`
   - Format each question with `**Answer:**` underneath for responses
   - Ask multiple rounds of questions if needed—leave NO gaps in understanding
   - Be explicit about assumptions, edge cases, error handling, and integration points with existing code
   - Be sure to view the images in the `/assets` folder, as they pertain to the design of what we're building, and ask any questions about those as well

3. **Document Your Understanding**: Once all questions are answered, write that Part in `spec.md`.
   - `spec.md` is a living document—you'll create and modify it as you progress through Parts
   - The spec should contain similar content to the `requirements.md` doc, but clarified and expanded where needed. Keep it lean. Do not bloat it with code examples (unless it is "usage" examples of an api, which could be useful)

4. **Final Critique**: After completing all Parts, create `spec-critique.md` with:
   - Analysis of potential problems (architecture, security, performance, maintainability, best practices)
   - Multiple options for addressing issues, always including "Do nothing - good as-is"
   - Rate the severity of each issue (Critical/Major/Minor) and the effort required for each option (High/Medium/Low)
   - If needed, based on my responses you will keep modifying the spec until we are happy with it
## Implementing a Spec

### Before You Start
- Read the `spec.md` file
- **Wait for explicit approval** to begin implementation
- Study the relevant codebase sections thoroughly
- Identify the project's coding style and follow it (do not impose your own preferences)
- Be choosy about leavings comments in code. Only leave a comment if it is a tricky part of the codebase or it explains *why* we have to do something. Avoid comments for sectioning code, obvious notes, etc.
- Be sure to follow any design files that are provided in the `/assets` folder, if there is one
- Our stack consists of: Next.js with TypeScript, Convex, Clerk (authentication), and Motion (animation). We are using CSS modules.
### During Implementation
- **Lint and typecheck frequently**—run checks before each commit
- **Commit atomically**: Each commit should represent one logical change
  - ✓ Good: "Add user_preferences table to schema"
  - ✗ Bad: "Update database, fix bugs, and add new feature"
- If you deviate from the spec during implementation, document why in the commit message and note it for post-implementation review