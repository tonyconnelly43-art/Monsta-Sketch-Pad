import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Type, User, ImageIcon, Layers, Star, Edit3, Check, X } from 'lucide-react';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';

const STAGES = [
  { key: 'wordmark', label: 'Wordmark', icon: Type, path: 'wordmarks', desc: 'Text-based logo for the company name' },
  { key: 'mascot', label: 'Mascot', icon: User, path: 'mascots', desc: 'Brand character representing the company' },
  { key: 'background', label: 'Background', icon: ImageIcon, path: 'backgrounds', desc: 'Brand backdrop for marketing materials' },
  { key: 'fullBrand', label: 'Full Brand', icon: Layers, path: 'full-brand', desc: 'Complete brand composition' },
];

export default function ProjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    loadProject();
  }, [id]);

  async function loadProject() {
    try {
      const data = await api.getProject(id);
      setProject(data);
      setEditForm(data);
    } catch {
      toast('Project not found', 'error');
      navigate('/');
    } finally {
      setLoading(false);
    }
  }

  async function saveEdit() {
    try {
      const updated = await api.updateProject(id, editForm);
      setProject(updated);
      setEditing(false);
      toast('Project updated');
    } catch (e) {
      toast(e.message, 'error');
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <span className="loading-spinner" style={{ width: 36, height: 36 }} />
    </div>
  );

  if (!project) return null;

  const canGenerateFull = project.favoriteWordmark && project.favoriteMascot && project.favoriteBackground;

  return (
    <div>
      <Link to="/" className="back-link"><ArrowLeft size={16} /> All Projects</Link>

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>{project.businessName}</h1>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
            <span className="badge badge-neon">{project.industry}</span>
            {project.location && <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>📍 {project.location}</span>}
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => setEditing(!editing)}>
          <Edit3 size={14} /> Edit Details
        </button>
      </div>

      {editing && (
        <div className="card" style={{ marginBottom: 32 }}>
          <h3 style={{ marginBottom: 20, fontSize: 16, fontWeight: 600 }}>Edit Project Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {['businessName', 'industry', 'location', 'personality', 'colors', 'styleNotes'].map(key => (
              <div className="form-group" key={key}>
                <label>{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                <input
                  value={editForm[key] || ''}
                  onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                />
              </div>
            ))}
            {['promptDescription', 'mustHave', 'mustAvoid'].map(key => (
              <div className="form-group" key={key} style={{ gridColumn: key === 'promptDescription' ? '1 / -1' : 'auto' }}>
                <label>{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                {key === 'promptDescription'
                  ? <textarea value={editForm[key] || ''} onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))} />
                  : <input value={editForm[key] || ''} onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))} />
                }
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}><X size={14} /> Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={saveEdit}><Check size={14} /> Save</button>
          </div>
        </div>
      )}

      {/* Project Info Summary */}
      {!editing && (project.personality || project.colors || project.styleNotes || project.promptDescription) && (
        <div className="card" style={{ marginBottom: 32, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {project.personality && <Detail label="Personality" value={project.personality} />}
          {project.colors && <Detail label="Colors" value={project.colors} />}
          {project.styleNotes && <Detail label="Style" value={project.styleNotes} />}
          {project.promptDescription && <Detail label="Description" value={project.promptDescription} style={{ gridColumn: '1 / -1' }} />}
          {project.mustHave && <Detail label="Must Include" value={project.mustHave} />}
          {project.mustAvoid && <Detail label="Must Avoid" value={project.mustAvoid} />}
        </div>
      )}

      {/* Brand Generation Stages */}
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Brand Generation Workflow</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 40 }}>
        {STAGES.map(stage => {
          const favoriteKey = `favorite${stage.key.charAt(0).toUpperCase() + stage.key.slice(1)}`;
          const hasFavorite = project[favoriteKey];
          const isFullBrand = stage.key === 'fullBrand';
          const locked = isFullBrand && !canGenerateFull;
          const Icon = stage.icon;

          return (
            <div
              key={stage.key}
              className="card card-hover"
              style={{
                opacity: locked ? 0.5 : 1,
                borderColor: hasFavorite ? 'rgba(57,255,20,0.3)' : undefined,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ background: hasFavorite ? 'rgba(57,255,20,0.1)' : '#1a1a1a', border: `1px solid ${hasFavorite ? 'rgba(57,255,20,0.3)' : '#2a2a2a'}`, borderRadius: 8, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} color={hasFavorite ? 'var(--neon)' : '#666'} />
                </div>
                {hasFavorite && <span className="badge badge-neon"><Star size={10} /> Selected</span>}
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{stage.label}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>{stage.desc}</p>

              {hasFavorite && (
                <div style={{ marginBottom: 12, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(57,255,20,0.2)' }}>
                  <img src={hasFavorite.url} alt="Favorite" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
                </div>
              )}

              {locked ? (
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Select a wordmark, mascot & background first</p>
              ) : (
                <Link
                  to={`/project/${id}/${stage.path}`}
                  className="btn btn-outline btn-sm"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {hasFavorite ? 'Regenerate' : isFullBrand ? 'Generate Full Brand' : `Generate ${stage.label}s`}
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {/* Saved Images Preview */}
      {(project.wordmarks?.length > 0 || project.mascots?.length > 0 || project.backgrounds?.length > 0 || project.fullBrands?.length > 0) && (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Generated Images</h2>
          {[
            { key: 'wordmarks', label: 'Wordmarks', path: 'wordmarks' },
            { key: 'mascots', label: 'Mascots', path: 'mascots' },
            { key: 'backgrounds', label: 'Backgrounds', path: 'backgrounds' },
            { key: 'fullBrands', label: 'Full Brand Concepts', path: 'full-brand' },
          ].map(section => project[section.key]?.length > 0 && (
            <div key={section.key} style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-muted)' }}>{section.label}</h3>
                <Link to={`/project/${id}/${section.path}`} style={{ fontSize: 13, color: 'var(--neon)' }}>View all →</Link>
              </div>
              <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
                {project[section.key].slice(-4).map(img => (
                  <div key={img.id} style={{ flex: '0 0 140px', borderRadius: 8, overflow: 'hidden', border: `2px solid ${project[`favorite${section.key.slice(0, -1).charAt(0).toUpperCase() + section.key.slice(0, -1).slice(1)}`]?.id === img.id ? 'var(--neon)' : '#2a2a2a'}` }}>
                    <img src={img.url} alt="" style={{ width: 140, height: 140, objectFit: 'cover', display: 'block' }} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Detail({ label, value, style = {} }) {
  return (
    <div style={style}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14 }}>{value}</div>
    </div>
  );
}
