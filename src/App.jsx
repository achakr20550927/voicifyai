import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import InputLayer from './pages/InputLayer';
import ProcessingLayer from './pages/ProcessingLayer';
import ExecutionCard from './pages/ExecutionCard';
import Library from './pages/Library';
import LandingPage from './pages/LandingPage';
import CustomCursor from './components/CustomCursor';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

// Light mode: local looping background video served from `public/`.
const LIGHT_VIDEO = '/light-mode-background.mp4';
const LIGHT_VIDEO_FALLBACK = LIGHT_VIDEO;
const DARK_VIDEO = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260315_073750_51473149-4350-4920-ae24-c8214286f323.mp4';

function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className="fixed bottom-6 right-6 z-[200] w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 shadow-xl"
      style={{
        background: isDark
          ? 'rgba(255,255,255,0.1)'
          : 'rgba(255,255,255,0.35)',
        border: isDark
          ? '1px solid rgba(255,255,255,0.15)'
          : '1px solid rgba(255,255,255,0.5)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {isDark
        ? <Sun className="w-5 h-5 text-yellow-300" />
        : <Moon className="w-5 h-5 text-slate-600" />
      }
    </button>
  );
}

function Layout({ children }) {
  const location = useLocation();
  const { isDark } = useTheme();
  const fullScreenRoutes = ['/', '/input', '/processing', '/execution'];
  const isFullScreen = fullScreenRoutes.includes(location.pathname);

  return (
    <div className="flex flex-col min-h-screen relative">
      {/* Always-on background video — different source per mode */}
      <video
        key={isDark ? 'dark' : 'light'}
        autoPlay loop muted playsInline
        className="fixed inset-0 w-full h-full object-cover z-0 pointer-events-none"
        style={isDark
          ? { opacity: 0.45, mixBlendMode: 'screen' }
          : { opacity: 0.55, mixBlendMode: 'normal' }
        }
      >
        {isDark
          ? <source src={DARK_VIDEO} type="video/mp4" />
          : <>
              <source src={LIGHT_VIDEO} type="video/mp4" />
              <source src={LIGHT_VIDEO_FALLBACK} type="video/mp4" />
            </>
        }
      </video>
      {/* Light mode: soft frosted overlay so text stays readable */}
      {!isDark && (
        <div
          className="fixed inset-0 z-0 pointer-events-none"
          style={{ background: 'rgba(248,249,252,0.22)' }}
        />
      )}

      {!isFullScreen && <Navbar />}
      <CustomCursor />
      <main className="flex-1 relative z-10">
        {children}
      </main>
      {!isFullScreen && <BottomNav />}

      <ThemeToggle />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/input" element={<InputLayer />} />
            <Route path="/processing" element={<ProcessingLayer />} />
            <Route path="/execution" element={<ExecutionCard />} />
            <Route path="/library" element={<Library />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;
