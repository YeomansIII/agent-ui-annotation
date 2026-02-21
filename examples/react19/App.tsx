import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router';
import { AgentUIAnnotation, useAgentUIAnnotation } from 'agent-ui-annotation/react';
import type { BeforeAnnotationCreateData, BeforeAnnotationCreateResult } from 'agent-ui-annotation/react';

// ─── Page Components ────────────────────────────────────

function HomePage() {
  return (
    <section className="page">
      <h2>Home</h2>
      <p>Welcome to the React 19 annotation example with multi-route support.</p>
      <div className="card-grid">
        <div className="card" id="card-quick-start">
          <h3>Quick Start</h3>
          <p>Install the package and drop in the component.</p>
        </div>
        <div className="card" id="card-features">
          <h3>Features</h3>
          <p>Markers, dots mode, scroll tracking, route awareness.</p>
        </div>
        <div className="card" id="card-output">
          <h3>Output Levels</h3>
          <p>Minimal, standard, or forensic detail.</p>
        </div>
      </div>
    </section>
  );
}

function SettingsPage() {
  return (
    <section className="page">
      <h2>Settings</h2>
      <p>Annotations created here are scoped to <code>/settings</code>.</p>
      <div className="card-grid">
        <div className="card" id="card-theme">
          <h3>Theme</h3>
          <p>Light, dark, or auto theme switching.</p>
        </div>
        <div className="card" id="card-locale">
          <h3>Locale</h3>
          <p>English and Chinese (zh-CN) supported.</p>
        </div>
      </div>
    </section>
  );
}

function ProfilePage() {
  return (
    <section className="page">
      <h2>Profile</h2>
      <p>A third route to verify annotation isolation.</p>
      <div className="card-grid">
        <div className="card" id="card-avatar">
          <h3>Avatar</h3>
          <p>Upload or pick a default avatar.</p>
        </div>
        <div className="card" id="card-bio">
          <h3>Bio</h3>
          <p>Add a short bio and links.</p>
        </div>
        <div className="card" id="card-prefs">
          <h3>Preferences</h3>
          <p>Notification and display preferences.</p>
        </div>
      </div>
      {/* Extra content for scroll testing */}
      <div className="card-grid" style={{ marginTop: '2rem' }}>
        {Array.from({ length: 6 }, (_, i) => (
          <div className="card" key={i} id={`card-extra-${i}`}>
            <h3>Extra {i + 1}</h3>
            <p>Scroll down — markers should follow their cards.</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Route-aware hook example ───────────────────────────

function RouteIndicator() {
  const location = useLocation();
  return <span className="route-badge">Route: {location.pathname}</span>;
}

// ─── App ────────────────────────────────────────────────

export default function App() {
  const { ref, activate, deactivate, toggle, copyOutput } = useAgentUIAnnotation();

  const beforeCreate = (data: BeforeAnnotationCreateData): BeforeAnnotationCreateResult => {
    // Example: inject extra context from the React app
    return {
      ...data,
      context: {
        ...data.context,
        reactVersion: '19',
        timestamp: new Date().toISOString(),
      },
    };
  };

  return (
    <BrowserRouter>
      <div className="app">
        <header>
          <nav>
            <NavLink to="/">Home</NavLink>
            <NavLink to="/settings">Settings</NavLink>
            <NavLink to="/profile">Profile</NavLink>
          </nav>
          <div className="toolbar-controls">
            <button onClick={activate}>Activate</button>
            <button onClick={deactivate}>Deactivate</button>
            <button onClick={toggle}>Toggle</button>
            <button onClick={() => copyOutput()}>Copy Output</button>
            <RouteIndicator />
          </div>
        </header>

        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </main>

        <AgentUIAnnotation
          ref={ref}
          theme="auto"
          outputLevel="standard"
          onBeforeAnnotationCreate={beforeCreate}
          onAnnotationCreate={(a) => console.log('[React 19] Created:', a)}
          onAnnotationUpdate={(a) => console.log('[React 19] Updated:', a)}
          onAnnotationDelete={(id) => console.log('[React 19] Deleted:', id)}
          onCopy={(content) => console.log('[React 19] Copied:', content)}
        />
      </div>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: system-ui, sans-serif; background: #0f0f23; color: #e0e0e0; }
        .app { min-height: 100vh; }
        header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 1rem 2rem; background: #1a1a3e; border-bottom: 1px solid #333;
        }
        nav { display: flex; gap: 0.5rem; }
        nav a {
          padding: 0.5rem 1rem; border-radius: 6px; text-decoration: none;
          color: #aaa; background: #252550; transition: all 0.2s;
        }
        nav a:hover { color: #fff; background: #353570; }
        nav a.active { color: #fff; background: #6c5ce7; }
        .toolbar-controls { display: flex; gap: 0.5rem; align-items: center; }
        .toolbar-controls button {
          padding: 0.4rem 0.8rem; border-radius: 6px; border: 1px solid #555;
          background: #252550; color: #e0e0e0; cursor: pointer; font-size: 0.85rem;
        }
        .toolbar-controls button:hover { background: #353570; }
        .route-badge {
          padding: 0.3rem 0.7rem; border-radius: 4px;
          background: #2d2d5e; font-size: 0.8rem; color: #888;
        }
        main { padding: 2rem; }
        .page h2 { font-size: 1.8rem; margin-bottom: 0.5rem; color: #fff; }
        .page p { color: #aaa; margin-bottom: 1.5rem; }
        .card-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 1rem;
        }
        .card {
          padding: 1.5rem; border-radius: 10px; background: #1e1e44;
          border: 1px solid #333; transition: border-color 0.2s;
        }
        .card:hover { border-color: #6c5ce7; }
        .card h3 { color: #fff; margin-bottom: 0.5rem; }
        .card p { color: #999; font-size: 0.9rem; }
        code { background: #2a2a5a; padding: 0.15rem 0.4rem; border-radius: 3px; font-size: 0.85rem; }
      `}</style>
    </BrowserRouter>
  );
}
