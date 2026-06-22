import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ProjectPage from './pages/ProjectPage';
import ReferenceLibrary from './pages/ReferenceLibrary';
import Favorites from './pages/Favorites';
import GeneratePage from './components/GeneratePage';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/project/:id" element={<ProjectPage />} />
            <Route path="/project/:id/wordmarks" element={<GeneratePage type="wordmarks" />} />
            <Route path="/project/:id/mascots" element={<GeneratePage type="mascots" />} />
            <Route path="/project/:id/backgrounds" element={<GeneratePage type="backgrounds" />} />
            <Route path="/project/:id/full-brand" element={<GeneratePage type="full-brand" />} />
            <Route path="/library" element={<ReferenceLibrary />} />
            <Route path="/favorites" element={<Favorites />} />
          </Routes>
        </Layout>
      </ToastProvider>
    </BrowserRouter>
  );
}
