
import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router'
import LandingPage from './pages/LandingPage'
import RoomPage from './pages/RoomPage'

function App() {

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/room/:roomCode" element={<RoomPage />} />
      </Routes>
    </Router>
  )
}

export default App
