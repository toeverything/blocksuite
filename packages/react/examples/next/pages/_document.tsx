import React from 'react';
import type { DocumentContext } from 'next/document';
import Document, { Html, Head, Main, NextScript } from 'next/document';
import { CssBaseline } from '@nextui-org/react';

class BlockSuiteDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);
    return {
      ...initialProps,
      styles: React.Children.toArray([initialProps.styles]),
    };
  }

  render() {
    return (
      <Html lang="en">
        <Head>{CssBaseline.flush()}</Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default BlockSuiteDocument;
