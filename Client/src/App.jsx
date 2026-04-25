import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/home';
import Editor from './pages/Editor';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/editor/:roomId" element={<Editor />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;