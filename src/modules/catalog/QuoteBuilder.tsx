import React from 'react';
import { LineItemEditor, type LineItemEditorProps } from './lineItems/LineItemEditor';

export const QuoteBuilder: React.FC<LineItemEditorProps> = (props) => {
  return <LineItemEditor {...props} />;
};

export default QuoteBuilder;
