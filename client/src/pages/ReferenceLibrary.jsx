import { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Trash2, BookImage, Plus, Tag, X } from 'lucide-react';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';

const CATEGORIES = [
  { value: 'wordmark', label: 'Wordmark' },
  { value: 'mascot', label: 'Mascot' },
  { value: 'background', label: 'Background' },
  { value: 'full', label: 'Full Brand' },
];

export default function ReferenceLibrary() {
  const [references, setReferences] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [uploadForm, setUploadForm] = useState({ category: 'wordmark', name: '', tags: '', notes: '' });
  const toast = useToast();

  useEffect(() => { loadRefs(); }, []);

  async function loadRefs() {
    try {
      const data = await api.getReferences();
      setReferences(data);
    } catch {
      toast('Failed to load references', 'error');
    }
  }

  const onDrop = useCallback((files) => {
    if (files.length > 0) {
      setPendingFile(files[0]);
      setUploadForm(f => ({ ...f, name: files[0].name.replace(/\.[^.]+$/, '') }));
      setShowUploadForm(true);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
  });

  async function uploadRef() {
    if (!pendingFile) return;
    setUploading(true);
    try {
      const ref = await api.uploadReference(pendingFile, uploadForm);
      setReferences(r => [ref, ...r]);
      setPendingFile(null);
      setShowUploadForm(false);
      setUploadForm({ category: 'wordmark', name: '', tags: '', notes: '' });
      toast('Reference image uploaded!');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setUploading(false);
    }
  }

  async function deleteRef(id) {
    if (!confirm('Delete this reference image?')) return;
    try {
      await api.deleteReference(id);
      setReferences(r => r.filter(x => x.id !== id));
      toast('Reference deleted');
    } catch (e) {
      toast(e.message, 'error');
    }
  }

  const filtered = activeCategory === 'all' ? references : references.filter(r => r.category === activeCategory);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Reference Library</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Upload example images to guide AI generation style
          </p>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        {...getRootProps()}
        style={{
          border: `2px dashed ${isDragActive ? 'var(--neon)' : '#2a2a2a'}`,
          background: isDragActive ? 'rgba(57,255,20,0.05)' : '#111',
          borderRadius: 12,
          padding: 40,
          textAlign: 'center',
          cursor: 'pointer',
          marginBottom: 28,
          transition: 'all 0.2s',
          boxShadow: isDragActive ? '0 0 30px var(--neon-glow)' : 'none',
        }}
      >
        <input {...getInputProps()} />
        <Upload size={32} color={isDragActive ? 'var(--neon)' : '#555'} style={{ margin: '0 auto 12px' }} />
        <p style={{ fontSize: 16, fontWeight: 600, color: isDragActive ? 'var(--neon)' : 'var(--text)', marginBottom: 6 }}>
          {isDragActive ? 'Drop to upload' : 'Drag & drop a reference image here'}
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>or click to browse — JPG, PNG, WebP up to 10MB</p>
      </div>

      {/* Upload form modal */}
      {showUploadForm && pendingFile && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="card" style={{ width: '100%', maxWidth: 520 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontWeight: 700, fontSize: 18 }}>Add Reference Image</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => { setShowUploadForm(false); setPendingFile(null); }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', marginBottom: 20 }}>
              <div style={{ flex: '0 0 120px', borderRadius: 8, overflow: 'hidden', border: '1px solid #2a2a2a' }}>
                <img
                  src={URL.createObjectURL(pendingFile)}
                  alt="Preview"
                  style={{ width: 120, height: 120, objectFit: 'cover', display: 'block' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div className="form-group">
                  <label>Category</label>
                  <select value={uploadForm.category} onChange={e => setUploadForm(f => ({ ...f, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Name / Title</label>
                  <input
                    value={uploadForm.name}
                    onChange={e => setUploadForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Retro HVAC mascot"
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Tags (comma separated)</label>
              <input
                value={uploadForm.tags}
                onChange={e => setUploadForm(f => ({ ...f, tags: e.target.value }))}
                placeholder="e.g. retro, bold, blue, cartoon"
              />
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea
                value={uploadForm.notes}
                onChange={e => setUploadForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="What makes this a good reference? What style does it represent?"
                style={{ minHeight: 60 }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => { setShowUploadForm(false); setPendingFile(null); }}>Cancel</button>
              <button className="btn btn-primary" onClick={uploadRef} disabled={uploading || !uploadForm.name.trim()}>
                {uploading ? <><span className="loading-spinner" style={{ width: 16, height: 16 }} /> Uploading...</> : <><Upload size={15} /> Upload</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {[{ value: 'all', label: `All (${references.length})` }, ...CATEGORIES.map(c => ({ ...c, label: `${c.label} (${references.filter(r => r.category === c.value).length})` }))].map(cat => (
          <button
            key={cat.value}
            className={`btn ${activeCategory === cat.value ? 'btn-primary' : 'btn-ghost'} btn-sm`}
            onClick={() => setActiveCategory(cat.value)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <BookImage size={64} />
          <h3>No {activeCategory === 'all' ? '' : activeCategory + ' '}References Yet</h3>
          <p>Upload images to use as style guides for AI generation</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {filtered.map(ref => (
            <div key={ref.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ position: 'relative' }}>
                <img src={ref.url} alt={ref.name} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', top: 8, left: 8 }}>
                  <span className="badge badge-neon">{ref.category}</span>
                </div>
                <button
                  onClick={() => deleteRef(ref.id)}
                  style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: 6, padding: 6, cursor: 'pointer', color: '#ff4444', display: 'flex', alignItems: 'center' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div style={{ padding: '12px 14px' }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{ref.name}</div>
                {ref.tags?.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
                    {ref.tags.map(tag => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                )}
                {ref.notes && (
                  <p style={{ color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.5 }}>{ref.notes}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
