module.exports = {
  docs: [
    'welcome',
    {
      type: 'link',
      label: 'About Mina',
      href: 'https://minaprotocol.com/about',
    },
    {
      type: 'category',
      label: 'Network Upgrades',
      link: {
        type: 'doc',
        id: 'network-upgrades/index',
      },
      items: [
        {
          type: 'category',
          label: 'Berkeley Upgrade',
          link: {
            type: 'doc',
            id: 'network-upgrades/berkeley/index',
          },
          items: [
            'network-upgrades/berkeley/requirements',
            {
              type: 'category',
              label: 'Archive Migration',
              link: {
                type: 'doc',
                id: 'network-upgrades/berkeley/archive-migration/index',
              },
              items: [
                'network-upgrades/berkeley/archive-migration/understanding-archive-migration',
                'network-upgrades/berkeley/archive-migration/archive-migration-prerequisites',
                'network-upgrades/berkeley/archive-migration/archive-migration-installation',
                'network-upgrades/berkeley/archive-migration/migrating-archive-database-to-berkeley',
                'network-upgrades/berkeley/archive-migration/mainnet-database-maintenance',
                'network-upgrades/berkeley/archive-migration/debian-example',
                'network-upgrades/berkeley/archive-migration/docker-example',
                'network-upgrades/berkeley/archive-migration/appendix',
              ],
            },
            'network-upgrades/berkeley/upgrade-steps',
            'network-upgrades/berkeley/flags-configs',
            'network-upgrades/berkeley/appendix',
          ],
        },
        {
          type: 'category',
          label: 'Mesa Upgrade',
          link: {
            type: 'doc',
            id: 'network-upgrades/mesa/index',
          },
          items: [
            'network-upgrades/mesa/requirements',
            'network-upgrades/mesa/upgrade-modes',
            'network-upgrades/mesa/fork-schedule',
            {
              type: 'category',
              label: 'Upgrade Steps',
              link: {
                type: 'doc',
                id: 'network-upgrades/mesa/upgrade-steps/index',
              },
              items: [
                'network-upgrades/mesa/upgrade-steps/state-finalization',
                'network-upgrades/mesa/upgrade-steps/upgrade',
                'network-upgrades/mesa/upgrade-steps/post-upgrade',
                'network-upgrades/mesa/upgrade-steps/examples',
              ],
            },
            'network-upgrades/mesa/archive-upgrade',
            'network-upgrades/mesa/preflight-network',
            'network-upgrades/mesa/troubleshooting',
            {
              type: 'category',
              label: 'Appendix',
              items: [
                'network-upgrades/mesa/appendix/archive-node-schema-changes',
                'network-upgrades/mesa/appendix/upgrade-modes-details',
                'network-upgrades/mesa/appendix/automode-docker-compose-quickstart',
              ],
            },
            'network-upgrades/mesa/glossary',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Using Mina',
      link: {
        type: 'doc',
        id: 'using-mina/install-a-wallet',
      },
      items: [
        'using-mina/install-a-wallet',
        'using-mina/ledger-hardware-wallet',
        'using-mina/how-to-send-and-receive',
        'using-mina/how-to-delegate',
        'using-mina/how-to-use-zkapp',
        'using-mina/Protect-Your-MINA',
      ],
    },
    {
      type: 'category',
      label: 'zkApp Developers',
      link: {
        type: 'doc',
        id: 'zkapps/zkapp-development-frameworks',
      },
      items: [
  {
          type: 'category',
          label: 'protokit',
          link: {
            type: 'doc',
            id: 'zkapps/protokit',
          },
          items: [
            'zkapps/protokit',
],
        },
        {
          type: 'category',
          label: 'o1js',
          link: {
            type: 'doc',
            id: 'zkapps/o1js/index',
          },
          items: [
            'zkapps/o1js/index',
            'zkapps/o1js/basic-concepts',
            'zkapps/o1js/circuit-writing-primer',
            'zkapps/o1js/gadgets',
            'zkapps/o1js/bitwise-operations',
            'zkapps/o1js/foreign-fields',
            'zkapps/o1js/indexed-merkle-map',
            'zkapps/o1js/ecdsa',
          ],
        },
        {
          type: 'category',
          label: 'zkApps',
          link: {
            type: 'doc',
            id: 'zkapps/writing-a-zkapp/index',
          },
          items: [
            'zkapps/writing-a-zkapp/index',
            {
              type: 'category',
              label: 'Introduction to zkApps',
              link: {
                type: 'doc',
                id: 'zkapps/writing-a-zkapp/introduction-to-zkapps/getting-started-zkapps',
              },
              items: [
                'zkapps/writing-a-zkapp/introduction-to-zkapps/install-zkapp-cli',
                'zkapps/writing-a-zkapp/introduction-to-zkapps/getting-started-zkapps',
                'zkapps/writing-a-zkapp/introduction-to-zkapps/how-to-write-a-zkapp',
                'zkapps/writing-a-zkapp/introduction-to-zkapps/testing-zkapps-lightnet',
                'zkapps/writing-a-zkapp/introduction-to-zkapps/how-to-deploy-a-zkapp',
                'zkapps/writing-a-zkapp/introduction-to-zkapps/how-to-write-a-zkapp-ui',
                'zkapps/writing-a-zkapp/introduction-to-zkapps/interact-with-mina',
                'zkapps/writing-a-zkapp/introduction-to-zkapps/secure-zkapps',
              ],
            },
            {
              type: 'category',
              label: 'Feature Overview',
              link: {
                type: 'doc',
                id: 'zkapps/writing-a-zkapp/feature-overview/offchain-storage',
              },
              items: [
                'zkapps/writing-a-zkapp/feature-overview/offchain-storage',
                'zkapps/writing-a-zkapp/feature-overview/fetch-events-and-actions',
                'zkapps/writing-a-zkapp/feature-overview/time-locked-accounts',
                'zkapps/writing-a-zkapp/feature-overview/custom-tokens',
              ],
            },
          ],
        },
        {
          type: 'category',
          label: 'Advanced',
          link: {
            type: 'doc',
            id: 'zkapps/advanced/experimental',
          },
          items: [
            'zkapps/advanced/experimental',
            'zkapps/advanced/zkapps-for-ethereum-developers',
          ],
        },
        {
          type: 'category',
          label: 'Front End Integration Guides',
          link: {
            type: 'doc',
            id: 'zkapps/front-end-integration-guides/angular',
          },
          items: [
            'zkapps/front-end-integration-guides/angular',
            'zkapps/front-end-integration-guides/next',
          ],
        },
        {
          type: 'category',
          label: 'Tutorials',
          link: {
            type: 'doc',
            id: 'zkapps/tutorials/index',
          },
          items: [
            'zkapps/tutorials/index',
            'zkapps/tutorials/hello-world',
            'zkapps/tutorials/private-inputs-hash-functions',
            'zkapps/tutorials/deploying-to-a-network',
            'zkapps/tutorials/zkapp-ui-with-react',
            'zkapps/tutorials/common-types-and-functions',
            'zkapps/tutorials/oracle',
            'zkapps/tutorials/recursion',
            'zkapps/tutorials/account-updates',
            'zkapps/tutorials/anonymous-message-board',
            'zkapps/tutorials/interacting-with-zkapps-server-side',
          ],
        },
        'zkapps/roadmap',
        'zkapps/faq',
        'zkapps/standards',
      ],
    },
    {
      type: 'category',
      label: 'Mina Protocol',
      link: {
        type: 'doc',
        id: 'mina-protocol/index',
      },
      items: [
        'mina-protocol/proof-of-stake',
        'mina-protocol/whats-in-a-block',
        'mina-protocol/block-producers',
        'mina-protocol/snark-workers',
        'mina-protocol/scan-state',
        'mina-protocol/time-locked-accounts',
        'mina-protocol/sending-a-payment',
        'mina-protocol/lifecycle-of-a-payment',
      ],
    },
    {
      type: 'category',
      label: 'Node Operators',
      link: {
        type: 'doc',
        id: 'node-operators/index',
      },
      items: [
        {
          type: 'category',
          label: 'Validators',
          link: {
            type: 'doc',
            id: 'node-operators/validator-node/index',
          },
          items: [
            'node-operators/validator-node/requirements',
            'node-operators/validator-node/installing-on-ubuntu-and-debian',
            'node-operators/validator-node/generating-a-keypair',
            'node-operators/validator-node/connecting-to-the-network',
            'node-operators/validator-node/querying-data',
            'node-operators/validator-node/staking-and-snarking',
            'node-operators/validator-node/logging',
          ],
        },
        {
          type: 'category',
          label: 'Block Producers',
          link: {
            type: 'doc',
            id: 'node-operators/block-producer-node/index',
          },
          items: [
            'node-operators/block-producer-node/getting-started',
            'node-operators/block-producer-node/hot-cold-block-production',
            'node-operators/block-producer-node/staking-service-guidelines',
            'node-operators/block-producer-node/docker-compose',
          ],
        },
        {
          type: 'category',
          label: 'SNARK Coordinator & Workers',
          link: {
            type: 'doc',
            id: 'node-operators/snark-workers/index',
          },
          items: [
            'node-operators/snark-workers/getting-started',
            'node-operators/snark-workers/docker-compose',
          ],
        },
        {
          type: 'category',
          label: 'Archive Nodes',
          link: {
            type: 'doc',
            id: 'node-operators/archive-node/index',
          },
          items: [
            'node-operators/archive-node/getting-started',
            'node-operators/archive-node/archive-redundancy',
            'node-operators/archive-node/backfilling-missing-blocks',
            'node-operators/archive-node/docker-compose',
            'node-operators/archive-node/replayer',
          ],
        },
        {
          type: 'category',
          label: 'Seed Node',
          link: {
            type: 'doc',
            id: 'node-operators/seed-peers/index',
          },
          items: [
            'node-operators/seed-peers/getting-started',
            'node-operators/seed-peers/generating-a-libp2p-keypair',
            'node-operators/seed-peers/docker-compose',
          ],
        },
        {
          type: 'category',
          label: 'Data and History',
          link: {
            type: 'doc',
            id: 'node-operators/data-and-history/index',
          },
          items: ['node-operators/data-and-history/rosetta'],
        },
        {
          type: 'category',
          label: 'Rosetta API',
          items: [
            'node-operators/rosetta/run-with-docker',
            'node-operators/rosetta/docker-compose',
            'node-operators/rosetta/build-from-sources',
            {
              type: 'category',
              label: 'Code Samples',
              link: {
                type: 'doc',
                id: 'node-operators/rosetta/samples/index',
              },
              items: [
                'node-operators/rosetta/samples/requests',
                'node-operators/rosetta/samples/scan-blocks',
                'node-operators/rosetta/samples/track-deposits',
                'node-operators/rosetta/samples/send-transactions',
              ],
            },
          ],
        },
        {
          type: 'category',
          label: 'Delegation Program',
          link: {
            type: 'doc',
            id: 'node-operators/delegation-program/index',
          },
          items: [
            'node-operators/delegation-program/foundation-delegation-program',
            'node-operators/delegation-program/uptime-tracking-system',
          ],
        },
        'node-operators/mina-signer',
        'node-operators/reference/mina-cli-reference',
        'node-operators/downgrading-to-older-versions',
        'node-operators/troubleshooting',
        'node-operators/faq',
      ],
    },
    {
      type: 'doc',
      label: 'Exchange Operators',
      id: 'node-operators/exchange-operators',
    },
    {
      type: 'category',
      label: 'Node Developers',
      link: {
        type: 'doc',
        id: 'node-developers/index',
      },
      items: [
        'node-developers/codebase-overview',
        'node-developers/repository-structure',
        'node-developers/bip44',
        'node-developers/code-review-guidelines',
        'node-developers/style-guide',
        'node-developers/sandbox-node',
        'node-developers/graphql-api',
        'node-developers/contributing',
      ],
    },
    {
      type: 'category',
      label: 'Developer Tools',
      items: ['mina-signer'],
    },
    {
      type: 'category',
      label: 'Participate',
      items: [
        {
          type: 'link',
          label: 'Online Communities',
          href: 'https://minaprotocol.com/community',
        },
        {
          type: 'link',
          label: 'Apply for Grants',
          href: 'https://minaprotocol.com/blog/mina-developers-grants',
        },
        'participate/office-hours',
        'participate/careers',
        'participate/github',
        'participate/bugs-and-feature-requests',
      ],
    },
    {
      type: 'doc',
      label: 'Mina Security',
      id: 'mina-security',
    },
    'glossary',
  ],
};
