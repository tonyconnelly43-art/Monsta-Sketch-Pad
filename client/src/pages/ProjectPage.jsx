import { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Wand2, Star, Download, CheckCircle,
  ChevronDown, BookImage, X, Edit3, Check, RefreshCw, Upload, Layers
} from 'lucide-react';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';

const GEN_TYPES = [
  { value: 'mascot',     label: 'Mascot',       refCategory: 'mascot',     projectKey: 'mascots',     favoriteKey: 'favoriteMascot' },
  { value: 'wordmark',   label: 'Wordmark',     refCategory: 'wordmark',   projectKey: 'wordmarks',   favoriteKey: 'favoriteWordmark' },
  { value: 'badge',      label: 'Badge',        refCategory: 'badge',      projectKey: 'badges',      favoriteKey: 'favoriteBadge' },
  { value: 'background', label: 'Background',   refCategory: 'background', projectKey: 'backgrounds', favoriteKey: 'favoriteBackground' },
];

const RULE_PROFILES = {
  mascot: [
    { key: 'animal-vector', label: 'Animal Vector', rules: 'OUTPUT FORMAT IS ALWAYS digital Procreate-style character concept art on a clean white background. Use VERY THICK, slightly textured blob-brush outlines, confident cartoon construction, and simple blocked-in value fills only. Animal-proportioned mascot with bold logo-like contrast and minimal color planes. Avoid generic AI tells: melted linework, extra limbs, inconsistent digits, random accessories.' },
    { key: 'human-mascot',  label: 'Human Mascot',  rules: 'Bold human mascot character in a confident dynamic pose. Thick cartoon outlines, exaggerated proportions, strong silhouette. Clean white background. The character should feel like a sports mascot — energetic, memorable, brand-ready. Simple blocked color fills, strong shadows.' },
    { key: 'human-vector',  label: 'Human Vector',  rules: 'Human mascot rendered in clean vector illustration style. Bold outlines, flat color blocking, minimal shading. Confident pose, trades-industry appropriate. Clean white background. Should read clearly at small sizes.' },
    { key: 'animal',        label: 'Animal',         rules: 'Realistic animal proportions but stylized into 2-3 flat planes that read as a brand mark or sports emblem. High contrast, bold outlines, limited color palette. Clean white background. Strong silhouette that works as a logo.' },
  ],
  wordmark: [
    { key: 'bold-block',  label: 'Bold Block', rules: 'Bold, thick block lettering with strong outlines and drop shadows. Sports/trades industry feel. High contrast. Clean white background. Letters should feel heavy and powerful, suitable for truck wraps and uniforms. Minimal decoration, maximum impact.' },
    { key: 'retro',       label: 'Retro',      rules: 'Retro-style wordmark with vintage typography. Arched or stacked lettering with classic trades industry aesthetic. Could include subtle distress texture. Clean white background. Timeless feel, not trendy.' },
    { key: 'script',      label: 'Script',     rules: 'Bold confident script lettering with thick brush strokes. Not overly ornate — clean and readable at small sizes. Strong baseline, good letter flow. Clean white background. Feels handcrafted and premium.' },
    { key: 'modern',      label: 'Modern',     rules: 'Clean modern sans-serif wordmark. Minimal and professional. Strong typographic hierarchy, precise geometry. Clean white background. Would work in black and white. Corporate but approachable.' },
  ],
  badge: [
    { key: 'shield',    label: 'Shield',    rules: 'Classic shield-shaped badge design. Bold outlines, strong typography inside the shield. Industry imagery integrated into the design. Clean white background. Should feel authoritative and trustworthy.' },
    { key: 'circular',  label: 'Circular',  rules: 'Circular emblem badge. Company name around the outer ring, bold icon or imagery in the center. Strong spoke or border detail. Clean white background. Works great on uniforms and vehicle decals.' },
    { key: 'crest',     label: 'Crest',     rules: 'Heraldic crest style badge. Professional and authoritative with strong symmetry. Industry-appropriate imagery in the main field. Clean white background. Premium feel suitable for high-end brand presentation.' },
    { key: 'patch',     label: 'Patch',     rules: 'Uniform patch style badge with merrow border. Bold typography and industry imagery. Clean white background. Designed to read well when embroidered or screen printed. Compact and bold.' },
  ],
  background: [
    { key: 'pattern', label: 'Pattern',  rules: 'Repeating seamless pattern background using industry-related icons and bold shapes. Graphic and tileable. Suitable for truck wraps and marketing materials. Strong color contrast, confident line weights.' },
    { key: 'scene',   label: 'Scene',    rules: 'Bold illustrative scene related to the trade industry. Dynamic composition, strong perspective, dramatic lighting. Full bleed, absolutely no text. Cinematic feel, high energy.' },
    { key: 'abstract',label: 'Abstract', rules: 'Abstract geometric background with bold shapes and strong color blocking. Modern, graphic, high energy. Sharp angles or dynamic curves. Suitable for brand backdrops and marketing collateral.' },
    { key: 'texture', label: 'Texture',  rules: 'Bold textured background with depth and dimension — could include metal, concrete, brushed surfaces, or industry-specific materials. Gritty and authentic. Professional and versatile for marketing use.' },
  ],
};

async function runGenerate(type, project, refs, sketchRules) {
  switch (type) {
    case 'mascot':     return api.generateMascots(project, refs, sketchRules);
    case 'wordmark':   return api.generateWordmarks(project, refs, sketchRules);
    case 'badge':      return api.generateBadges(project, refs, sketchRules);
    case 'background': return api.generateBackgrounds(project, refs, sketchRules);
    default: throw new Error('Unknown type');
  }
}

export default function ProjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const mascotUploadRef = useRef();
  const wordmarkUploadRef = useRef();
  const bgUploadRef = useRef();

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

  const [selectedRule, setSelectedRule] = useState(null);
  const [sketchRules, setSketchRules] = useState('');

  // Mockup Lab state
  const [mockupMascot, setMockupMascot] = useState(null);
  const [mockupWordmark, setMockupWordmark] = useState(null);
  const [mockupBackground, setMockupBackground] = useState(null);
  const [showPickModal, setShowPickModal] = useState(null); // 'mascot'|'wordmark'|'background'
  const [composing, setComposing] = useState(false);

  useEffect(() => { loadProject(); }, [id]);

  useEffect(() => {
    if (selectedType) loadRefs(selectedType);
    setSelectedRefs([]);
    setSelectedRule(null);
    setSketchRules('');
  }, [selectedType]);

  async function loadProject() {
    try {
      const data = await api.getProject(id);
      setProject(data);
      setEditForm(data);
      setImages(data['mascots'] || []);
      // Pre-fill mockup lab from favorites
      if (data.favoriteMascot) setMockupMascot(data.favoriteMascot);
      if (data.favoriteWordmark) setMockupWordmark(data.favoriteWordmark);
      if (data.favoriteBackground) setMockupBackground(data.favoriteBackground);
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

  function selectRule(rule) {
    setSelectedRule(rule.key);
    setSketchRules(rule.rules);
  }

  async function generate() {
    if (!project) return;
    setGenerating(true);
    try {
      const cfg = GEN_TYPES.find(t => t.value === selectedType);
      const refData = (selectedRefs || [])
        .map(rid => (allRefs[selectedType] || []).find(r => r.id === rid))
        .filter(Boolean);
      const result = await runGenerate(selectedType, project, refData, sketchRules);
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

  async function handleMockupUpload(e, slot) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const ref = await api.uploadReference(file, { name: file.name, category: slot, tags: '' });
      const img = { id: ref.id, url: ref.url };
      if (slot === 'mascot') setMockupMascot(img);
      if (slot === 'wordmark') setMockupWordmark(img);
      if (slot === 'background') setMockupBackground(img);
    } catch (e) {
      toast('Upload failed', 'error');
    }
  }

  async function composeFull() {
    if (!mockupMascot || !mockupWordmark || !mockupBackground) return;
    setComposing(true);
    try {
      const result = await api.generateFullBrand(
        project,
        mockupWordmark.url,
        mockupMascot.url,
        mockupBackground.url,
      );
      const cfg = GEN_TYPES.find(t => t.value === 'mascot');
      const existing = project.fullBrands || [];
      const newImages = [...existing, ...result.images];
      const updated = await api.updateProject(id, { fullBrands: newImages });
      setProject(updated);
      toast('Full brand composed!');
    } catch (e) {
      toast(e.message || 'Compose failed', 'error');
    } finally {
      setComposing(false);
    }
  }

  // Images available to pick for mockup lab
  function getPickImages(slot) {
    if (!project) return [];
    if (slot === 'mascot') return project.mascots || [];
    if (slot === 'wordmark') return [...(project.wordmarks || []), ...(project.badges || [])];
    if (slot === 'background') return project.backgrounds || [];
    return [];
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
  const ruleProfiles = RULE_PROFILES[selectedType] || [];
  const mockupReady = mockupMascot && mockupWordmark && mockupBackground;

  return (
    <div style={{ maxWidth: 1200 }}>
      <Link to="/" className="back-link"><ArrowLeft size={16} /> All Projects</Link>

      {/* Header */}
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

      {/* Edit panel */}
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
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
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
                <button key={t.value} onClick={() => selectType(t.value)} style={{
                  display: 'block', width: '100%', textAlign: 'left', padding: '11px 16px',
                  background: t.value === selectedType ? 'rgba(57,255,20,0.08)' : 'transparent',
                  color: t.value === selectedType ? 'var(--neon)' : 'var(--text)',
                  fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer'
                }}>
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button className={`btn ${showRefs ? 'btn-outline' : 'btn-ghost'}`} onClick={() => setShowRefs(s => !s)}>
          <BookImage size={16} /> References
          {selectedRefs.length > 0 && <span className="badge badge-neon" style={{ marginLeft: 2 }}>{selectedRefs.length}</span>}
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

      {/* Rule Profile */}
      <div className="card" style={{ marginBottom: 16, padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div style={{ flex: '0 0 auto' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Rule Profile</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, minWidth: 280 }}>
              {ruleProfiles.map(rule => (
                <button
                  key={rule.key}
                  onClick={() => selectRule(rule)}
                  style={{
                    padding: '7px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer',
                    background: selectedRule === rule.key ? '#cc1a1a' : '#1a1a1a',
                    color: selectedRule === rule.key ? '#fff' : 'var(--text-muted)',
                    border: `1px solid ${selectedRule === rule.key ? '#cc1a1a' : '#333'}`,
                    transition: 'all 0.15s',
                  }}
                >
                  {rule.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
              Sketch Rules <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(sent with every generation)</span>
            </div>
            <textarea
              value={sketchRules}
              onChange={e => setSketchRules(e.target.value)}
              placeholder="Select a rule profile above, or type custom generation rules here..."
              style={{ minHeight: 90, fontSize: 12, resize: 'vertical' }}
            />
          </div>
        </div>
      </div>

      {/* Reference picker */}
      {showRefs && (
        <div className="card" style={{ marginBottom: 16 }}>
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
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No {cfg.label.toLowerCase()} references yet. <Link to="/library">Upload some in the Reference Library.</Link></p>
          ) : (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {refs.map(ref => (
                <div key={ref.id} onClick={() => toggleRef(ref.id)} style={{
                  cursor: 'pointer', borderRadius: 10, overflow: 'hidden', width: 120,
                  border: `2px solid ${selectedRefs.includes(ref.id) ? 'var(--neon)' : '#2a2a2a'}`,
                  boxShadow: selectedRefs.includes(ref.id) ? '0 0 15px var(--neon-glow)' : 'none',
                  transition: 'all 0.2s',
                }}>
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
      <div className="card" style={{ marginBottom: 20, minHeight: 400, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700 }}>
            {images.length > 0 ? `${images.length} ${cfg.label} Option${images.length !== 1 ? 's' : ''}` : `${cfg.label} Generation`}
          </h2>
          {currentFav && <span className="badge badge-neon"><Star size={10} /> Favorite Selected</span>}
        </div>

        {images.length === 0 && !generating ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 280, color: 'var(--text-muted)', gap: 12 }}>
            <Wand2 size={48} style={{ opacity: 0.15 }} />
            <p style={{ fontSize: 14 }}>Select a rule profile and click Generate</p>
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

      {/* Mockup Lab */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Layers size={16} color="#cc1a1a" />
            <span style={{ fontWeight: 800, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Mockup Lab</span>
          </div>
          {mockupReady && (
            <button className="btn btn-primary" onClick={composeFull} disabled={composing}>
              {composing
                ? <><span className="loading-spinner" style={{ width: 16, height: 16 }} /> Composing...</>
                : <><Layers size={16} /> Compose Full Brand</>
              }
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { key: 'mascot',     label: 'Mascot',          sub: 'Character or animal',   state: mockupMascot,     set: setMockupMascot,     ref: mascotUploadRef },
            { key: 'wordmark',   label: 'Logo / Wordmark', sub: 'Badge or letterform',   state: mockupWordmark,   set: setMockupWordmark,   ref: wordmarkUploadRef },
            { key: 'background', label: 'Background',      sub: 'Pattern or accents',    state: mockupBackground, set: setMockupBackground, ref: bgUploadRef },
          ].map(slot => (
            <div key={slot.key} style={{
              border: '1px solid #2a2a2a', borderRadius: 10, overflow: 'hidden',
              background: '#0d0d0d',
            }}>
              <div style={{ padding: '12px 14px', borderBottom: '1px solid #1a1a1a' }}>
                <div style={{ fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{slot.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{slot.sub}</div>
              </div>

              <div style={{ aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', position: 'relative' }}>
                {slot.state ? (
                  <>
                    <img src={slot.state.url} alt={slot.label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    <button
                      onClick={() => slot.set(null)}
                      style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
                    >
                      <X size={12} />
                    </button>
                  </>
                ) : (
                  <span style={{ color: '#333', fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Empty</span>
                )}
              </div>

              <div style={{ display: 'flex', borderTop: '1px solid #1a1a1a' }}>
                <button
                  onClick={() => setShowPickModal(slot.key)}
                  style={{ flex: 1, padding: '10px', background: 'transparent', border: 'none', borderRight: '1px solid #1a1a1a', color: 'var(--text-muted)', fontSize: 12, fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em' }}
                >
                  Pick
                </button>
                <input type="file" accept="image/*" ref={slot.ref} style={{ display: 'none' }} onChange={e => handleMockupUpload(e, slot.key)} />
                <button
                  onClick={() => slot.ref.current?.click()}
                  style={{ flex: 1, padding: '10px', background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}
                >
                  <Upload size={12} /> Upload
                </button>
              </div>
            </div>
          ))}
        </div>

        {!mockupReady && (
          <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 14 }}>
            Pick at least one of mascot, logo, or background to start composing.
          </p>
        )}

        {/* Full brand results */}
        {project.fullBrands?.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Full Brand Compositions</div>
            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
              {project.fullBrands.map(img => (
                <div key={img.id} style={{ flex: '0 0 200px', borderRadius: 8, overflow: 'hidden', border: '1px solid #2a2a2a' }}>
                  <img src={img.url} alt="" style={{ width: 200, height: 120, objectFit: 'cover', display: 'block' }} />
                  <div style={{ padding: '6px 8px', background: '#111', display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn btn-ghost btn-xs" onClick={() => downloadImage(img.url, 'full-brand')}><Download size={11} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pick Modal */}
      {showPickModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="card" style={{ width: '100%', maxWidth: 700, maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Pick {showPickModal}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowPickModal(null)}><X size={14} /></button>
            </div>
            {getPickImages(showPickModal).length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No generated images yet for this slot. Generate some first.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
                {getPickImages(showPickModal).map(img => (
                  <div key={img.id} onClick={() => {
                    if (showPickModal === 'mascot') setMockupMascot(img);
                    if (showPickModal === 'wordmark') setMockupWordmark(img);
                    if (showPickModal === 'background') setMockupBackground(img);
                    setShowPickModal(null);
                  }} style={{ cursor: 'pointer', borderRadius: 8, overflow: 'hidden', border: '2px solid #2a2a2a', transition: 'border-color 0.2s' }}
                    onMouseOver={e => e.currentTarget.style.borderColor = 'var(--neon)'}
                    onMouseOut={e => e.currentTarget.style.borderColor = '#2a2a2a'}
                  >
                    <img src={img.url} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
