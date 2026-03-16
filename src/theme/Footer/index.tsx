import React from 'react';

import Button from '@site/src/components/common/Button';
import Link from '@docusaurus/Link';
import ArrowRightSmall from '@site/static/svg/common/arrow_right_small.svg';

import styles from './Footer.module.scss';
import { SocialLinks } from '@site/src/constants';
import MinaLogo from '@site/static/svg/common/mina_logo.svg';
import DiscordLogo from '@site/static/svg/socials/discord_24x24.svg';
import TwitterLogo from '@site/static/svg/socials/twitter_24x24.svg';
import FacebookLogo from '@site/static/svg/socials/facebook_24x24.svg';
import TelegramLogo from '@site/static/svg/socials/telegram_24x24.svg';
import WeChatLogo from '@site/static/svg/socials/wechat_24x24.svg';
import YoutubeLogo from '@site/static/svg/socials/youtube_24x24.svg';
import { FormSubmitUrl } from '@site/src/constants';

function Footer(): JSX.Element | null {
  const [email, setEmail] = React.useState('');
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email) {
      return;
    }
    const response = await fetch(FormSubmitUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `email=${email}`,
    });
    if (!response.ok) {
      console.error('Failed to submit form');
      return;
    }
    setIsSubmitted(true);
    window.location.href = 'https://minaprotocol.com/newsletter-confirmation';
  };

  const renderForm = () => {
    if (isSubmitted) {
      return <div>Thanks for subscribing!</div>;
    }
    return (
      <form
        id="newletter_form"
        onSubmit={handleSubmit}
        className={styles.minaFooter_form__submitContainer}
      >
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type={isSubmitted ? 'hidden' : 'email'}
          name="email"
          id="email"
          placeholder="Enter Email"
          className={styles.minaFooter_form_input}
        />
        <Button type="submit" color="orange">
          <span>Submit</span>
          <ArrowRightSmall />
        </Button>
      </form>
    );
  };

  return (
    <footer className={styles.minaFooter}>
      <div className={styles.minaFooter_container}>
        <div className={styles.minaFooter_col1}>
          <a href="https://minaprotocol.com">
            <MinaLogo />
          </a>
          <div className={styles.minaFooter_form}>
            <h4>GET UPDATES</h4>
            <p>Mina is growing fast! Subscribe to stay updated</p>
            {renderForm()}
          </div>
          <div className={styles.minaFooter_social}>
            <h4>CONNECT</h4>
            <p>Join the conversation.</p>
          </div>
          <div className={styles.minaFooter_social__links}>
            <Link href={SocialLinks.Discord}>
              <DiscordLogo />
            </Link>
            <Link href={SocialLinks.Twitter}>
              <TwitterLogo />
            </Link>
            <Link href={SocialLinks.Telegram}>
              <TelegramLogo />
            </Link>
            <Link href={SocialLinks.WeChat}>
              <WeChatLogo />
            </Link>
            <Link href={SocialLinks.YouTube}>
              <YoutubeLogo />
            </Link>
          </div>
        </div>
        <div className={styles.minaFooter_col2}>
          <ul>
            <li>
              <span>Getting Started</span>
              <ul>
                <li>
                  <Link to="/">Documentation</Link>
                </li>
                <li>
                  <Link href="https://minaprotocol.com/join-zkignite-cohort-2">
                    zkIgnite, Cohort 2
                  </Link>
                </li>
                <li>
                  <Link to="/zkapps/writing-a-zkapp/introduction-to-zkapps/how-to-write-a-zkapp">
                    Write a zkApp
                  </Link>
                </li>
                <li>
                  <Link href="https://minaprotocol.com/node-operators">
                    Run a Node
                  </Link>
                </li>
              </ul>
            </li>
            <li>
              <span>Resources</span>
              <ul>
                <li>
                  <Link href="https://minaprotocol.com/lightweight-blockchain">
                    About the Tech
                  </Link>
                </li>
                <li>
                  <Link
                    rel="knowledge-base"
                    href="https://minaprotocol.com/get-started"
                  >
                    Get Started
                  </Link>
                </li>
                <li>
                  <a
                    target="_blank"
                    rel="noopener"
                    href="/assets/technicalWhitepaper.pdf"
                  >
                    Technical Whitepaper
                  </a>
                </li>
                <li>
                  <a
                    target="_blank"
                    rel="noopener"
                    href="/assets/economicsWhitepaper.pdf"
                  >
                    Economics Whitepaper
                  </a>
                </li>
                <li>
                  <Link href="https://minaprotocol.com/media">Media</Link>
                </li>
              </ul>
            </li>
            <li>
              <span>Ecosystem</span>
              <ul>
                <li>
                  <Link href="https://minaprotocol.com/community">
                    Community
                  </Link>
                </li>
                <li>
                  <Link href="https://minaprotocol.com/grants">Grants</Link>
                </li>
                <li>
                  <Link href="https://minaprotocol.com/work-with-mina">
                    Work with Mina
                  </Link>
                </li>
                <li>
                  <Link href="https://minafoundation.notion.site/minafoundation/Mina-Community-Blog-91b8fdfd1b9e444ca55ddd1b90bade3c">
                    Community Blog
                  </Link>
                </li>
                <li>
                  <Link href="https://www.minafoundation.com/">
                    Mina Foundation
                  </Link>
                </li>
              </ul>
            </li>
            <li>
              <span>Help and Support</span>
              <ul>
                <li>
                  <Link href={SocialLinks.Discord}>Discord</Link>
                </li>
                <li>
                  <Link href={SocialLinks.Telegram}>Mina Research</Link>
                </li>
                <li>
                  <Link href={SocialLinks.GitHub}>GitHub</Link>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
      <hr />
      <div className={styles.minaFooter_legals}>
        <div className={styles.minaFooter_legals__menu}>
          <ul>
            <li>
              <Link href="https://o1labs.org">o1Labs</Link>
            </li>
            <li>
              <Link href="https://github.com/MinaProtocol/mina/blob/develop/CODE_OF_CONDUCT.md">
                Code of Conduct
              </Link>
            </li>
            <li>
              <Link href="https://minaprotocol.com/privacy">Privacy</Link>
            </li>
            <li>
              <Link href="https://minaprotocol.com/tos">Terms of Service</Link>
            </li>
          </ul>
        </div>
        <div className={styles.minaFooter_legals__info}>
          ©2024 Mina Foundation. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export default React.memo(Footer);
