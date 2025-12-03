require('dotenv').config();

const math = require('remark-math');
const katex = require('rehype-katex');

// With JSDoc @type annotations, IDEs can provide config autocompletion
/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
  title: 'Mina Documentation',
  tagline: 'Website for documentation about Mina Protocol',
  url: 'https://docs.minaprotocol.com',
  baseUrl: '/',
  onBrokenMarkdownLinks: 'warn',
  onBrokenLinks: 'throw',
  favicon: 'img/favicon.ico',
  organizationName: 'o1-labs',
  projectName: 'docs2',
  trailingSlash: false,

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  plugins: [
    'docusaurus-plugin-sass',
    [
      '@docusaurus/plugin-client-redirects',
      {
        redirects: [
          {
            from: '/node-operators/scan-state',
            to: '/mina-protocol/scan-state',
          },
          {
            from: '/node-operators/snark-workers',
            to: '/mina-protocol/snark-workers',
          },
          {
            from: '/node-operators/time-locked-accounts',
            to: '/mina-protocol/time-locked-accounts',
          },
          {
            from: '/node-operators/lifecycle-of-a-payment',
            to: '/mina-protocol/lifecycle-of-a-payment',
          },
          {
            from: '/node-operators/sending-a-payment',
            to: '/mina-protocol/sending-a-payment',
          },
          {
            from: '/architecture/scan-state',
            to: '/mina-protocol/scan-state',
          },
          {
            from: '/architecture/snapps',
            to: '/zkapps/writing-a-zkapp',
          },
          {
            from: '/snapps',
            to: '/zkapps/writing-a-zkapp',
          },
          {
            from: '/node-developers/code-reviews',
            to: '/node-developers/code-review-guidelines',
          },
          {
            from: '/tutorials',
            to: '/zkapps/tutorials/',
          },
          {
            from: '/zkapps/how-to-test-a-zkapp',
            to: '/zkapps/writing-a-zkapp/introduction-to-zkapps/testing-zkapps-locally',
          },
          {
            from: '/zkapps/simple-anonymous-message-board-tutorial',
            to: '/zkapps/tutorials/anonymous-message-board',
          },
          {
            from: '/architecture/snark-workers',
            to: '/mina-protocol/snark-workers',
          },
          {
            from: '/architecture/timelock',
            to: '/mina-protocol/time-locked-accounts',
          },
          {
            from: '/architecture',
            to: '/node-operators/block-producer-node/getting-started',
          },
          {
            from: '/node-operators',
            to: '/node-operators/block-producer-node/getting-started',
          },
          {
            from: '/advanced',
            to: '/node-operators/block-producer-node/getting-started',
          },
          {
            from: '/node-operators/delegation',
            to: '/node-operators/delegation-program/foundation-delegation-program',
          },
          {
            from: '/contributing',
            to: '/node-developers/contributing',
          },
          {
            from: '/node-developers/directory-structure',
            to: '/node-developers/repository-structure',
          },
          {
            from: '/node-developers/bip44-information',
            to: '/node-developers/bip44',
          },
          {
            from: '/keypair',
            to: '/node-operators/generating-a-keypair',
          },
          {
            from: '/connecting',
            to: '/node-operators/block-producer-node/connecting-to-the-network',
          },
          {
            from: '/staking',
            to: '/node-operators/staking-and-snarking',
          },
          {
            from: '/cli-reference',
            to: '/node-operators/mina-cli-reference',
          },
          {
            from: '/advanced/staking-service-guidelines',
            to: '/node-operators/staking-service-guidelines',
          },
          {
            from: '/advanced/using-mina/staking',
            to: '/node-operators/staking-and-snarking',
          },
          {
            from: '/participate/reporting',
            to: '/participate/bugs-and-feature-requests',
          },
          {
            from: '/mina-glossary',
            to: '/glossary',
          },
          {
            from: '/node-operators/operating-for-data',
            to: '/node-operators/data-and-history/querying-data',
          },
          {
            from: '/node-operators/cli-reference',
            to: '/node-operators/mina-cli-reference',
          },
          {
            from: '/node-operators/uptime-system',
            to: '/node-operators/delegation-program/uptime-tracking-system',
          },
          {
            from: '/node-operators/connecting-devnet',
            to: '/node-operators/block-producer-node/connecting-to-devnet',
          },
          {
            from: '/node-operators/ledger-app-mina',
            to: '/using-mina/ledger-hardware-wallet',
          },
          {
            from: '/advanced/ledger-app-mina',
            to: '/using-mina/ledger-hardware-wallet',
          },
          {
            from: '/node-operators/timelock',
            to: '/mina-protocol/time-locked-accounts',
          },
          {
            from: '/node-operators/keypair',
            to: '/node-operators/generating-a-keypair',
          },
          {
            from: '/node-operators/connecting',
            to: '/node-operators/block-producer-node/connecting-to-the-network',
          },
          {
            from: '/node-operators/send-payment',
            to: '/mina-protocol/sending-a-payment',
          },
          {
            from: '/node-operators/staking',
            to: '/node-operators/staking-and-snarking',
          },
          {
            from: '/exchange-operators/exchange-faq',
            to: '/exchange-operators/faq',
          },
          {
            from: '/zkapps/snarkyjs-reference',
            to: '/zkapps/o1js-reference',
          },
        ],
      },
    ],
    function GoogleAnalyticsPlugin() {
      return {
        name: 'google-analytics-head-injection',
        injectHtmlTags() {
          return {
            headTags: [
              `
                <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','GTM-MJBCZX9');</script>
                `,
              `
                <script>
                  (function(h,o,t,j,a,r){
                    h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
                    h._hjSettings={hjid:3229818,hjsv:6};
                    a=o.getElementsByTagName('head')[0];
                    r=o.createElement('script');r.async=1;
                    r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
                    a.appendChild(r);
                  })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
                </script>
                `,
            ],
            preBodyTags: [
              `
                <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-MJBCZX9"
                height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
                `,
            ],
          };
        },
      };
    },
  ],

  presets: [
    [
      '@docusaurus/preset-classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          path: './docs',
          routeBasePath: '/',
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/o1-labs/docs2/edit/main',
          remarkPlugins: [math],
          rehypePlugins: [katex],
          admonitions: {
            keywords: [
              'note',
              'tip',
              'info',
              'warning',
              'danger',
              'experimental',
              'successTip',
            ],
          },
        },
        theme: {
          customCss: [require.resolve('./src/scss/custom.scss')],
        },
      }),
    ],
  ],

  stylesheets: [
    {
      href: 'https://cdn.jsdelivr.net/npm/katex@0.13.24/dist/katex.min.css',
      type: 'text/css',
      integrity:
        'sha384-odtC+0UGzzFL/6PNoE8rX/SPcQDXBJ+uRepguP4QkPCm2LBxH3FA3y+fKSiJ+AmM',
      crossorigin: 'anonymous',
    },
  ],
  scripts: [
    {
    src: "https://dashboard.letmeexplain.ai/embed/lme_chatbot_widget.js", // LetMeExplain embed script
    async: false,
    },
    {
      src: "/js/enable_lme_chatbot.js", // Custom initialization script
      defer: true,
    },
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      metadata: [
        {
          name: 'keywords',
          content:
            'Snarkyjs, o1js, ZkApps, Zero Knowledge Proofs, Zkp, Smart Contracts',
        },
        {
          name: 'image',
          property: 'image',
          content: 'https://docs.minaprotocol.com/img/common/mina-logo.png',
        },
        {
          name: 'og:image',
          property: 'og:image',
          content: 'https://docs.minaprotocol.com/img/common/mina-logo.png',
        },
        {
          name: 'twitter:image',
          property: 'twitter:image',
          content: 'https://docs.minaprotocol.com/img/common/mina-logo.png',
        },
        { name: 'twitter:title', content: 'Mina Documentation' },
        {
          name: 'twitter:description',
          content: 'Website for documentation about Mina Protocol',
        },
      ],

      navbar: {
        logo: {
          alt: 'Mina Logo',
          src: 'svg/common/mina_logo.svg',
          href: '/',
        },
        items: [
          {
            type: 'html',
            position: 'left',
            className: 'navbar-docs-copy',
            value: `<a href="/"><h3 style="margin:0">Docs</h3></a>`,
          },

          {
            type: 'search',
            position: 'left',
          },
          {
            type: 'html',
            position: 'right',
            value: `<a href="https://github.com/o1-labs/docs2/"><img class="navbar-icon" src="/svg/socials/github_24x24.svg"/></a>`,
          },
          {
            type: 'html',
            position: 'right',
            value: `<a href="https://bit.ly/MinaDiscord"><img class="navbar-icon" src="/svg/socials/discord_dark_24x24.svg"/></a>`,
          },
        ],
      },

      docs: {
        sidebar: {
          autoCollapseCategories: true,
        },
      },

      prism: {
        theme: require('prism-react-renderer').themes.oceanicNext,
      },

      colorMode: {
        defaultMode: 'light',
        disableSwitch: true,
        respectPrefersColorScheme: false,
      },
      algolia: {
        appId: process.env.ALGOLIA_APP_ID ?? 'mina-appId',
        apiKey: process.env.ALGOLIA_SEARCH_API_KEY ?? 'mina-apiKey',
        indexName: 'mina',
        contextualSearch: false,
      },
    }),
};
