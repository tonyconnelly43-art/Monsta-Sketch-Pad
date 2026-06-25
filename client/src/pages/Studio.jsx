import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Wand2, Star, Download, CheckCircle, X, Upload, Layers, Edit3, Check, RefreshCw, Plus, ChevronDown, Trash2 } from 'lucide-react';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';

const INDUSTRIES = [
  'HVAC', 'Plumbing', 'Electrical', 'Garage Door', 'Pressure Washing',
  'Pest Control', 'Landscaping', 'Roofing', 'Painting', 'Flooring',
  'Cleaning Services', 'Handyman', 'Pool Service', 'Tree Service', 'Other'
];

const GEN_TYPES = [
  { value: 'mascot',     label: 'Mascot',     refCategory: 'mascot',     projectKey: 'mascots',     favoriteKey: 'favoriteMascot' },
  { value: 'wordmark',   label: 'Wordmark',   refCategory: 'wordmark',   projectKey: 'wordmarks',   favoriteKey: 'favoriteWordmark' },
  { value: 'badge',      label: 'Badge',      refCategory: 'badge',      projectKey: 'badges',      favoriteKey: 'favoriteBadge' },
  { value: 'background', label: 'Background', refCategory: 'background', projectKey: 'backgrounds', favoriteKey: 'favoriteBackground' },
];

const RULE_PROFILES = {
  mascot: [
    { key: 'animal-vector', label: 'Animal Vector', rules: 'OUTPUT FORMAT IS ALWAYS digital Procreate-style character concept art on a clean white background. Use VERY THICK, slightly textured blob-brush outlines, confident cartoon construction, and simple blocked-in value fills only. Animal-proportioned mascot with bold logo-like contrast and minimal color planes. Avoid generic AI tells: melted linework, extra limbs, inconsistent digits, random accessories.' },
    { key: 'human-mascot',  label: 'Human Mascot',  rules: 'Bold human mascot character in a confident dynamic pose. Thick cartoon outlines, exaggerated proportions, strong silhouette. Clean white background. The character should feel like a sports mascot — energetic, memorable, brand-ready. Simple blocked color fills, strong shadows.' },
    { key: 'human-vector',  label: 'Human Vector',  rules: 'Human mascot rendered in clean vector illustration style. Bold outlines, flat color blocking, minimal shading. Confident pose, trades-industry appropriate. Clean white background. Should read clearly at small sizes.' },
    { key: 'animal',        label: 'Animal',        rules: 'Realistic animal proportions but stylized into 2-3 flat planes that read as a brand mark or sports emblem. High contrast, bold outlines, limited color palette. Clean white background. Strong silhouette that works as a logo.' },
  ],
  wordmark: [
    { key: 'bold-block', label: 'Bold Block', rules: 'Bold, thick block lettering with strong outlines and drop shadows. Sports/trades industry feel. High contrast. Clean white background. Letters should feel heavy and powerful, suitable for truck wraps and uniforms. Minimal decoration, maximum impact.' },
    { key: 'retro',      label: 'Retro',      rules: 'Retro-style wordmark with vintage typography. Arched or stacked lettering with classic trades industry aesthetic. Could include subtle distress texture. Clean white background. Timeless feel, not trendy.' },
    { key: 'script',     label: 'Script',     rules: 'Bold confident script lettering with thick brush strokes. Not overly ornate — clean and readable at small sizes. Strong baseline, good letter flow. Clean white background. Feels handcrafted and premium.' },
    { key: 'modern',     label: 'Modern',     rules: 'Clean modern sans-serif wordmark. Minimal and professional. Strong typographic hierarchy, precise geometry. Clean white background. Would work in black and white. Corporate but approachable.' },
  ],
  badge: [
    { key: 'shield',   label: 'Shield',   rules: 'Classic shield-shaped badge design. Bold outlines, strong typography inside the shield. Industry imagery integrated into the design. Clean white background. Should feel authoritative and trustworthy.' },
    { key: 'circular', label: 'Circular', rules: 'Circular emblem badge. Company name around the outer ring, bold icon or imagery in the center. Strong spoke or border detail. Clean white background. Works great on uniforms and vehicle decals.' },
    { key: 'crest',    label: 'Crest',    rules: 'Heraldic crest style badge. Professional and authoritative with strong symmetry. Industry-appropriate imagery in the main field. Clean white background. Premium feel suitable for high-end brand presentation.' },
    { key: 'patch',    label: 'Patch',    rules: 'Uniform patch style badge with merrow border. Bold typography and industry imagery. Clean white background. Designed to read well when embroidered or screen printed. Compact and bold.' },
  ],
  background: [
    { key: 'pattern',  label: 'Pattern',  rules: 'Repeating seamless pattern background using industry-related icons and bold shapes. Graphic and tileable. Suitable for truck wraps and marketing materials. Strong color contrast, confident line weights.' },
    { key: 'scene',    label: 'Scene',    rules: 'Bold illustrative scene related to the trade industry. Dynamic composition, strong perspective, dramatic lighting. Full bleed, absolutely no text. Cinematic feel, high energy.' },
    { key: 'abstract', label: 'Abstract', rules: 'Abstract geometric background with bold shapes and strong color blocking. Modern, graphic, high energy. Sharp angles or dynamic curves. Suitable for brand backdrops and marketing collateral.' },
    { key: 'texture',  label: 'Texture',  rules: 'Bold textured background with depth and dimension — metal, concrete, brushed surfaces, or industry-specific materials. Gritty and authentic. Professional and versatile for marketing use.' },
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

const PL = { fontSize: 10, fontWeight: 800, color: '#666', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 };

export default function Studio() {
  const toast = useToast();
  const mascotUploadRef = useRef();
  const wordmarkUploadRef = useRef();
  const bgUploadRef = useRef();
  const saveRulesTimer = useRef(null);

  // Projects
  const [projects, setProjects] = useState([]);
  const [project, setProject] = useState(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newForm, setNewForm] = useState({ businessName: '', industry: '', location: '', personality: '', colors: '', styleNotes: '', promptDescription: '', mustHave: '', mustAvoid: '' });

  // Edit
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  // Studio state
  const [selectedType, setSelectedType] = useState('mascot');
  const [selectedRule, setSelectedRule] = useState(null);
  const [sketchRules, setSketchRules] = useState('');
  const [subject, setSubject] = useState('');
  const [audience, setAudience] = useState('');
  const [clientBrief, setClientBrief] = useState('');
  const [strategy, setStrategy] = useState('');

  const [allRefs, setAllRefs] = useState({});
  const [selectedRefs, setSelectedRefs] = useState([]);
  const [images, setImages] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [focusedImage, setFocusedImage] = useState(null);

  const [mockupMascot, setMockupMascot] = useState(null);
  const [mockupWordmark, setMockupWordmark] = useState(null);
  const [mockupBackground, setMockupBackground] = useState(null);
  const [showPickModal, setShowPickModal] = useState(null);
  const [composing, setComposing] = useState(false);
  const [rulesLocked, setRulesLocked] = useState(true);

  // Load all projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  // When project changes, sync studio state
  useEffect(() => {
    if (!project) return;
    setEditForm(project);
    setSubject(project.businessName || '');
    setAudience(project.personality || '');
    setClientBrief(project.promptDescription || '');
    setStrategy(project.styleNotes || '');
    setImages(project['mascots'] || []);
    setFocusedImage(null);
    setSelectedType('mascot');
    setSelectedRule(null);
    setSketchRules(project.sketchRulesMap?.['mascot'] || '');
    setSelectedRefs([]);
    setMockupMascot(project.favoriteMascot || null);
    setMockupWordmark(project.favoriteWordmark || null);
    setMockupBackground(project.favoriteBackground || null);
    loadRefs('mascot');
  }, [project?.id]);

  // Reload refs when type switches
  useEffect(() => {
    if (!project) return;
    setSelectedRefs([]);
    setSelectedRule(null);
    setSketchRules(project?.sketchRulesMap?.[selectedType] || '');
    setRulesLocked(true);
    loadRefs(selectedType);
  }, [selectedType]);

  async function loadProjects() {
    try {
      const data = await api.getProjects();
      const list = data.reverse();
      setProjects(list);
      if (list.length > 0) setProject(list[0]);
    } catch {
      toast('Failed to load projects', 'error');
    } finally {
      setLoadingProjects(false);
    }
  }

  async function createProject(e) {
    e.preventDefault();
    if (!newForm.businessName.trim() || !newForm.industry) {
      toast('Business name and industry are required', 'error');
      return;
    }
    setCreating(true);
    try {
      const created = await api.createProject(newForm);
      const list = [created, ...projects];
      setProjects(list);
      setProject(created);
      setShowNewProject(false);
      setNewForm({ businessName: '', industry: '', location: '', personality: '', colors: '', styleNotes: '', promptDescription: '', mustHave: '', mustAvoid: '' });
      toast('Project created!');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setCreating(false);
    }
  }

  async function deleteCurrentProject() {
    if (!project) return;
    if (!confirm(`Delete "${project.businessName}"? This cannot be undone.`)) return;
    try {
      await api.deleteProject(project.id);
      const list = projects.filter(p => p.id !== project.id);
      setProjects(list);
      setProject(list[0] || null);
      toast('Project deleted');
    } catch (e) {
      toast(e.message, 'error');
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
    const cfg = GEN_TYPES.find(t => t.value === type);
    setImages(project?.[cfg.projectKey] || []);
    setFocusedImage(null);
    loadRefs(type);
  }

  function selectRule(rule) {
    setSelectedRule(rule.key);
    setSketchRules(rule.rules);
    persistSketchRules(selectedType, rule.rules);
  }

  function persistSketchRules(type, rules) {
    if (saveRulesTimer.current) clearTimeout(saveRulesTimer.current);
    saveRulesTimer.current = setTimeout(async () => {
      if (!project) return;
      try {
        const newMap = { ...(project?.sketchRulesMap || {}), [type]: rules };
        const updated = await api.updateProject(project.id, { sketchRulesMap: newMap });
        setProject(updated);
      } catch {}
    }, 800);
  }

  function toggleRef(refId) {
    setSelectedRefs(s =>
      s.includes(refId) ? s.filter(r => r !== refId) : s.length < 5 ? [...s, refId] : s
    );
  }

  async function generate() {
    if (!project) return;
    setGenerating(true);
    try {
      const cfg = GEN_TYPES.find(t => t.value === selectedType);
      const refData = selectedRefs.map(rid => (allRefs[selectedType] || []).find(r => r.id === rid)).filter(Boolean);
      const merged = { ...project, promptDescription: clientBrief || project.promptDescription, personality: audience || project.personality, styleNotes: strategy || project.styleNotes };
      const result = await runGenerate(selectedType, merged, refData, sketchRules);
      const newImages = [...images, ...result.images];
      setImages(newImages);
      setFocusedImage(result.images[0]);
      const updated = await api.updateProject(project.id, { [cfg.projectKey]: newImages });
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
      const updated = await api.updateProject(project.id, { [cfg.favoriteKey]: image });
      setProject(updated);
      toast(`${cfg.label} saved as favorite!`);
    } catch (e) {
      toast(e.message, 'error');
    }
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
      const updated = await api.updateProject(project.id, editForm);
      setProject(updated);
      setProjects(ps => ps.map(p => p.id === updated.id ? updated : p));
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
    } catch { toast('Upload failed', 'error'); }
  }

  async function composeFull() {
    if (!mockupMascot || !mockupWordmark || !mockupBackground) return;
    setComposing(true);
    try {
      const result = await api.generateFullBrand(project, mockupWordmark.url, mockupMascot.url, mockupBackground.url);
      const existing = project.fullBrands || [];
      const newImages = [...existing, ...result.images];
      const updated = await api.updateProject(project.id, { fullBrands: newImages });
      setProject(updated);
      toast('Full brand composed!');
    } catch (e) {
      toast(e.message || 'Compose failed', 'error');
    } finally {
      setComposing(false);
    }
  }

  function getPickImages(slot) {
    if (!project) return [];
    if (slot === 'mascot') return project.mascots || [];
    if (slot === 'wordmark') return [...(project.wordmarks || []), ...(project.badges || [])];
    if (slot === 'background') return project.backgrounds || [];
    return [];
  }

  if (loadingProjects) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 120 }}>
      <span className="loading-spinner" style={{ width: 36, height: 36 }} />
    </div>
  );

  const cfg = project ? GEN_TYPES.find(t => t.value === selectedType) : null;
  const currentFav = project?.[cfg?.favoriteKey];
  const refs = allRefs[selectedType] || [];
  const ruleProfiles = RULE_PROFILES[selectedType] || [];
  const mockupReady = mockupMascot && mockupWordmark && mockupBackground;
  const displayImage = focusedImage || images[images.length - 1] || null;

  return (
    <div style={{ minHeight: '100vh' }}>

      {/* Studio Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 15, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Monsta Sketch Studio</div>
          <div style={{ color: '#555', fontSize: 11, marginTop: 1 }}>Clean digital concept sheets, editable profile rules</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Project selector */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowProjectMenu(v => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0f2a38', border: '1px solid #2a2a2a', borderRadius: 6, padding: '8px 14px', color: '#f0f0f0', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
            >
              {project ? project.businessName : 'Select Project'}
              <ChevronDown size={14} />
            </button>
            {showProjectMenu && (
              <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, background: '#071a22', border: '1px solid #2a2a2a', borderRadius: 8, minWidth: 220, zIndex: 100, overflow: 'hidden' }}>
                {projects.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { setProject(p); setShowProjectMenu(false); }}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', background: project?.id === p.id ? 'rgba(57,255,20,0.08)' : 'transparent', color: project?.id === p.id ? 'var(--neon)' : '#ccc', fontSize: 13, border: 'none', cursor: 'pointer', borderBottom: '1px solid #1a1a1a' }}
                  >
                    {p.businessName} <span style={{ color: '#555', fontSize: 11 }}>· {p.industry}</span>
                  </button>
                ))}
                <button
                  onClick={() => { setShowProjectMenu(false); setShowNewProject(true); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', textAlign: 'left', padding: '10px 14px', background: 'transparent', color: 'var(--neon)', fontSize: 13, border: 'none', cursor: 'pointer', fontWeight: 700 }}
                >
                  <Plus size={13} /> New Project
                </button>
              </div>
            )}
          </div>

          <Link to="/library" className="btn btn-danger btn-sm">Open Reference Vault</Link>
          <Link to="/library" className="btn btn-ghost btn-sm">Reference Pull</Link>

          {project && (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditing(!editing)}><Edit3 size={13} /> Edit</button>
              <button className="btn btn-ghost btn-sm" onClick={deleteCurrentProject} style={{ color: '#cc3333' }}><Trash2 size={13} /></button>
            </>
          )}
        </div>
      </div>

      {/* Edit panel */}
      {editing && project && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {['businessName', 'industry', 'location', 'personality', 'colors', 'styleNotes'].map(key => (
              <div className="form-group" key={key} style={{ marginBottom: 8 }}>
                <label>{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                <input value={editForm[key] || ''} onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
            {['promptDescription', 'mustHave', 'mustAvoid'].map(key => (
              <div className="form-group" key={key} style={{ gridColumn: key === 'promptDescription' ? '1 / -1' : 'auto', marginBottom: 8 }}>
                <label>{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                {key === 'promptDescription'
                  ? <textarea value={editForm[key] || ''} onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))} />
                  : <input value={editForm[key] || ''} onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))} />
                }
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}><X size={13} /> Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={saveEdit}><Check size={13} /> Save</button>
          </div>
        </div>
      )}

      {/* No project state */}
      {!project && !showNewProject && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 16 }}>
          <Wand2 size={52} style={{ opacity: 0.15 }} />
          <p style={{ color: '#555', fontSize: 14 }}>No projects yet — create one to get started</p>
          <button className="btn btn-primary" onClick={() => setShowNewProject(true)}><Plus size={16} /> New Project</button>
        </div>
      )}

      {/* 3-column studio */}
      {project && (
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 280px', gap: 12, alignItems: 'start' }}>

          {/* LEFT: References + Rule Profile + Sketch Rules */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div style={{ background: '#0d2330', border: '1px solid #1a3d50', borderRadius: 10, overflow: 'hidden' }}>

              {/* References */}
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #1a3d50' }}>
                <div style={PL}>References</div>
                <div style={{ display: 'flex', gap: 20, marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--neon)' }}>{refs.length}</div>
                    <div style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Vault</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 900 }}>{selectedRefs.length}</div>
                    <div style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Selected</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Link to="/library" className="btn btn-danger btn-sm" style={{ flex: 1, justifyContent: 'center', fontSize: 11 }}>Open Vault</Link>
                  <button className="btn btn-ghost btn-sm" style={{ flex: 1, fontSize: 11 }} onClick={() => setSelectedRefs([])} disabled={selectedRefs.length === 0}>Pull Refs</button>
                </div>
              </div>

              {/* Rule Profile */}
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #1a3d50' }}>
                <div style={PL}>Rule Profile</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                  {ruleProfiles.map(rule => (
                    <button
                      key={rule.key}
                      onClick={() => selectRule(rule)}
                      style={{
                        padding: '7px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer',
                        background: selectedRule === rule.key ? '#cc1a1a' : '#1a1a1a',
                        color: selectedRule === rule.key ? '#fff' : '#888',
                        border: `1px solid ${selectedRule === rule.key ? '#cc1a1a' : '#1a3d50'}`,
                        transition: 'all 0.15s',
                      }}
                    >
                      {rule.label}
                    </button>
                  ))}
                </div>
                {selectedRule && (
                  <div style={{ marginTop: 10, fontSize: 11, color: '#666', lineHeight: 1.5 }}>
                    {ruleProfiles.find(r => r.key === selectedRule)?.rules?.slice(0, 100)}...
                  </div>
                )}

                {/* Type selector */}
                <div style={{ borderTop: '1px solid #1a3d50', margin: '12px 0' }} />
                <div style={PL}>Type</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                  {GEN_TYPES.map(t => (
                    <button
                      key={t.value}
                      onClick={() => selectType(t.value)}
                      style={{
                        padding: '7px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer',
                        background: selectedType === t.value ? 'rgba(57,255,20,0.1)' : '#1a1a1a',
                        color: selectedType === t.value ? 'var(--neon)' : '#888',
                        border: `1px solid ${selectedType === t.value ? 'rgba(57,255,20,0.4)' : '#1a3d50'}`,
                        transition: 'all 0.15s',
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sketch Rules */}
              <div style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <div style={PL}>Sketch Rules</div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {!rulesLocked && (
                      <button
                        onClick={() => { persistSketchRules(selectedType, sketchRules); setRulesLocked(true); toast('Rules saved'); }}
                        style={{ fontSize: 10, fontWeight: 800, color: '#39ff14', background: 'rgba(57,255,20,0.1)', border: '1px solid rgba(57,255,20,0.3)', borderRadius: 4, padding: '3px 8px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em' }}
                      >
                        Save
                      </button>
                    )}
                    <button
                      onClick={() => setRulesLocked(v => !v)}
                      title={rulesLocked ? 'Edit rules' : 'Lock rules'}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: rulesLocked ? '#3a6070' : '#cc1a1a', padding: 2, display: 'flex', alignItems: 'center' }}
                    >
                      {rulesLocked ? (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      ) : (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
                      )}
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: 10, color: '#3a6070', marginBottom: 6 }}>
                  {selectedRule ? `${ruleProfiles.find(r => r.key === selectedRule)?.label} · ${cfg?.label} stage · saved per project` : `${cfg?.label} stage · saved per project`}
                </div>
                <textarea
                  value={sketchRules}
                  onChange={e => { if (!rulesLocked) { setSketchRules(e.target.value); } }}
                  readOnly={rulesLocked}
                  placeholder="Select a rule profile above or type custom rules..."
                  style={{
                    fontSize: 11, lineHeight: 1.5, minHeight: 160, resize: rulesLocked ? 'none' : 'vertical',
                    color: rulesLocked ? '#3a6070' : '#ccc',
                    background: rulesLocked ? 'rgba(7,26,34,0.6)' : undefined,
                    cursor: rulesLocked ? 'default' : 'text',
                    borderColor: rulesLocked ? '#1a3d50' : undefined,
                  }}
                />
              </div>
            </div>
          </div>

          {/* CENTER */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Concept Sheet Generator */}
            <div style={{ background: '#0d2330', border: '1px solid #1a3d50', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #1a3d50', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 900, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Concept Sheet Generator</div>
                  <div style={{ color: '#555', fontSize: 11, marginTop: 2 }}>Creates one clean concept sheet with the active profile rules.</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {images.length > 0 && (
                    <button className="btn btn-ghost btn-sm" onClick={generate} disabled={generating} style={{ fontSize: 11 }}>
                      <RefreshCw size={12} /> 4 More
                    </button>
                  )}
                  <span style={{ fontSize: 11, color: '#444', fontWeight: 700 }}>SKETCH · 4-UP</span>
                  <button className="btn btn-primary btn-sm" onClick={generate} disabled={generating} style={{ minWidth: 140 }}>
                    {generating
                      ? <><span className="loading-spinner" style={{ width: 14, height: 14 }} /> Generating...</>
                      : <><Wand2 size={14} /> Generate Sketch</>
                    }
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                <div style={{ padding: '12px 20px', borderRight: '1px solid #1e1e1e', borderBottom: '1px solid #1a3d50' }}>
                  <div style={PL}>Subject</div>
                  <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. bold eagle vector mascot" style={{ fontSize: 13 }} />
                </div>
                <div style={{ padding: '12px 20px', borderBottom: '1px solid #1a3d50' }}>
                  <div style={PL}>Audience</div>
                  <input value={audience} onChange={e => setAudience(e.target.value)} placeholder="e.g. confident, premium, trades-focused" style={{ fontSize: 13 }} />
                </div>
                <div style={{ padding: '12px 20px', borderRight: '1px solid #1e1e1e' }}>
                  <div style={PL}>Client Brief</div>
                  <textarea value={clientBrief} onChange={e => setClientBrief(e.target.value)} placeholder="Describe the brand vision, style, and feel..." style={{ fontSize: 13, minHeight: 80 }} />
                </div>
                <div style={{ padding: '12px 20px' }}>
                  <div style={PL}>Strategy</div>
                  <textarea value={strategy} onChange={e => setStrategy(e.target.value)} placeholder="e.g. strong, iconic, vector-ready, premium" style={{ fontSize: 13, minHeight: 80 }} />
                </div>
              </div>
            </div>

            {/* Main canvas */}
            <div style={{ background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 10, overflow: 'hidden', minHeight: 420 }}>
              {images.length === 0 && !generating ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 420, color: '#333', gap: 12 }}>
                  <Wand2 size={52} style={{ opacity: 0.1 }} />
                  <p style={{ fontSize: 13, color: '#444' }}>Fill in the brief above and click Generate Sketch</p>
                </div>
              ) : (
                <>
                  {(displayImage || generating) && (
                    <div style={{ background: '#071a22', position: 'relative' }}>
                      {generating && !displayImage ? (
                        <div style={{ height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
                          <span className="loading-spinner" style={{ width: 40, height: 40 }} />
                          <span style={{ color: '#555', fontSize: 13 }}>Generating 4 concepts...</span>
                        </div>
                      ) : displayImage ? (
                        <>
                          <img src={displayImage.url} alt="" style={{ width: '100%', maxHeight: 460, objectFit: 'contain', display: 'block', background: '#fff' }} />
                          <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 6 }}>
                            <button
                              className={`btn btn-sm ${currentFav?.id === displayImage.id ? 'btn-primary' : 'btn-ghost'}`}
                              onClick={() => setFavorite(displayImage)}
                            >
                              {currentFav?.id === displayImage.id ? <><CheckCircle size={12} /> Saved</> : <><Star size={12} /> Favorite</>}
                            </button>
                            <button className="btn btn-ghost btn-sm" onClick={() => downloadImage(displayImage.url, selectedType)}>
                              <Download size={12} />
                            </button>
                          </div>
                        </>
                      ) : null}
                    </div>
                  )}

                  {images.length > 0 && (
                    <div style={{ borderTop: '1px solid #1a3d50', padding: 12, display: 'flex', gap: 10, overflowX: 'auto' }}>
                      {images.map(img => {
                        const isFocused = displayImage?.id === img.id;
                        const isFav = currentFav?.id === img.id;
                        return (
                          <div
                            key={img.id}
                            onClick={() => setFocusedImage(img)}
                            style={{
                              flex: '0 0 80px', height: 80, borderRadius: 6, overflow: 'hidden', cursor: 'pointer',
                              border: `2px solid ${isFocused ? 'var(--neon)' : isFav ? '#cc1a1a' : '#222'}`,
                              transition: 'border-color 0.15s', position: 'relative',
                            }}
                          >
                            <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                            {isFav && (
                              <div style={{ position: 'absolute', bottom: 2, right: 2, background: '#cc1a1a', borderRadius: 3, padding: '1px 4px', fontSize: 8, fontWeight: 800, color: '#fff' }}>FAV</div>
                            )}
                          </div>
                        );
                      })}
                      {generating && Array(4).fill(null).map((_, i) => (
                        <div key={`loading-${i}`} style={{ flex: '0 0 80px', height: 80, borderRadius: 6, border: '2px solid #222', background: '#071a22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span className="loading-spinner" style={{ width: 20, height: 20 }} />
                        </div>
                      ))}
                    </div>
                  )}

                  {displayImage && (
                    <div style={{ padding: '10px 16px', borderTop: '1px solid #1a3d50' }}>
                      <div style={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {cfg?.label?.toUpperCase()} · {selectedRule ? ruleProfiles.find(r => r.key === selectedRule)?.label : 'Custom'} SHEET
                      </div>
                      <div style={{ color: '#555', fontSize: 11, marginTop: 3 }}>
                        Sheet type: {cfg?.label} Sketch. Review focus: choose the strongest concept, then set as favorite to use in Mockup Lab.
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Mockup Lab */}
            <div style={{ background: '#0d2330', border: '1px solid #1a3d50', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #1a3d50', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Layers size={14} color="#cc1a1a" />
                  <span style={{ fontWeight: 900, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Mockup Lab</span>
                </div>
                {mockupReady && (
                  <button className="btn btn-primary btn-sm" onClick={composeFull} disabled={composing}>
                    {composing ? <><span className="loading-spinner" style={{ width: 14, height: 14 }} /> Composing...</> : <><Layers size={13} /> Compose Full Brand</>}
                  </button>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
                {[
                  { key: 'mascot',     label: 'Mascot',          sub: 'Character or animal',  state: mockupMascot,     set: setMockupMascot,     ref: mascotUploadRef },
                  { key: 'wordmark',   label: 'Logo / Wordmark', sub: 'Badge or letterform',  state: mockupWordmark,   set: setMockupWordmark,   ref: wordmarkUploadRef },
                  { key: 'background', label: 'Background',      sub: 'Pattern or accents',   state: mockupBackground, set: setMockupBackground, ref: bgUploadRef },
                ].map((slot, i) => (
                  <div key={slot.key} style={{ borderRight: i < 2 ? '1px solid #1a1a1a' : 'none' }}>
                    <div style={{ padding: '10px 14px', borderBottom: '1px solid #1a1a1a' }}>
                      <div style={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#cc1a1a' }}>{slot.label}</div>
                      <div style={{ fontSize: 10, color: '#444', marginTop: 1 }}>{slot.sub}</div>
                    </div>
                    <div style={{ aspectRatio: '1', background: '#071a22', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      {slot.state ? (
                        <>
                          <img src={slot.state.url} alt={slot.label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          <button onClick={() => slot.set(null)} style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                            <X size={11} />
                          </button>
                        </>
                      ) : (
                        <span style={{ color: '#2a2a2a', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Empty</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', borderTop: '1px solid #1a3d50' }}>
                      <button onClick={() => setShowPickModal(slot.key)} style={{ flex: 1, padding: '9px', background: 'transparent', border: 'none', borderRight: '1px solid #1a3d50', color: '#666', fontSize: 11, fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pick</button>
                      <input type="file" accept="image/*" ref={slot.ref} style={{ display: 'none' }} onChange={e => handleMockupUpload(e, slot.key)} />
                      <button onClick={() => slot.ref.current?.click()} style={{ flex: 1, padding: '9px', background: 'transparent', border: 'none', color: '#666', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        <Upload size={11} /> Upload
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {!mockupReady && (
                <div style={{ padding: '10px 16px', borderTop: '1px solid #1a3d50' }}>
                  <p style={{ color: '#444', fontSize: 11 }}>Pick at least one of mascot, logo, or background to start composing.</p>
                </div>
              )}

              {project.fullBrands?.length > 0 && (
                <div style={{ padding: 16, borderTop: '1px solid #1a3d50' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Full Brand Compositions</div>
                  <div style={{ display: 'flex', gap: 10, overflowX: 'auto' }}>
                    {project.fullBrands.map(img => (
                      <div key={img.id} style={{ flex: '0 0 180px', borderRadius: 6, overflow: 'hidden', border: '1px solid #1a1a1a', position: 'relative' }}>
                        <img src={img.url} alt="" style={{ width: 180, height: 100, objectFit: 'cover', display: 'block' }} />
                        <button className="btn btn-ghost btn-xs" style={{ position: 'absolute', bottom: 4, right: 4 }} onClick={() => downloadImage(img.url, 'full-brand')}><Download size={10} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Reference Pull */}
          <div style={{ background: '#0d2330', border: '1px solid #1a3d50', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #1a3d50', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, background: '#cc1a1a', borderRadius: '50%' }} />
                  <span style={{ fontWeight: 900, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Reference Pull</span>
                </div>
                {refs.length > 0 && <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>{selectedRefs.length} of {refs.length} selected</div>}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {refs.length > 0 && <button style={{ fontSize: 10, color: '#666', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }} onClick={() => setSelectedRefs(refs.map(r => r.id).slice(0, 5))}>Select all</button>}
                {selectedRefs.length > 0 && <button style={{ fontSize: 10, color: '#cc1a1a', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }} onClick={() => setSelectedRefs([])}>Clear</button>}
              </div>
            </div>

            {refs.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center' }}>
                <p style={{ color: '#444', fontSize: 12, marginBottom: 12 }}>No {cfg?.label?.toLowerCase()} references in vault yet.</p>
                <Link to="/library" className="btn btn-ghost btn-sm" style={{ fontSize: 11 }}>+ Upload References</Link>
              </div>
            ) : (
              <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 700, overflowY: 'auto' }}>
                <p style={{ fontSize: 11, color: '#555', marginBottom: 4 }}>Selected references are sent as style guides for generation.</p>
                {refs.map(ref => {
                  const isSelected = selectedRefs.includes(ref.id);
                  return (
                    <div
                      key={ref.id}
                      onClick={() => toggleRef(ref.id)}
                      style={{
                        cursor: 'pointer', borderRadius: 8, overflow: 'hidden',
                        border: `2px solid ${isSelected ? 'var(--neon)' : '#1a1a1a'}`,
                        boxShadow: isSelected ? '0 0 12px rgba(57,255,20,0.2)' : 'none',
                        transition: 'all 0.15s',
                      }}
                    >
                      <img src={ref.url} alt={ref.name} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }} />
                      <div style={{ padding: '6px 10px', background: '#071a22' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: isSelected ? 'var(--neon)' : '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ref.name}</div>
                        <div style={{ fontSize: 10, color: '#cc1a1a', marginTop: 1, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>General Style</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Project Modal */}
      {showNewProject && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="card" style={{ width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>New Brand Project</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowNewProject(false)}><X size={14} /></button>
            </div>
            <form onSubmit={createProject}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label>Business Name *</label>
                  <input value={newForm.businessName} onChange={e => setNewForm(f => ({ ...f, businessName: e.target.value }))} placeholder="e.g. Arctic Air HVAC" />
                </div>
                <div className="form-group">
                  <label>Industry *</label>
                  <select value={newForm.industry} onChange={e => setNewForm(f => ({ ...f, industry: e.target.value }))}>
                    <option value="">Select industry...</option>
                    {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input value={newForm.location} onChange={e => setNewForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Phoenix, AZ" />
                </div>
                <div className="form-group">
                  <label>Brand Personality</label>
                  <input value={newForm.personality} onChange={e => setNewForm(f => ({ ...f, personality: e.target.value }))} placeholder="e.g. Bold, trustworthy" />
                </div>
                <div className="form-group">
                  <label>Colors</label>
                  <input value={newForm.colors} onChange={e => setNewForm(f => ({ ...f, colors: e.target.value }))} placeholder="e.g. Ice blue and orange" />
                </div>
                <div className="form-group">
                  <label>Style Notes</label>
                  <input value={newForm.styleNotes} onChange={e => setNewForm(f => ({ ...f, styleNotes: e.target.value }))} placeholder="e.g. Retro cartoon, bold outlines" />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Description / Prompt</label>
                  <textarea value={newForm.promptDescription} onChange={e => setNewForm(f => ({ ...f, promptDescription: e.target.value }))} placeholder="Describe the overall brand vision..." />
                </div>
                <div className="form-group">
                  <label>Must Include</label>
                  <input value={newForm.mustHave} onChange={e => setNewForm(f => ({ ...f, mustHave: e.target.value }))} placeholder="e.g. Snowflake icon" />
                </div>
                <div className="form-group">
                  <label>Must Avoid</label>
                  <input value={newForm.mustAvoid} onChange={e => setNewForm(f => ({ ...f, mustAvoid: e.target.value }))} placeholder="e.g. Purple, flames" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowNewProject(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? <><span className="loading-spinner" style={{ width: 16, height: 16 }} /> Creating...</> : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pick Modal */}
      {showPickModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="card" style={{ width: '100%', maxWidth: 700, maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pick {showPickModal}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowPickModal(null)}><X size={14} /></button>
            </div>
            {getPickImages(showPickModal).length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No generated images yet. Generate some first then come back.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
                {getPickImages(showPickModal).map(img => (
                  <div
                    key={img.id}
                    onClick={() => {
                      if (showPickModal === 'mascot') setMockupMascot(img);
                      if (showPickModal === 'wordmark') setMockupWordmark(img);
                      if (showPickModal === 'background') setMockupBackground(img);
                      setShowPickModal(null);
                    }}
                    style={{ cursor: 'pointer', borderRadius: 8, overflow: 'hidden', border: '2px solid #2a2a2a', transition: 'border-color 0.15s' }}
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
