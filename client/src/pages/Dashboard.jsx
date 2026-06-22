import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Trash2, ArrowRight, Clock, Wand2, ImageIcon, Star } from 'lucide-react';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';

const INDUSTRIES = [
  'HVAC', 'Plumbing', 'Electrical', 'Garage Door', 'Pressure Washing',
  'Pest Control', 'Landscaping', 'Roofing', 'Painting', 'Flooring',
  'Cleaning Services', 'Handyman', 'Pool Service', 'Tree Service', 'Other'
];

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({
    businessName: '',
    industry: '',
    location: '',
    personality: '',
    colors: '',
    styleNotes: '',
    promptDescription: '',
    mustHave: '',
    mustAvoid: '',
  });
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      const data = await api.getProjects();
      setProjects(data.reverse());
    } catch (e) {
      toast('Failed to load projects', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function createProject(e) {
    e.preventDefault();
    if (!form.businessName.trim() || !form.industry) {
      toast('Business name and industry are required', 'error');
      return;
    }
    setCreating(true);
    try {
      const project = await api.createProject(form);
      toast('Project created!');
      navigate(`/project/${project.id}`);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setCreating(false);
    }
  }

  async function deleteProject(id, name) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await api.deleteProject(id);
      setProjects(p => p.filter(x => x.id !== id));
      toast('Project deleted');
    } catch (e) {
      toast(e.message, 'error');
    }
  }

  function getProgress(project) {
    let done = 0;
    if (project.favoriteWordmark) done++;
    if (project.favoriteMascot) done++;
    if (project.favoriteBackground) done++;
    return done;
  }

  const field = (key, label, type = 'input', opts = {}) => (
    <div className="form-group">
      <label>{label}</label>
      {type === 'textarea' ? (
        <textarea
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          placeholder={opts.placeholder || ''}
        />
      ) : type === 'select' ? (
        <select value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}>
          <option value="">Select industry...</option>
          {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
        </select>
      ) : (
        <input
          type="text"
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          placeholder={opts.placeholder || ''}
        />
      )}
    </div>
  );

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Brand Projects</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Create and manage your home service brand concepts
          </p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={() => setShowNew(true)}>
          <Plus size={18} /> New Project
        </button>
      </div>

      {showNew && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="card" style={{ width: '100%', maxWidth: 680, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>New Brand Project</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowNew(false)}>Cancel</button>
            </div>
            <form onSubmit={createProject}>
              <div className="form-row">
                {field('businessName', 'Business Name *', 'input', { placeholder: 'e.g. Arctic Air HVAC' })}
                {field('industry', 'Industry *', 'select')}
              </div>
              <div className="form-row">
                {field('location', 'Location', 'input', { placeholder: 'e.g. Phoenix, AZ' })}
                {field('personality', 'Brand Personality', 'input', { placeholder: 'e.g. Bold, trustworthy, family-friendly' })}
              </div>
              <div className="form-row">
                {field('colors', 'Colors', 'input', { placeholder: 'e.g. Ice blue and orange' })}
                {field('styleNotes', 'Style Notes', 'input', { placeholder: 'e.g. Retro cartoon, bold outlines' })}
              </div>
              {field('promptDescription', 'Description / Prompt', 'textarea', { placeholder: 'Describe the overall brand vision...' })}
              <div className="form-row">
                {field('mustHave', 'Must Include', 'input', { placeholder: 'e.g. Snowflake icon, strong mascot' })}
                {field('mustAvoid', 'Must Avoid', 'input', { placeholder: 'e.g. Purple, flames, aggressive imagery' })}
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowNew(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? <><span className="loading-spinner" style={{ width: 16, height: 16 }} /> Creating...</> : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <span className="loading-spinner" style={{ width: 32, height: 32 }} />
        </div>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <Wand2 size={64} />
          <h3>No projects yet</h3>
          <p>Create your first brand project to get started</p>
          <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => setShowNew(true)}>
            <Plus size={16} /> Start a New Project
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {projects.map(p => {
            const progress = getProgress(p);
            return (
              <div key={p.id} className="card card-hover" style={{ position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{p.businessName}</h3>
                    <span className="badge badge-muted">{p.industry}</span>
                  </div>
                  <button
                    className="btn btn-ghost btn-xs"
                    onClick={() => deleteProject(p.id, p.businessName)}
                    style={{ padding: 6, color: '#666' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {p.location && (
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 12 }}>📍 {p.location}</p>
                )}

                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                    <span>Brand Progress</span>
                    <span>{progress}/3 elements selected</span>
                  </div>
                  <div style={{ background: '#222', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                    <div style={{ background: 'var(--neon)', height: '100%', width: `${(progress / 3) * 100}%`, transition: 'width 0.3s', borderRadius: 4 }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
                  <span style={{ color: p.favoriteWordmark ? 'var(--neon)' : '#444' }}>✦ Wordmark</span>
                  <span style={{ color: p.favoriteMascot ? 'var(--neon)' : '#444' }}>✦ Mascot</span>
                  <span style={{ color: p.favoriteBackground ? 'var(--neon)' : '#444' }}>✦ Background</span>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={12} /> {new Date(p.createdAt).toLocaleDateString()}
                  </span>
                  <Link to={`/project/${p.id}`} className="btn btn-outline btn-sm">
                    Open <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
