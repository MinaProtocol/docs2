# Changelog

The Mina Docs repository contains the source for the [Mina Docs](https://docs.minaprotocol.com/) website. 

We publish product documentation using the same tools and processes as software code development, but docs are not bound by release cycles. 

The published docs always contain the most up-to-date content available because doc changes are deployed to the live site immediately after a pull request (PR) is merged into the `main` branch. 

Because docs are a high-visibility interface with our community and our users, we work hard to deliver content to help you discover, understand, and use the Mina Protocol and o1js. We are a small team working fast to keep up with the documentation demands of a continuously changing product. The documentation is open source and anyone can [contribute to the docs](https://github.com/o1-labs/docs2/blob/main/CONTRIBUTING.md). 

## Devnet Upgrade

For Devnet upgrade docs, see [Devnet preview of the Mina Docs](https://docs2-git-major-upgrade-minadocs.vercel.app/).

## Major Upgrade to Berkeley 

Impactful changes related to the major upgrade include:

### Berkeley Upgrade 

## Added

- [How to prepare for the Berkeley Upgrade](https://docs.minaprotocol.com/berkeley-upgrade) 
- [Planning the Archive Migration](https://docs.minaprotocol.com/berkeley-upgrade/planning-archive-migration)
- [Mainnet to Berkeley Archive Migration](https://docs.minaprotocol.com/berkeley-upgrade/migrating-archive-database-to-berkeley)

## Changed

- Increased memory and storage requirements for [Block Producers](https://docs.minaprotocol.com/node-operators/block-producer-node/getting-started#block-producer-requirements)
    - 32 GB of RAM
    - 64 GB of free storage 
- Increased memory and storage requirements for [SNARK Workers](https://docs.minaprotocol.com/node-operators/snark-workers/getting-started)
    - 32 GB of RAM
    - 64 GB of free storage 
- Increased memory and storage requirements for [SNARK Coordinators](https://docs.minaprotocol.com/node-operators/snark-workers/getting-started#snark-coordinator-requirements)
    - 32 GB of RAM
    - 64 GB of free storage 

## zkApp Developer Docs

The [What's New in o1js](https://blog.o1labs.org/tagged/o1js) blog post series is the easiest way to keep up-to-date with zkApps. 

A complete list of updates is always available by viewing the [closed PRs](https://github.com/o1-labs/docs2/pulls?q=is%3Apr+is%3Aclosed).

Notable doc changes include:

### New

- [Testing zkApps with Lightnet](https://docs.minaprotocol.com/zkapps/testing-zkapps-lightnet)

### Changed

- All zkApp developer docs and tutorials are tested with the latest version of o1js and the zkApp CLI. When applicable, specific versions are verified in the README files for example code and tutorials.

### Fixed

- README files in the tutorial example directories provide accurate steps to run the code. [@LuffySama-Dev](https://github.com/LuffySama-Dev)
