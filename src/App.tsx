import {BrowserRouter, Routes, Route} from 'react-router-dom';
import HomePage from './pages/HomePage';
import ProjectsPage from './pages/ProjectsPage';
import ConsolePage from './pages/ConsolePage';
import DesignPage from './pages/DesignPage';
import PrototypeNav from './components/PrototypeNav';
import AgentWidget from './components/AgentWidget';

export default function App() {
  return (
    <BrowserRouter>
      <PrototypeNav />
      <AgentWidget />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/console" element={<ConsolePage />} />
        <Route path="/design" element={<DesignPage />} />
      </Routes>
    </BrowserRouter>
  );
}
