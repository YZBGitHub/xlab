import {BrowserRouter, Routes, Route} from 'react-router-dom';
import HomePage from './pages/HomePage';
import ConsolePage from './pages/ConsolePage';
import DesignPage from './pages/DesignPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import PrototypeNav from './components/PrototypeNav';
import AgentWidget from './components/AgentWidget';

export default function App() {
  return (
    <BrowserRouter>
      <PrototypeNav />
      <AgentWidget />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/console" element={<ConsolePage />} />
        <Route path="/design" element={<DesignPage />} />
        <Route path="/project/:id" element={<ProjectDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}
