import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Wand2, Star, RefreshCw, BookImage, CheckCircle, Download } from 'lucide-react';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';

const CONFIG = {
  wordmarks: {
    label: 'Wordmark',
    plural: 'Wordmarks',
    desc: 'Generate 4 wordmark options for your brand. Each generation uses 4 separate DALL-E API calls.',
    generate: (project, refs) => api.generateWordmarks(project, refs),
    projectKey: 'wordmarks',
    favoriteKey: 'favoriteWordmark',
    refCategory: 'wordmark',
  },
  mascots: {
    label: 'Mascot',
    plural: 'Mascots',
    desc: 'Generate 4 mascot character options. Bold cartoon-style brand characters.',
    generate: (project, refs) => api.generateMascots(project, refs),
    projectKey: 'mascots',
    favoriteKey: 'favoriteMascot',
    refCategory: 'mascot',
  },
  backgrounds: {
    label: 'Background',
    plural: 'Backgrounds',
    desc: 'Generate 4 background/scene options for brand backdrops and marketing materials.',
    generate: (project, refs) => api.generateBackgrounds(project, refs),
    projectKey: 'backgrounds',
    favoriteKey: 'favoriteBackground',
    refCategory: 'background',
  },
  'full-brand': {
    label: 'Full Brand',
    plural: 'Full Brand Concepts',
    desc: 'Generate 4 complete brand compositions combining your selected wordmark, mascot, and background.',
    generate: (project) => api.generateFullBrand(
      project,
      project.favoriteWordmark?.url,
      project.favoriteMascot?.url,
      project.favoriteBackground?.url,
    ),
    projectKey: 'fullBrands',
    favoriteKey: 'favoriteFull',
    refCategory: 'full',
  },
};

export default function GeneratePage({ type }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const config = CONFIG[type];

  const [project, setProject] = useState(null);
  const [references, setReferences] = useState([]);
  const [selectedRefs, setSelectedRefs] = useState([]);
  const [showRefPicker, setShowRefPicker] = useState(false);
  const [images, setImages] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [favorite, setFavorite] = useState(null);

  useEffect(() => {
    loadData();
  }, [id, type]);

  async function loadData() {
    try {
      const [proj, refs] = await Promise.all([
        api.getProject(id),
        api.getReferences(config.refCategory),
      ]);
      setProject(proj);
      setImages(proj[config.projectKey] || []);
      setFavorite(proj[config.favoriteKey]);
      setReferences(refs);
    } catch (e) {
      toast('Failed to load data', 'error');
    }
  }

  async function generate() {
    if (!project) return;
    setGenerating(true);
    try {
      const refData = selectedRefs.map(id => references.find(r => r.id === id)).filter(Boolean);
      const result = await config.generate(project, refData);
      const newImages = [...images, ...result.images];
      setImages(newImages);
      const updated = await api.updateProject(id, { [config.projectKey]: newImages });
      setProject(updated);
      toast(`Generated ${result.images.length} new ${config.label} options!`);
    } catch (e) {
      toast(e.message || 'Generation failed', 'error');
    } finally {
      setGenerating(false);
    }
  }

  async function setAsFavorite(image) {
    try {
      const updated = await api.updateProject(id, { [config.favoriteKey]: image });
      setProject(updated);
      setFavorite(image);
      toast(`${config.label} saved as favorite!`);
    } catch (e) {
      toast(e.message, 'error');
    }
  }

  function toggleRef(refId) {
    setSelectedRefs(s =>
      s.includes(refId)
        ? s.filter(r => r !== refId)
        : s.length < 3 ? [...s, refId] : s
    );
  }

  function downloadImage(url) {
    const a = document.createElement('a');
    a.href = url;
    a.download = `monsta-${type}-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  if (!project) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <span className="loading-spinner" style={{ width: 36, height: 36 }} />
    </div>
  );

  return (
    <div>
      <Link to={`/project/${id}`} className="back-link"><ArrowLeft size={16} /> {project.businessName}</Link>

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            Generate {config.plural}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{config.desc}</p>
        </div>
      </div>

      {/* Project brief strip */}
      <div className="card" style={{ marginBottom: 24, display: 'flex', gap: 24, flexWrap: 'wrap', padding: '16px 24px' }}>
        <Chip label="Business" value={project.businessName} />
        <Chip label="Industry" value={project.industry} />
        {project.colors && <Chip label="Colors" value={project.colors} />}
        {project.personality && <Chip label="Personality" value={project.personality} />}
      </div>

      {/* Actions bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          className="btn btn-primary btn-lg"
          onClick={generate}
          disabled={generating}
        >
          {generating
            ? <><span className="loading-spinner" style={{ width: 18, height: 18 }} /> Generating 4 options...</>
            : <><Wand2 size={18} /> Generate 4 Options</>
          }
        </button>

        {references.length > 0 && (
          <button className="btn btn-ghost" onClick={() => setShowRefPicker(!showRefPicker)}>
            <BookImage size={16} />
            Reference Images
            {selectedRefs.length > 0 && (
              <span className="badge badge-neon" style={{ marginLeft: 4 }}>{selectedRefs.length}</span>
            )}
          </button>
        )}

        {favorite && (
          <span className="badge badge-neon" style={{ padding: '8px 14px', fontSize: 13 }}>
            <Star size={13} /> Favorite Selected
          </span>
        )}
      </div>

      {/* Reference picker */}
      {showRefPicker && references.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>
              Select Reference Images <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 13 }}>(up to 3)</span>
            </h3>
            <Link to="/library" style={{ fontSize: 13 }}>+ Add references</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
            {references.map(ref => (
              <div
                key={ref.id}
                onClick={() => toggleRef(ref.id)}
                style={{
                  cursor: 'pointer',
                  borderRadius: 10,
                  overflow: 'hidden',
                  border: `2px solid ${selectedRefs.includes(ref.id) ? 'var(--neon)' : '#2a2a2a'}`,
                  boxShadow: selectedRefs.includes(ref.id) ? '0 0 15px var(--neon-glow)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                <img src={ref.url} alt={ref.name} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
                <div style={{ padding: '6px 8px', background: '#1a1a1a' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: selectedRefs.includes(ref.id) ? 'var(--neon)' : 'var(--text)' }}>{ref.name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current favorite display */}
      {favorite && (
        <div className="card" style={{ marginBottom: 24, display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          <div style={{ borderRadius: 10, overflow: 'hidden', border: '2px solid var(--neon)', boxShadow: '0 0 20px var(--neon-glow)', flex: '0 0 160px' }}>
            <img src={favorite.url} alt="Favorite" style={{ width: 160, height: 160, objectFit: 'cover', display: 'block' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Star size={16} color="var(--neon)" fill="var(--neon)" />
              <span style={{ fontWeight: 700, fontSize: 16 }}>Current Favorite {config.label}</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>
              This image will be used in the Full Brand generation. You can select a different one from the options below.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-outline btn-sm" onClick={() => downloadImage(favorite.url)}>
                <Download size={14} /> Download
              </button>
              {type === 'full-brand' && (
                <Link to={`/project/${id}`} className="btn btn-ghost btn-sm">
                  View Project
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Generated images grid */}
      {images.length === 0 && !generating ? (
        <div className="empty-state">
          <Wand2 size={64} />
          <h3>No {config.plural} Generated Yet</h3>
          <p>Click "Generate 4 Options" to create {config.label.toLowerCase()} concepts using AI</p>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>{images.length} Option{images.length !== 1 ? 's' : ''} Generated</h2>
            {images.length > 0 && (
              <button className="btn btn-ghost btn-sm" onClick={generate} disabled={generating}>
                <RefreshCw size={14} /> Generate 4 More
              </button>
            )}
          </div>

          <div className="image-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {images.map(img => {
              const isFav = favorite?.id === img.id;
              return (
                <div key={img.id} className={`image-card ${isFav ? 'favorite' : ''}`}>
                  <img src={img.url} alt={`${config.label} option`} />
                  {isFav && (
                    <div style={{ position: 'absolute', top: 10, right: 10, background: 'var(--neon)', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: '#000', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Star size={10} fill="#000" /> FAVORITE
                    </div>
                  )}
                  <div className="image-card-actions">
                    <button
                      className={`btn ${isFav ? 'btn-primary' : 'btn-outline'} btn-sm`}
                      onClick={() => setAsFavorite(img)}
                    >
                      {isFav ? <><CheckCircle size={13} /> Saved</> : <><Star size={13} /> Save Favorite</>}
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => downloadImage(img.url)}>
                      <Download size={13} />
                    </button>
                  </div>
                </div>
              );
            })}

            {generating && (
              Array(4).fill(null).map((_, i) => (
                <div key={`loading-${i}`} className="image-card" style={{ aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', minHeight: 280 }}>
                  <div style={{ textAlign: 'center' }}>
                    <span className="loading-spinner" style={{ width: 32, height: 32 }} />
                    <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 12 }}>Generating...</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Chip({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 500 }}>{value}</div>
    </div>
  );
}
