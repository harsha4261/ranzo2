import * as React from 'react';

declare global {
  namespace JSX {
    interface Element extends React.ReactElement<any, any> { }
    interface ElementClass {
      render?(): React.ReactNode;
    }
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}
