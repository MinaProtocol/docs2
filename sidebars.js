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
      label: 'Berkeley Upgrade',
      link: {
        type: 'doc',
        id: 'berkeley-upgrade/requirements',
      },
      items: [
        {
          type: 'category',
          label: 'Archive Migration',
          link: {
            type: 'doc',
            id: 'berkeley-upgrade/archive-migration/index',
          },
          items: [
            'berkeley-upgrade/archive-migration/understanding-archive-migration',
            'berkeley-upgrade/archive-migration/archive-migration-prerequisites',
            'berkeley-upgrade/archive-migration/archive-migration-installation',
            'berkeley-upgrade/archive-migration/migrating-archive-database-to-berkeley',
            'berkeley-upgrade/archive-migration/mainnet-database-maintenance',
            'berkeley-upgrade/archive-migration/debian-example',
            'berkeley-upgrade/archive-migration/docker-example',
            'berkeley-upgrade/archive-migration/appendix',
          ],
        },
        'berkeley-upgrade/upgrade-steps',
        'berkeley-upgrade/flags-configs',
        'berkeley-upgrade/appendix',
      ],
    },
    {
      type: 'category',
      label: 'Mesa Upgrade',
      link: {
        type: 'doc',
        id: 'mesa-upgrade/mesa-upgrade-overview',
      },
      items: [
        'mesa-upgrade/mesa-upgrade-overview',
        'mesa-upgrade/preflight-network',
        'mesa-upgrade/archive-upgrade',
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
          label: 'o1js',
          link: {
            type: 'doc',
            id: 'zkapps/o1js/index',
          },
          items: [
            'zkapps/o1js/index',
            'zkapps/o1js/basic-concepts',
            'zkapps/o1js/recursion',
            'zkapps/o1js/circuit-writing-primer',
            'zkapps/o1js/gadgets',
            'zkapps/o1js/bitwise-operations',
            'zkapps/o1js/foreign-fields',
            'zkapps/o1js/merkle-tree',
            'zkapps/o1js/indexed-merkle-map',
            'zkapps/o1js/keccak',
            'zkapps/o1js/ecdsa',
            'zkapps/o1js/sha256',
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
                id: 'zkapps/writing-a-zkapp/introduction-to-zkapps/how-zkapps-work',
              },
              items: [
                'zkapps/writing-a-zkapp/introduction-to-zkapps/how-zkapps-work',
                'zkapps/writing-a-zkapp/introduction-to-zkapps/install-zkapp-cli',
                'zkapps/writing-a-zkapp/introduction-to-zkapps/getting-started-zkapps',
                'zkapps/writing-a-zkapp/introduction-to-zkapps/how-to-write-a-zkapp',
                'zkapps/writing-a-zkapp/introduction-to-zkapps/testing-zkapps-locally',
                'zkapps/writing-a-zkapp/introduction-to-zkapps/testing-zkapps-lightnet',
                'zkapps/writing-a-zkapp/introduction-to-zkapps/how-to-deploy-a-zkapp',
                'zkapps/writing-a-zkapp/introduction-to-zkapps/how-to-write-a-zkapp-ui',
                'zkapps/writing-a-zkapp/introduction-to-zkapps/smart-contracts',
                'zkapps/writing-a-zkapp/introduction-to-zkapps/interact-with-mina',
                'zkapps/writing-a-zkapp/introduction-to-zkapps/secure-zkapps',
              ],
            },
            {
              type: 'category',
              label: 'Feature Overview',
              link: {
                type: 'doc',
                id: 'zkapps/writing-a-zkapp/feature-overview/on-chain-values',
              },
              items: [
                'zkapps/writing-a-zkapp/feature-overview/on-chain-values',
                'zkapps/writing-a-zkapp/feature-overview/offchain-storage',
                'zkapps/writing-a-zkapp/feature-overview/permissions',
                'zkapps/writing-a-zkapp/feature-overview/upgradability',
                'zkapps/writing-a-zkapp/feature-overview/events',
                'zkapps/writing-a-zkapp/feature-overview/actions-and-reducer',
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
        {
          type: 'category',
          label: 'o1js Reference',
          items: [
            {
              type: 'doc',
              id: 'zkapps/o1js-reference/README',
              label: 'Introduction',
            },
            {
              type: 'category',
              label: 'Classes',
              items: [
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/classes/AccountUpdate',
                  label: 'AccountUpdate',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/classes/AccountUpdateForest',
                  label: 'AccountUpdateForest',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/classes/AccountUpdateTree',
                  label: 'AccountUpdateTree',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/classes/AlmostForeignField',
                  label: 'AlmostForeignField',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/classes/BaseMerkleWitness',
                  label: 'BaseMerkleWitness',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/classes/Bool',
                  label: 'Bool',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/classes/CanonicalForeignField',
                  label: 'CanonicalForeignField',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/classes/Character',
                  label: 'Character',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/classes/Circuit',
                  label: 'Circuit',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/classes/CircuitString',
                  label: 'CircuitString',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/classes/DynamicProof',
                  label: 'DynamicProof',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/classes/EcdsaSignature',
                  label: 'EcdsaSignature',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/classes/Field',
                  label: 'Field',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/classes/ForeignCurve',
                  label: 'ForeignCurve',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/classes/ForeignField',
                  label: 'ForeignField',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/classes/Group',
                  label: 'Group',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/classes/Hashed',
                  label: 'Hashed',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/classes/Int64',
                  label: 'Int64',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/classes/Keypair',
                  label: 'Keypair',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/classes/Ledger',
                  label: 'Ledger',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/classes/MerkleList',
                  label: 'MerkleList',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/classes/MerkleListIterator',
                  label: 'MerkleListIterator',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/classes/MerkleMap',
                  label: 'MerkleMap',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/classes/MerkleMapWitness',
                  label: 'MerkleMapWitness',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/classes/MerkleTree',
                  label: 'MerkleTree',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/classes/Nullifier',
                  label: 'Nullifier',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/classes/Packed',
                  label: 'Packed',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/classes/PrivateKey',
                  label: 'PrivateKey',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/classes/Proof',
                  label: 'Proof',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/classes/ProofBase',
                  label: 'ProofBase',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/classes/PublicKey',
                  label: 'PublicKey',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/classes/Scalar',
                  label: 'Scalar',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/classes/ScalarField',
                  label: 'ScalarField',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/classes/SelfProof',
                  label: 'SelfProof',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/classes/Sign',
                  label: 'Sign',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/classes/Signature',
                  label: 'Signature',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/classes/SmartContract',
                  label: 'SmartContract',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/classes/TokenAccountUpdateIterator',
                  label: 'TokenAccountUpdateIterator',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/classes/TokenContract',
                  label: 'TokenContract',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/classes/TokenSymbol',
                  label: 'TokenSymbol',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/classes/UInt32',
                  label: 'UInt32',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/classes/UInt64',
                  label: 'UInt64',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/classes/UInt8',
                  label: 'UInt8',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/classes/Unconstrained',
                  label: 'Unconstrained',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/classes/VerificationKey',
                  label: 'VerificationKey',
                },
              ],
            },
            {
              type: 'category',
              label: 'Functions',
              items: [
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/functions/Bytes',
                  label: 'Bytes',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/functions/ConstantField',
                  label: 'ConstantField',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/functions/MerkleListBase',
                  label: 'MerkleListBase',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/functions/MerkleWitness',
                  label: 'MerkleWitness',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/functions/Option',
                  label: 'Option',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/functions/Reducer',
                  label: 'Reducer',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/functions/State',
                  label: 'State',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/functions/Struct',
                  label: 'Struct',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/functions/VarField',
                  label: 'VarField',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/functions/WithHash',
                  label: 'WithHash',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/functions/ZkProgram',
                  label: 'ZkProgram',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/functions/addCachedAccount',
                  label: 'addCachedAccount',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/functions/assert',
                  label: 'assert',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/functions/checkBitLength',
                  label: 'checkBitLength',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/functions/checkZkappTransaction',
                  label: 'checkZkappTransaction',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/functions/circuitMain',
                  label: 'circuitMain',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/functions/conditionalSwap',
                  label: 'conditionalSwap',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/functions/createEcdsa',
                  label: 'createEcdsa',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/functions/createForeignCurve',
                  label: 'createForeignCurve',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/functions/createForeignField',
                  label: 'createForeignField',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/functions/declareMethods',
                  label: 'declareMethods',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/functions/declareState',
                  label: 'declareState',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/functions/fetchAccount',
                  label: 'fetchAccount',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/functions/fetchEvents',
                  label: 'fetchEvents',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/functions/fetchLastBlock',
                  label: 'fetchLastBlock',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/functions/fetchTransactionStatus',
                  label: 'fetchTransactionStatus',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/functions/genericHash',
                  label: 'genericHash',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/functions/initializeBindings',
                  label: 'initializeBindings',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/functions/merkleListHash',
                  label: 'merkleListHash',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/functions/method',
                  label: 'method',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/functions/provable',
                  label: 'provable',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/functions/provablePure',
                  label: 'provablePure',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/functions/public',
                  label: 'public',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/functions/readVarMessage',
                  label: 'readVarMessage',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/functions/sendZkapp',
                  label: 'sendZkapp',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/functions/setArchiveGraphqlEndpoint',
                  label: 'setArchiveGraphqlEndpoint',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/functions/setGraphqlEndpoint',
                  label: 'setGraphqlEndpoint',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/functions/setGraphqlEndpoints',
                  label: 'setGraphqlEndpoints',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/functions/setNumberOfWorkers',
                  label: 'setNumberOfWorkers',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/functions/state-1',
                  label: 'state-1',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/functions/toConstantField',
                  label: 'toConstantField',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/functions/toFp',
                  label: 'toFp',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/functions/verify',
                  label: 'verify',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/functions/withHashes',
                  label: 'withHashes',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/functions/withMessage',
                  label: 'withMessage',
                },
              ],
            },
            {
              type: 'category',
              label: 'Interfaces',
              items: [
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/interfaces/Permissions',
                  label: 'Permissions',
                },
              ],
            },
            {
              type: 'category',
              label: 'Namespaces',
              items: [
                {
                  type: 'category',
                  label: 'Crypto',
                  items: [
                    {
                      type: 'doc',
                      id: 'zkapps/o1js-reference/namespaces/Crypto/README',
                      label: 'README',
                    },
                    {
                      type: 'category',
                      label: 'Type-Aliases',
                      items: [
                        {
                          type: 'doc',
                          id: 'zkapps/o1js-reference/namespaces/Crypto/type-aliases/Curve',
                          label: 'Curve',
                        },
                        {
                          type: 'doc',
                          id: 'zkapps/o1js-reference/namespaces/Crypto/type-aliases/CurveParams',
                          label: 'CurveParams',
                        },
                      ],
                    },
                  ],
                },
                {
                  type: 'category',
                  label: 'Encryption',
                  items: [
                    {
                      type: 'doc',
                      id: 'zkapps/o1js-reference/namespaces/Encryption/README',
                      label: 'README',
                    },
                    {
                      type: 'category',
                      label: 'Functions',
                      items: [
                        {
                          type: 'doc',
                          id: 'zkapps/o1js-reference/namespaces/Encryption/functions/decrypt',
                          label: 'decrypt',
                        },
                        {
                          type: 'doc',
                          id: 'zkapps/o1js-reference/namespaces/Encryption/functions/decryptBytes',
                          label: 'decryptBytes',
                        },
                        {
                          type: 'doc',
                          id: 'zkapps/o1js-reference/namespaces/Encryption/functions/encrypt',
                          label: 'encrypt',
                        },
                        {
                          type: 'doc',
                          id: 'zkapps/o1js-reference/namespaces/Encryption/functions/encryptBytes',
                          label: 'encryptBytes',
                        },
                      ],
                    },
                    {
                      type: 'category',
                      label: 'Type-Aliases',
                      items: [
                        {
                          type: 'doc',
                          id: 'zkapps/o1js-reference/namespaces/Encryption/type-aliases/CipherText',
                          label: 'CipherText',
                        },
                        {
                          type: 'doc',
                          id: 'zkapps/o1js-reference/namespaces/Encryption/type-aliases/CipherTextBytes',
                          label: 'CipherTextBytes',
                        },
                      ],
                    },
                  ],
                },
                {
                  type: 'category',
                  label: 'Experimental',
                  items: [
                    {
                      type: 'doc',
                      id: 'zkapps/o1js-reference/namespaces/Experimental/README',
                      label: 'README',
                    },
                    {
                      type: 'category',
                      label: 'Classes',
                      items: [
                        {
                          type: 'doc',
                          id: 'zkapps/o1js-reference/namespaces/Experimental/classes/BatchReducer',
                          label: 'BatchReducer',
                        },
                        {
                          type: 'doc',
                          id: 'zkapps/o1js-reference/namespaces/Experimental/classes/OffchainStateCommitments',
                          label: 'OffchainStateCommitments',
                        },
                      ],
                    },
                    {
                      type: 'category',
                      label: 'Functions',
                      items: [
                        {
                          type: 'doc',
                          id: 'zkapps/o1js-reference/namespaces/Experimental/functions/ActionBatch',
                          label: 'ActionBatch',
                        },
                        {
                          type: 'doc',
                          id: 'zkapps/o1js-reference/namespaces/Experimental/functions/IndexedMerkleMap',
                          label: 'IndexedMerkleMap',
                        },
                        {
                          type: 'doc',
                          id: 'zkapps/o1js-reference/namespaces/Experimental/functions/OffchainState',
                          label: 'OffchainState',
                        },
                        {
                          type: 'doc',
                          id: 'zkapps/o1js-reference/namespaces/Experimental/functions/memoizeWitness',
                          label: 'memoizeWitness',
                        },
                      ],
                    },
                    {
                      type: 'category',
                      label: 'Type-Aliases',
                      items: [
                        {
                          type: 'doc',
                          id: 'zkapps/o1js-reference/namespaces/Experimental/type-aliases/ActionBatch',
                          label: 'ActionBatch',
                        },
                        {
                          type: 'doc',
                          id: 'zkapps/o1js-reference/namespaces/Experimental/type-aliases/IndexedMerkleMap',
                          label: 'IndexedMerkleMap',
                        },
                      ],
                    },
                  ],
                },
                {
                  type: 'category',
                  label: 'Lightnet',
                  items: [
                    {
                      type: 'doc',
                      id: 'zkapps/o1js-reference/namespaces/Lightnet/README',
                      label: 'README',
                    },
                    {
                      type: 'category',
                      label: 'Functions',
                      items: [
                        {
                          type: 'doc',
                          id: 'zkapps/o1js-reference/namespaces/Lightnet/functions/acquireKeyPair',
                          label: 'acquireKeyPair',
                        },
                        {
                          type: 'doc',
                          id: 'zkapps/o1js-reference/namespaces/Lightnet/functions/listAcquiredKeyPairs',
                          label: 'listAcquiredKeyPairs',
                        },
                        {
                          type: 'doc',
                          id: 'zkapps/o1js-reference/namespaces/Lightnet/functions/releaseKeyPair',
                          label: 'releaseKeyPair',
                        },
                      ],
                    },
                  ],
                },
                {
                  type: 'category',
                  label: 'Mina',
                  items: [
                    {
                      type: 'doc',
                      id: 'zkapps/o1js-reference/namespaces/Mina/README',
                      label: 'README',
                    },
                    {
                      type: 'category',
                      label: 'Functions',
                      items: [
                        {
                          type: 'doc',
                          id: 'zkapps/o1js-reference/namespaces/Mina/functions/LocalBlockchain',
                          label: 'LocalBlockchain',
                        },
                        {
                          type: 'doc',
                          id: 'zkapps/o1js-reference/namespaces/Mina/functions/Network',
                          label: 'Network',
                        },
                        {
                          type: 'doc',
                          id: 'zkapps/o1js-reference/namespaces/Mina/functions/TestPublicKey',
                          label: 'TestPublicKey',
                        },
                        {
                          type: 'doc',
                          id: 'zkapps/o1js-reference/namespaces/Mina/functions/currentSlot',
                          label: 'currentSlot',
                        },
                        {
                          type: 'doc',
                          id: 'zkapps/o1js-reference/namespaces/Mina/functions/currentTransaction',
                          label: 'currentTransaction',
                        },
                        {
                          type: 'doc',
                          id: 'zkapps/o1js-reference/namespaces/Mina/functions/faucet',
                          label: 'faucet',
                        },
                        {
                          type: 'doc',
                          id: 'zkapps/o1js-reference/namespaces/Mina/functions/fetchActions',
                          label: 'fetchActions',
                        },
                        {
                          type: 'doc',
                          id: 'zkapps/o1js-reference/namespaces/Mina/functions/fetchEvents',
                          label: 'fetchEvents',
                        },
                        {
                          type: 'doc',
                          id: 'zkapps/o1js-reference/namespaces/Mina/functions/filterGroups',
                          label: 'filterGroups',
                        },
                        {
                          type: 'doc',
                          id: 'zkapps/o1js-reference/namespaces/Mina/functions/getAccount',
                          label: 'getAccount',
                        },
                        {
                          type: 'doc',
                          id: 'zkapps/o1js-reference/namespaces/Mina/functions/getActions',
                          label: 'getActions',
                        },
                        {
                          type: 'doc',
                          id: 'zkapps/o1js-reference/namespaces/Mina/functions/getBalance',
                          label: 'getBalance',
                        },
                        {
                          type: 'doc',
                          id: 'zkapps/o1js-reference/namespaces/Mina/functions/getNetworkConstants',
                          label: 'getNetworkConstants',
                        },
                        {
                          type: 'doc',
                          id: 'zkapps/o1js-reference/namespaces/Mina/functions/getNetworkId',
                          label: 'getNetworkId',
                        },
                        {
                          type: 'doc',
                          id: 'zkapps/o1js-reference/namespaces/Mina/functions/getNetworkState',
                          label: 'getNetworkState',
                        },
                        {
                          type: 'doc',
                          id: 'zkapps/o1js-reference/namespaces/Mina/functions/getProofsEnabled',
                          label: 'getProofsEnabled',
                        },
                        {
                          type: 'doc',
                          id: 'zkapps/o1js-reference/namespaces/Mina/functions/hasAccount',
                          label: 'hasAccount',
                        },
                        {
                          type: 'doc',
                          id: 'zkapps/o1js-reference/namespaces/Mina/functions/sender',
                          label: 'sender',
                        },
                        {
                          type: 'doc',
                          id: 'zkapps/o1js-reference/namespaces/Mina/functions/setActiveInstance',
                          label: 'setActiveInstance',
                        },
                        {
                          type: 'doc',
                          id: 'zkapps/o1js-reference/namespaces/Mina/functions/transaction',
                          label: 'transaction',
                        },
                        {
                          type: 'doc',
                          id: 'zkapps/o1js-reference/namespaces/Mina/functions/waitForFunding',
                          label: 'waitForFunding',
                        },
                      ],
                    },
                    {
                      type: 'category',
                      label: 'Namespaces',
                      items: [
                        {
                          type: 'category',
                          label: 'TestPublicKey',
                          items: [
                            {
                              type: 'doc',
                              id: 'zkapps/o1js-reference/namespaces/Mina/namespaces/TestPublicKey/README',
                              label: 'README',
                            },
                            {
                              type: 'category',
                              label: 'Functions',
                              items: [
                                {
                                  type: 'doc',
                                  id: 'zkapps/o1js-reference/namespaces/Mina/namespaces/TestPublicKey/functions/fromBase58',
                                  label: 'fromBase58',
                                },
                                {
                                  type: 'doc',
                                  id: 'zkapps/o1js-reference/namespaces/Mina/namespaces/TestPublicKey/functions/random',
                                  label: 'random',
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: 'category',
                          label: 'Transaction',
                          items: [
                            {
                              type: 'doc',
                              id: 'zkapps/o1js-reference/namespaces/Mina/namespaces/Transaction/README',
                              label: 'README',
                            },
                            {
                              type: 'category',
                              label: 'Functions',
                              items: [
                                {
                                  type: 'doc',
                                  id: 'zkapps/o1js-reference/namespaces/Mina/namespaces/Transaction/functions/fromJSON',
                                  label: 'fromJSON',
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                    {
                      type: 'category',
                      label: 'Type-Aliases',
                      items: [
                        {
                          type: 'doc',
                          id: 'zkapps/o1js-reference/namespaces/Mina/type-aliases/ActionStates',
                          label: 'ActionStates',
                        },
                        {
                          type: 'doc',
                          id: 'zkapps/o1js-reference/namespaces/Mina/type-aliases/FeePayerSpec',
                          label: 'FeePayerSpec',
                        },
                        {
                          type: 'doc',
                          id: 'zkapps/o1js-reference/namespaces/Mina/type-aliases/IncludedTransaction',
                          label: 'IncludedTransaction',
                        },
                        {
                          type: 'doc',
                          id: 'zkapps/o1js-reference/namespaces/Mina/type-aliases/NetworkConstants',
                          label: 'NetworkConstants',
                        },
                        {
                          type: 'doc',
                          id: 'zkapps/o1js-reference/namespaces/Mina/type-aliases/PendingTransaction',
                          label: 'PendingTransaction',
                        },
                        {
                          type: 'doc',
                          id: 'zkapps/o1js-reference/namespaces/Mina/type-aliases/PendingTransactionPromise',
                          label: 'PendingTransactionPromise',
                        },
                        {
                          type: 'doc',
                          id: 'zkapps/o1js-reference/namespaces/Mina/type-aliases/PendingTransactionStatus',
                          label: 'PendingTransactionStatus',
                        },
                        {
                          type: 'doc',
                          id: 'zkapps/o1js-reference/namespaces/Mina/type-aliases/RejectedTransaction',
                          label: 'RejectedTransaction',
                        },
                        {
                          type: 'doc',
                          id: 'zkapps/o1js-reference/namespaces/Mina/type-aliases/TestPublicKey',
                          label: 'TestPublicKey',
                        },
                        {
                          type: 'doc',
                          id: 'zkapps/o1js-reference/namespaces/Mina/type-aliases/Transaction',
                          label: 'Transaction',
                        },
                      ],
                    },
                    {
                      type: 'category',
                      label: 'Variables',
                      items: [
                        {
                          type: 'doc',
                          id: 'zkapps/o1js-reference/namespaces/Mina/variables/activeInstance',
                          label: 'activeInstance',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              type: 'category',
              label: 'Type-Aliases',
              items: [
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/type-aliases/Account',
                  label: 'Account',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/type-aliases/Bool',
                  label: 'Bool',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/type-aliases/BoolVar',
                  label: 'BoolVar',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/type-aliases/Bytes',
                  label: 'Bytes',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/type-aliases/Cache',
                  label: 'Cache',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/type-aliases/CacheHeader',
                  label: 'CacheHeader',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/type-aliases/ConstantField',
                  label: 'ConstantField',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/type-aliases/DeployArgs',
                  label: 'DeployArgs',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/type-aliases/Empty',
                  label: 'Empty',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/type-aliases/FeatureFlags',
                  label: 'FeatureFlags',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/type-aliases/Field',
                  label: 'Field',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/type-aliases/FlexibleProvable',
                  label: 'FlexibleProvable',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/type-aliases/FlexibleProvablePure',
                  label: 'FlexibleProvablePure',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/type-aliases/Group',
                  label: 'Group',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/type-aliases/InferProvable',
                  label: 'InferProvable',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/type-aliases/JsonProof',
                  label: 'JsonProof',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/type-aliases/MerkleListBase',
                  label: 'MerkleListBase',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/type-aliases/MerkleListIteratorBase',
                  label: 'MerkleListIteratorBase',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/type-aliases/Option',
                  label: 'Option',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/type-aliases/Provable',
                  label: 'Provable',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/type-aliases/ProvableExtended',
                  label: 'ProvableExtended',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/type-aliases/ProvableHashable-1',
                  label: 'ProvableHashable-1',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/type-aliases/ProvableHashable',
                  label: 'ProvableHashable',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/type-aliases/ProvablePure',
                  label: 'ProvablePure',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/type-aliases/ProvableType',
                  label: 'ProvableType',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/type-aliases/ProvableTypePure',
                  label: 'ProvableTypePure',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/type-aliases/ProvableWithEmpty',
                  label: 'ProvableWithEmpty',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/type-aliases/Reducer',
                  label: 'Reducer',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/type-aliases/ScalarConst',
                  label: 'ScalarConst',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/type-aliases/State',
                  label: 'State',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/type-aliases/Struct',
                  label: 'Struct',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/type-aliases/ToProvable',
                  label: 'ToProvable',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/type-aliases/TransactionPromise',
                  label: 'TransactionPromise',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/type-aliases/TransactionStatus',
                  label: 'TransactionStatus',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/type-aliases/TupleN',
                  label: 'TupleN',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/type-aliases/Undefined',
                  label: 'Undefined',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/type-aliases/VarField',
                  label: 'VarField',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/type-aliases/Void',
                  label: 'Void',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/type-aliases/WithHash',
                  label: 'WithHash',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/type-aliases/WithProvable',
                  label: 'WithProvable',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/type-aliases/Witness',
                  label: 'Witness',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/type-aliases/ZkProgram',
                  label: 'ZkProgram',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/type-aliases/ZkappPublicInput',
                  label: 'ZkappPublicInput',
                },
              ],
            },
            {
              type: 'category',
              label: 'Variables',
              items: [
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/variables/Account',
                  label: 'Account',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/variables/Bool',
                  label: 'Bool',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/variables/Cache',
                  label: 'Cache',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/variables/Crypto',
                  label: 'Crypto',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/variables/Empty',
                  label: 'Empty',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/variables/FeatureFlags',
                  label: 'FeatureFlags',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/variables/Field',
                  label: 'Field',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/variables/Gadgets',
                  label: 'Gadgets',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/variables/Group',
                  label: 'Group',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/variables/Hash',
                  label: 'Hash',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/variables/Keccak',
                  label: 'Keccak',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/variables/Permissions',
                  label: 'Permissions',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/variables/Poseidon',
                  label: 'Poseidon',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/variables/ProvableType',
                  label: 'ProvableType',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/variables/TokenId',
                  label: 'TokenId',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/variables/TransactionVersion',
                  label: 'TransactionVersion',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/variables/TupleN',
                  label: 'TupleN',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/variables/Undefined',
                  label: 'Undefined',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/variables/Void',
                  label: 'Void',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/variables/ZkappPublicInput',
                  label: 'ZkappPublicInput',
                },
                {
                  type: 'doc',
                  id: 'zkapps/o1js-reference/variables/emptyHash',
                  label: 'emptyHash',
                },
              ],
            },
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
        'node-operators/requirements',
        'node-operators/generating-a-keypair',
        {
          type: 'category',
          label: 'Block Producing Node',
          link: {
            type: 'doc',
            id: 'node-operators/block-producer-node/index',
          },
          items: [
            'node-operators/block-producer-node/getting-started',
            'node-operators/block-producer-node/connecting-to-the-network',
            'node-operators/block-producer-node/connecting-to-devnet',
            'node-operators/block-producer-node/hot-cold-block-production',
            'node-operators/block-producer-node/docker-compose',
          ],
        },
        {
          type: 'category',
          label: 'SNARK Workers',
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
            'node-operators/archive-node/docker-compose',
          ],
        },
        {
          type: 'category',
          label: 'Seed Peers',
          link: {
            type: 'doc',
            id: 'node-operators/seed-peers/index',
          },
          items: [
            'node-operators/seed-peers/getting-started',
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
          items: [
            'node-operators/data-and-history/querying-data',
            'node-operators/data-and-history/rosetta',
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
        'node-operators/staking-and-snarking',
        'node-operators/staking-service-guidelines',
        'node-operators/mina-signer',
        'node-operators/mina-cli-reference',
        'node-operators/logging',
        'node-operators/troubleshooting',
        'node-operators/faq',
      ],
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
      label: 'Exchange Operators',
      link: {
        type: 'doc',
        id: 'exchange-operators/index',
      },
      items: [
        {
          type: 'category',
          label: 'Rosetta API',
          items: [
            'exchange-operators/rosetta/run-with-docker',
            'exchange-operators/rosetta/docker-compose',
            'exchange-operators/rosetta/build-from-sources',
            'exchange-operators/rosetta/send-requests',
            {
              type: 'category',
              label: 'Code Samples',
              link: {
                type: 'doc',
                id: 'exchange-operators/rosetta/samples/index',
              },
              items: [
                'exchange-operators/rosetta/samples/requests',
                'exchange-operators/rosetta/samples/using-signer',
                'exchange-operators/rosetta/samples/scan-blocks',
                'exchange-operators/rosetta/samples/track-deposits',
                'exchange-operators/rosetta/samples/send-transactions',
              ],
            },
          ],
        },
        'exchange-operators/faq',
      ],
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
