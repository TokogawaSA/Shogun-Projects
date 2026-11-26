import React from 'react';
import { LineItemEditor, type LineItemEditorProps } from './lineItems/LineItemEditor';

export type QuoteBuilderProps = LineItemEditorProps;

export const QuoteBuilder: React.FC<QuoteBuilderProps> = (props) => {
  return <LineItemEditor {...props} />;
};

export default QuoteBuilder;
