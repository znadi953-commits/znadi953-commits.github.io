import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Catalogue from './pages/Catalogue';
import PromptDetail from './pages/PromptDetail';
import GalleryDemo from './pages/GalleryDemo';
import Affiliation from './pages/Affiliation';
import AdminSync from './pages/AdminSync';

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || '/'}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/catalogue" element={<Catalogue />} />
          <Route path="/prompt/:id" element={<PromptDetail />} />
          <Route path="/demo/galerie" element={<GalleryDemo />} />
          <Route path="/affiliation" element={<Affiliation />} />
          <Route path="/admin/sync" element={<AdminSync />} />
          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
