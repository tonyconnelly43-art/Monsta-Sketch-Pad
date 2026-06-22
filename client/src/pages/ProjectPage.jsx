import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Wand2, Star, Download, CheckCircle,
  ChevronDown, BookImage, X, Edit3, Check, RefreshCw
} from 'lucide-react';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';

const GEN_TYPES = [
  { value: 'mascot',     label: 'Mascot',     refCategory: 'mascot',     projectKey: 'mascots',     favoriteKey: 'favoriteMascot' },
  { value: 'wordmark',   label: 'Wordmark',   refCategory: 'wordmark',   projectKey: 'wordmarks',   favoriteKey: 'favoriteWordmark' },
  { value: 'badge',      label: 'Badge',      refCategory: 'badge',      projectKey: 'badges',      favoriteKey: 'favoriteBadge' },
  { value: 'background', label: 'Background', refCategory: 'background', projectKey: 'backgrounds', favoriteKey: 'favoriteBackground' },
];

const FAVORITE_PANELS = [
  { key: 'favoriteWordmark',   label: 'Wordmark' },
  { key: 'favoriteMascot',     label: 'Mascot' },
  { key: 'favoriteBackground', label: 'Background' },
];

async function runGenerate(type, project, refs) {
  switch (type) {
    case 'mascot':     return api.generateMascots(project, refs);
    case 'wordmark':   return api.generateWordmarks(project, refs);
    case 'badge':      return api.generateBadges(project, refs);
    case 'background': return api.generateBackgrounds(project, refs);
    default: throw new Error('Unknown type');
  }
}

export default function ProjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  const [selectedType, setSelectedType] = useState('mascot');
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [showRefs, setShowRefs] = useState(false);
  const [allRefs, setAllRefs] = useState({});
  const [selectedRefs, setSelectedRefs] = useState([]);
  const [images, setImages] = useState([]);
  const [generating, setGenerating] = useState(false);

  useEffect(() => { loadProject(); }, [id]);

  useEffect(() => {
    if (selectedType) loadRefs(selectedType);
    setSelectedRefs([]);
  }, [selectedType]);

  async function loadProject() {
    try {
      const data = await api.getProject(id);
      setProject(data);
      setEditForm(data);
      setImages(data['mascots'] || []);
    } catch {
      toast('Project not found', 'error');
      navigate('/');
    } finally {
      setLoading(false);
    }
  }

  async function loadRefs(type) {
    if (allRefs[type]) return;
    try {
      const cfg = GEN_TYPES.find(t => t.value === type);
      const refs = await api.getReferences(cfg.refCategory);
      setAllRefs(r => ({ ...r, [type]: refs }));
    } catch {}
  }

  function selectType(type) {
    setSelectedType(type);
    setShowTypeMenu(false);
    const cfg = GEN_TYPES.find(t => t.value === type);
    setImages(project?.[cfg.projectKey] || []);
    loadRefs(type);
  }

  async function generate() {
    if (!project) return;
    setGenerating(true);
    try {
      const cfg = GEN_TYPES.find(t => t.value === selectedType);
      const refData = (selectedRefs || [])
        .map(rid => (allRefs[selectedType] || []).find(r => r.id === rid))
        .filter(Boolean);
      const result = await runGenerate(selectedType, project, refData);
      const newImages = [...images, ...result.images];
      setImages(newImages);
      const updated = await api.updateProject(id, { [cfg.projectKey]: newImages });
      setProject(updated);
      toast(`Generated ${result.images.length} ${cfg.label} options!`);
    } catch (e) {
      toast(e.message || 'Generation failed', 'error');
    } finally {
      setGenerating(false);
    }
  }

  async function setFavorite(image) {
    const cfg = GEN_TYPES.find(t => t.value === selectedType);
    try {
      const updated = await api.updateProject(id, { [cfg.favoriteKey]: image });
      setProject(updated);
      toast(`${cfg.label} saved as favorite!`);
    } catch (e) {
      toast(e.message, 'error');
    }
  }

  function toggleRef(refId) {
    setSelectedRefs(s =>
      s.includes(refId) ? s.filter(r => r !== refId) : s.length < 3 ? [...s, refId] : s
    );
  }

  function downloadImage(url, type) {
    const a = document.createElement('a');
    a.href = url;
    a.download = `monsta-${type}-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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

  const cfg = GEN_TYPES.find(t => t.value === selectedType);
  const currentFav = project[cfg.favoriteKey];
  const refs = allRefs[selectedType] || [];

  return (
    <div style={{ maxWidth: 1200 }}>
      <Link to="/" className="back-link"><ArrowLeft size={16} /> All Projects</Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>{project.businessName}</h1>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
            <span className="badge badge-neon">{project.industry}</span>
            {project.location && <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>📍 {project.location}</span>}
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => setEditing(!editing)}>
          <Edit3 size={14} /> Edit Details
        </button>
      </div>

      {editing && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {['businessName', 'industry', 'location', 'personality', 'colors', 'styleNotes'].map(key => (
              <div className="form-group" key={key} style={{ marginBottom: 12 }}>
                <label>{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                <input value={editForm[key] || ''} onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
            {['promptDescription', 'mustHave', 'mustAvoid'].map(key => (
              <div className="form-group" key={key} style={{ gridColumn: key === 'promptDescription' ? '1 / -1' : 'auto', marginBottom: 12 }}>
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

      {/* Studio controls */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative' }}>
          <button
            className="btn btn-ghost"
            onClick={() => setShowTypeMenu(m => !m)}
            style={{ minWidth: 180, justifyContent: 'space-between' }}
          >
            <span style={{ fontWeight: 700 }}>Generate: {cfg.label}</span>
            <ChevronDown size={16} />
          </button>
          {showTypeMenu && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 50,
              background: '#1a1a1a', border: '1px solid #333', borderRadius: 10,
              overflow: 'hidden', minWidth: 180, boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
            }}>
              {GEN_TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => selectType(t.value)}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '11px 16px',
                    background: t.value === selectedType ? 'rgba(57,255,20,0.08)' : 'transparent',
                    color: t.value === selectedType ? 'var(--neon)' : 'var(--text)',
                    fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer'
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          className={`btn ${showRefs ? 'btn-outline' : 'btn-ghost'}`}
          onClick={() => setShowRefs(s => !s)}
        >
          <BookImage size={16} />
          References
          {selectedRefs.length > 0 && (
            <span className="badge badge-neon" style={{ marginLeft: 2 }}>{selectedRefs.length}</span>
          )}
        </button>

        <button className="btn btn-primary btn-lg" onClick={generate} disabled={generating}>
          {generating
            ? <><span className="loading-spinner" style={{ width: 18, height: 18 }} /> Generating...</>
            : <><Wand2 size={18} /> Generate 4 Options</>
          }
        </button>

        {images.length > 0 && !generating && (
          <button className="btn btn-ghost btn-sm" onClick={generate} disabled={generating}>
            <RefreshCw size={14} /> 4 More
          </button>
        )}
      </div>

      {/* Reference picker */}
      {showRefs && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700 }}>
              {cfg.label} References
              <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>(select up to 3)</span>
            </h3>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Link to="/library" style={{ fontSize: 13, color: 'var(--neon)' }}>+ Upload</Link>
              <button className="btn btn-ghost btn-xs" onClick={() => setShowRefs(false)}><X size={12} /></button>
            </div>
          </div>
          {refs.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              No {cfg.label.toLowerCase()} references yet. <Link to="/library">Upload some in the Reference Library.</Link>
            </p>
          ) : (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {refs.map(ref => (
                <div
                  key={ref.id}
                  onClick={() => toggleRef(ref.id)}
                  style={{
                    cursor: 'pointer', borderRadius: 10, overflow: 'hidden', width: 120,
                    border: `2px solid ${selectedRefs.includes(ref.id) ? 'var(--neon)' : '#2a2a2a'}`,
                    boxShadow: selectedRefs.includes(ref.id) ? '0 0 15px var(--neon-glow)' : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  <img src={ref.url} alt={ref.name} style={{ width: 120, height: 120, objectFit: 'cover', display: 'block' }} />
                  <div style={{ padding: '5px 8px', background: '#1a1a1a' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: selectedRefs.includes(ref.id) ? 'var(--neon)' : 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ref.name}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main generation window */}
      <div className="card" style={{ marginBottom: 20, minHeight: 420, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700 }}>
            {images.length > 0
              ? `${images.length} ${cfg.label} Option${images.length !== 1 ? 's' : ''}`
              : `${cfg.label} Generation`}
          </h2>
          {currentFav && <span className="badge badge-neon"><Star size={10} /> Favorite Selected</span>}
        </div>

        {images.length === 0 && !generating ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--text-muted)', gap: 12 }}>
            <Wand2 size={48} style={{ opacity: 0.15 }} />
            <p style={{ fontSize: 14 }}>Select a type above and click Generate</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
            {images.map(img => {
              const isFav = currentFav?.id === img.id;
              return (
                <div key={img.id} style={{
                  borderRadius: 10, overflow: 'hidden', position: 'relative',
                  border: `2px solid ${isFav ? 'var(--neon)' : '#2a2a2a'}`,
                  boxShadow: isFav ? '0 0 18px var(--neon-glow)' : 'none',
                  transition: 'all 0.2s',
                }}>
                  <img src={img.url} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
                  {isFav && (
                    <div style={{ position: 'absolute', top: 8, right: 8, background: 'var(--neon)', borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 800, color: '#000', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Star size={9} fill="#000" /> FAV
                    </div>
                  )}
                  <div style={{ padding: '8px 10px', display: 'flex', gap: 6, background: '#111' }}>
                    <button
                      className={`btn ${isFav ? 'btn-primary' : 'btn-outline'} btn-xs`}
                      style={{ flex: 1, justifyContent: 'center' }}
                      onClick={() => setFavorite(img)}
                    >
                      {isFav ? <><CheckCircle size={11} /> Saved</> : <><Star size={11} /> Favorite</>}
                    </button>
                    <button className="btn btn-ghost btn-xs" onClick={() => downloadImage(img.url, selectedType)}>
                      <Download size={11} />
                    </button>
                  </div>
                </div>
              );
            })}

            {generating && Array(4).fill(null).map((_, i) => (
              <div key={`loading-${i}`} style={{
                borderRadius: 10, border: '2px solid #222', background: '#111',
                aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: 10, minHeight: 220,
              }}>
                <span className="loading-spinner" style={{ width: 28, height: 28 }} />
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Generating...</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Favorite panels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {FAVORITE_PANELS.map(panel => {
          const fav = project[panel.key];
          return (
            <div key={panel.key} className="card" style={{
              padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
              borderColor: fav ? 'rgba(57,255,20,0.25)' : undefined, minHeight: 180,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {panel.label}
              </div>
              {fav ? (
                <>
                  <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(57,255,20,0.3)', width: '100%' }}>
                    <img src={fav.url} alt={panel.label} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span className="badge badge-neon" style={{ fontSize: 10 }}><Star size={9} /> Favorite</span>
                    <button className="btn btn-ghost btn-xs" onClick={() => downloadImage(fav.url, panel.key)}>
                      <Download size={11} />
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', border: '1px dashed #2a2a2a', borderRadius: 8, color: 'var(--text-muted)', fontSize: 12 }}>
                  Not selected
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
