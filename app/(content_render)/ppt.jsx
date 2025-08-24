import React from 'react';
import { View } from 'react-native';
import PdfRendererView from 'react-native-pdf-renderer';

const TestPdf = () => {
  const source = require('../../assets/samplecontent/Chapter1.pdf');
  return (
    <View style={{ flex: 1 }}>
      <PdfRendererView source={source} style={{ flex: 1 }} />
    </View>
  );
};

export default TestPdf;