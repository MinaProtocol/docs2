import React from 'react';
import SearchBar from '@theme-original/SearchBar';
import AskCookbook from '@cookbookdev/docsbot/react'
import BrowserOnly from '@docusaurus/BrowserOnly';
/** It's a public API key, so it's safe to expose it here */
const COOKBOOK_PUBLIC_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NzFmZTM2ODQ5ZWQyZGRkMmFjZWE3YTAiLCJpYXQiOjE3MzAxNDMwODAsImV4cCI6MjA0NTcxOTA4MH0.u7ONi5utqLog8sMjTX51PS23I0pVHnvkTdVR-N16a28";
export default function SearchBarWrapper(props) {
  return (
    <>
      <SearchBar {...props} />
      <BrowserOnly>{() => <AskCookbook apiKey={COOKBOOK_PUBLIC_API_KEY} /> }</BrowserOnly>
    </>
  );
}
