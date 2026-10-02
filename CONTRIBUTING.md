# Docs Contributing Guidelines

Welcome to the Mina Docs open source repository. Thank you for your interest in contributing to the [Mina Docs](https://docs.minaprotocol.com/) website. 

We realize that technical documentation is a high-visibility interface with you: our community and our users. We work hard to deliver well-written docs to help you discover, understand, and use the Mina Protocol and o1js.

We treat documentation like code. The Mina Docs use a docs-as-code workflow to develop and publish product documentation using the same tools and processes as software code development. All user-impacting updates on the codebase require corresponding updates to the relevant documentation in the docs repo. Developers who know the feature best write the first draft of content for all changes and new features. Feature documentation is part of our development “definition of done.”

By contributing, you can help us improve the functionality and user experience of the docs which in turn helps you build better projects. To ensure a smooth and effective collaboration, please follow these contribution guidelines.

## Style Guidance

Follow the style guidance in the [Docs Style Guide](https://github.com/o1-labs/docs2/wiki/Docs-Style-Guide) and recommended [Word List](https://github.com/o1-labs/docs2/wiki/Word-list) to ensure a consistent user experience. Look around. Match the style you see used in the rest of the project. 

## Get Involved

To learn about ways to participate and interact with community members, see [Online Communities](https://docs.minaprotocol.com/participate/online-communities). 

## Code of Conduct

All contributors agree to respect and follow the Mina Protocol [Code of Conduct](https://github.com/MinaProtocol/mina/blob/develop/CODE_OF_CONDUCT.md).

## Docs Toolset

The [Mina Docs](https://docs.minaprotocol.com/) website is published with the Docusaurus static site generator. The docs source files are written in Markdown `.mdx` files that support Markdown with embedded components through the JSX syntax extension to JavaScript. Docusaurus has built-in support for MDX that renders the JSX in Markdown files as React components. 

Even if you're unfamiliar with Markdown, you can still contribute to the docs in a helpful and meaningful way. Use [Markdown Basic Syntax](https://www.markdownguide.org/basic-syntax) and look at existing docs for models to follow. You can start contributing by submitting fixes for typos, spelling, and broken links. 

To build the docs locally during development, see the [README](README.md) file. 

## Using this repo

If you don't find what you are looking for or something in the docs is not working as expected, review existing [docs2 issues](https://github.com/o1-labs/docs2/issues/) on GitHub. Before you report a problem, take a look around and see if someone already opened an issue. If you are certain this is a new, unreported bug, submit a new issue to help us improve.

- One issue, one bug: Report a single bug per issue.
- If you're ready to fix a bug, it's fine to submit a pull request right away, but we still recommend filing an issue detailing what you're fixing. This workflow is helpful in case we don't accept that specific fix but want to keep track of the issue. 
- Provide steps to reproduce the bug, be sure to list all the steps necessary to reproduce the issue. 

## Reviewing Technical Content PRs

Some of the best content contributions come during the pull request (PR) review cycles. To ensure quality, follow best practices for technical content PR reviews just like you do for code reviews. When reviewing a pull request, the end-goal is to suggest useful changes to the author.

- For in-line suggestions, use the [GitHub suggesting feature](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/commenting-on-a-pull-request). 
- You can comment on one line or several lines. You can provide changes or edits, and the person who authored the PR can easily apply your change, or create their own competing suggestion, and you can discuss it. To invite others to the conversation, tag their GitHub @username in a comment to notify them. In this way, you can discuss any change. It’s transparent and inclusive.
- The PR owner can merge in your suggested commits one at a time or in batch (preferred).
- When you are providing a more granular extensive review that results a large number (more than 20) of in-line suggestions, work with the PR owner to develop a workflow. You might decide together that as a reviewer, you can check out the branch and make the changes yourself.

## Pull Requests (PRs)

You are welcome to provide a fix or update directly. We appreciate your contributions!

- For a simple fix to single page, you can select **EDIT THIS PAGE** at the top of the page to make changes to the file in a web browser. In the **Propose changes** section, you can follow the GitHub workflow to submit a PR.  

- If you're not a member or maintainer, fork the repo and then submit a PR from your forked repo to the `main` branch.

Provide a helpful, informative PR title that includes the context and page you are updating. Each PR must address only one issue or feature.

Start by creating a [draft pull request](https://github.blog/2019-02-14-introducing-draft-pull-requests/). Create your draft PR early, even if your work is just beginning or incomplete. Your draft PR indicates to the community that you're working on something and provides a space for conversations early in the development process. Merging is blocked for `Draft` PRs, so they provide a safe place to experiment and invite comments.

All pull requests must go through the code review process. As the PR submitter, you are responsible for addressing each comment and suggestion in the **Files changed** view during the review process.

- If you are a member of the docs repo, you can merge the approved PR.
- If your PR is a fork, the code maintainers will merge the approved PR.

### Mina releases

Node operator docs describe the current release. Describe what a feature does, not when it changed or what it did before.

For each Mina release:

1. Read the `changes/*.md` entries of the release in the [mina repository](https://github.com/MinaProtocol/mina/tree/master/changes). Update the pages for each change that affects operators: new or changed flags, environment variables, packages, tools, log messages, and defaults.
2. Update the release versions with `scripts/update_release_info.sh --mainnet-tag <tag> --devnet-tag <tag>`.
3. Regenerate the CLI reference with `scripts/generate-cli-reference.sh` against the installed release. The **Check CLI reference is up to date** workflow fails until you do this.
4. Run `npm run validate-docker-images` to check the image tags on the pages.
5. Run `npm run generate-llms-txt` and commit `static/llms-full.txt`.

### Code blocks from the example projects

A tutorial code block that shows code from an example project under `examples/` must not be a copy. Include it from the example source, so the page always shows the code that CI builds and tests.

1. In the example source, put the code between two marker comments. The region name uses letters, digits, `.`, `_` and `-`:

   ```ts
   // docs:start update
   @method async update(square: Field) {
     // ...
   }
   // docs:end update
   ```

   `# docs:start name` and `<!-- docs:start name -->` also work, for shell, YAML and HTML files. Regions can nest and overlap.

2. In the `.mdx` page, write the directive alone in its own paragraph, with blank lines before and after it. The path is relative to the repository root. `title="..."` is optional:

   ```md
   #include_code update examples/zkapps/01-hello-world/src/Square.ts ts title="src/Square.ts"
   ```

At build time, the directive becomes a fenced code block with the region's lines. The build removes the marker lines of that region and of all other regions inside it, removes the common indentation, and removes blank lines at the start and end. `static/llms-full.txt` gets the same code, so run `npm run generate-llms-txt` after you change an included region.

If the file or the region does not exist, or a region has no end, the build **fails** and names the page, the file and the region. It never shows an empty block. The resolver is `scripts/include-code.cjs`, and `npm run test:scripts` runs its tests.

### o1js Reference

The zkApp Developers > [o1js Reference](https://docs.minaprotocol.com/zkapps/o1js-reference) docs are generated content and are outside the scope of the Mina Docs repository.

Thank you for contributing to the Mina docs. It's better together.
