import React from 'react';
import './index.css';
import { render } from 'react-dom';
import { App } from './App';
import { MediaStoreProvider } from './store/MediaStore';
render(
  <MediaStoreProvider>
    <App />
  </MediaStoreProvider>,
  document.getElementById('root')
);