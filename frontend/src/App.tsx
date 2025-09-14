import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LiveSession } from './pages/LiveSession';
import { RecipeSelection } from './pages/RecipeSelection';
import { useEffect } from 'react';

export default function App() {
  // Set dark mode by default
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);
  
  return (
    <Router future={{ v7_relativeSplatPath: true }}>
      <div className="min-h-screen bg-background text-foreground">
        <Routes>
          <Route path="/" element={<RecipeSelection />} />
          <Route path="/recipes" element={<RecipeSelection />} />
          <Route path="/session/:id" element={<LiveSession />} />
          <Route path="/preview_page.html" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}