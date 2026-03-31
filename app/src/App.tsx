import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProjectList from './components/ProjectList';
import ProjectDetail from './components/ProjectDetail';
import PricingComparison from './components/PricingComparison';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/projects" replace />} />
        <Route path="/projects" element={<ProjectList />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/pricing" element={<PricingComparison />} />
      </Route>
    </Routes>
  );
}
