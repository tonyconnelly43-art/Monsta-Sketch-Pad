import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/Layout';
import Studio from './pages/Studio';
import ReferenceLibrary from './pages/ReferenceLibrary';
import Favorites from './pages/Favorites';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Studio />} />
            <Route path="/library" element={<ReferenceLibrary />} />
            <Route path="/favorites" element={<Favorites />} />
          </Routes>
        </Layout>
      </ToastProvider>
    </BrowserRouter>
  );
}
