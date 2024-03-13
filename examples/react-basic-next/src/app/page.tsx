import React from 'react';
import dynamic from 'next/dynamic';
import './index.css';

const AppWithNoSSR = dynamic(() => import('./App'), { ssr: false });

function Page() {
  return <AppWithNoSSR />;
}

export default Page;
