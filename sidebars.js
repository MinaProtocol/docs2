module.exports = {
  docs: [
    "welcome",
    {
      type: "category",
      label: "About Mina",
      items: [
        "about-mina/overview",
        "about-mina/zero-knowledge-proofs",
        "about-mina/protocol-architecture",
        "about-mina/consensus",
        "about-mina/faq",
        {
          type: "link",
          label: "Whitepaper", // The link label
          href: "https://minaprotocol.com/wp-content/uploads/economicsWhitepaper.pdf", // The external URL
        },
      ],
    },
    {
      type: "category",
      label: "Using Mina",
      items: ["using-mina/install-wallet"],
    },
    {
      type: "category",
      label: "zkApp Developers",
      items: [
        "zkapps/overview",
        "zkapps/how-zkapps-work",
        "zkapps/how-to-write-a-zkapp",
        "zkapps/how-to-test-a-zkapp",
        "zkapps/how-to-deploy-a-zkapp",
        "zkapps/how-to-write-a-zkapp-ui",
        "zkapps/advanced-snarkyjs",
        {
          type: "category",
          label: "Step-by-Step Tutorials",
          items: [
            "zkapps/tutorial-anon-message-board",
          ],
        },
        "zkapps/zkapps-for-ethereum-developers",
        "zkapps/snarkyjs-reference",
      ],
    },
    {
      type: "category",
      label: "Node Operators",
      items: [
        "node-operators/getting-started",
        "node-operators/archive-node",
        "node-operators/archive-redundancy",
        "node-operators/delegation",
        "node-operators/delegation-tiebreak",
        "node-operators/bp-sidecar",
        "node-operators/uptime-system",
        "node-operators/client-sdk",
        "node-operators/operating-for-data",
        "node-operators/connecting-devnet",
        "node-operators/hardfork",
        "node-operators/hot-cold-block-production",
        "node-operators/ledger-app-mina",
        "node-operators/rosetta",
        "node-operators/proof-of-stake",
        "node-operators/snark-workers",
        "node-operators/scan-state",
        "node-operators/timelock",
        "node-operators/block-producers",
        "node-operators/whats-in-a-block",
        "node-operators/lifecycle-payment",
        "node-operators/seed-peers",
        "node-operators/staking-service-guidelines",
        "node-operators/troubleshooting",
        "node-operators/faq",
        "node-operators/keypair",
        "node-operators/connecting",
        "node-operators/send-payment",
        "node-operators/staking",
        "node-operators/cli-reference",
      ],
    },
    {
      type: "category",
      label: "Node Developers",
      items: [
        "node-developers/overview",
      ],
    },
    {
      type: "category",
      label: "Participate",
      items: [
        "participate/grants-and-programs",
        "participate/online-communities",
        "participate/careers",
        "participate/github",
        "participate/bug-bounty-program",
      ],
    },
    "mina-glossary",
  ],
};
