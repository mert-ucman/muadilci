import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from '@/contexts/RouterContext';
import { AuthProvider }   from '@/contexts/AuthContext';
import { DataProvider }   from '@/contexts/DataContext';
import { App }            from './App';

import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider>
      <AuthProvider>
        <DataProvider>
          <App />
        </DataProvider>
      </AuthProvider>
    </RouterProvider>
  </React.StrictMode>
);
