import React from 'react';
import clsx from 'clsx';
import { useWindowSize } from '@docusaurus/theme-common';
import { useDoc } from '@docusaurus/plugin-content-docs/client';
import DocItemPaginator from '@theme/DocItem/Paginator';
import DocVersionBanner from '@theme/DocVersionBanner';
import DocVersionBadge from '@theme/DocVersionBadge';
import DocItemFooter from '@theme/DocItem/Footer';
import DocItemTOCMobile from '@theme/DocItem/TOC/Mobile';
import DocItemTOCDesktop from '@theme/DocItem/TOC/Desktop';
import DocItemContent from '@theme/DocItem/Content';
import DocBreadcrumbs from '@theme/DocBreadcrumbs';
import Button from '@site/src/components/common/Button';
import ArrowRightSmall from '@site/static/svg/common/arrow_right_small.svg';
import styles from './DocItemLayout.module.scss';
import Link from '@docusaurus/Link';
/**
 * Decide if the toc should be rendered, on mobile or desktop viewports
 */
function useDocTOC() {
  const { frontMatter, toc, metadata } = useDoc();

  const windowSize = useWindowSize();
  const hidden = frontMatter.hide_table_of_contents;
  const canRender = !hidden && toc.length > 0;
  const mobile = canRender ? <DocItemTOCMobile /> : undefined;
  const desktop =
    canRender && (windowSize === 'desktop' || windowSize === 'ssr') ? (
      <DocItemTOCDesktop />
    ) : undefined;
  return {
    hidden,
    mobile,
    desktop,
  };
}
export default function DocItemLayout({ children }) {
  const docTOC = useDocTOC();
  const windowSize = useWindowSize();

  const {
    metadata: { editUrl, slug },
  } = useDoc();

  function renderTOCDesktop() {
    if (slug === '/') return;

    return (
      <div className={styles.tocContainer}>
        <div className={styles.editButtonContainer}>
          <Link className={styles.editLink} to={editUrl}>
            <Button color="dark" className={styles.editButton}>
              Edit this page
              <ArrowRightSmall />
            </Button>
          </Link>
        </div>
        {docTOC.desktop}
      </div>
    );
  }

  function renderTOCmobile() {
    if (slug === '/') return;

    if (windowSize === 'mobile') {
      return (
        <>
          {docTOC.mobile}
          <div className={styles.editButtonContainerMobile}>
            <Link className={styles.editLink} to={editUrl}>
              <Button color="dark">
                Edit this page
                <ArrowRightSmall />
              </Button>
            </Link>
          </div>
        </>
      );
    }
  }

  return (
    <div className="row">
      <div className={clsx('col', !docTOC.hidden && styles.docItemCol)}>
        <DocVersionBanner />
        <div className={styles.docItemContainer}>
          <article>
            <DocBreadcrumbs />
            <DocVersionBadge />
            {renderTOCmobile()}
            <DocItemContent>{children}</DocItemContent>
            <DocItemFooter />
          </article>
          <DocItemPaginator />
        </div>
      </div>

      <div className="col col--3">{renderTOCDesktop()}</div>
    </div>
  );
}
