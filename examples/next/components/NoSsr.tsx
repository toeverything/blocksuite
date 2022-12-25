import dynamic from 'next/dynamic';
import React from 'react';

const NoSsrImpl = (props: React.PropsWithChildren) => (
  <React.Fragment>{props.children}</React.Fragment>
);

export const NoSsr = dynamic(() => Promise.resolve(NoSsrImpl), {
  ssr: false,
});
