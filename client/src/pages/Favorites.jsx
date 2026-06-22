import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Download, ArrowRight, Layers } from 'lucide-react';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';

export default function Favorites() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    api.getProjects()
      .then(data => setProjects(data.reverse()))
      .catch(() => toast('Failed to load projects', 'error'))
      .finally(() => setLoading(false));
  }, []);

  function downloadImage(url, name) {
    const a = document.createElement('a');
    a.href = url;
    a.download = `monsta-${name}-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  const projectsWithFavs = projects.filter(p =>
    p.favoriteWordmark || p.favoriteMascot || p.favoriteBackground || (p.fullBrands?.length > 0)
  );

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <span className="loading-spinner" style={{ width: 36, height: 36 }} />
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <h1>Favorites & Final Concepts</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Your selected brand elements and completed brand compositions
        </p>
      </div>

      {projectsWithFavs.length === 0 ? (
        <div className="empty-state">
          <Star size={64} />
          <h3>No Favorites Yet</h3>
          <p>Generate and save favorite brand elements from your projects</p>
          <Link to="/" className="btn btn-outline" style={{ marginTop: 20 }}>
            Go to Projects
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          {projectsWithFavs.map(project => (
            <div key={project.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 700 }}>{project.businessName}</h2>
                  <span className="badge badge-muted" style={{ marginTop: 4 }}>{project.industry}</span>
                </div>
                <Link to={`/project/${project.id}`} className="btn btn-ghost btn-sm">
                  Open Project <ArrowRight size={14} />
                </Link>
              </div>

              {/* Selected elements */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16, marginBottom: project.fullBrands?.length > 0 ? 20 : 0 }}>
                {[
                  { label: 'Wordmark', image: project.favoriteWordmark, path: 'wordmarks' },
                  { label: 'Mascot', image: project.favoriteMascot, path: 'mascots' },
                  { label: 'Background', image: project.favoriteBackground, path: 'backgrounds' },
                ].map(({ label, image, path }) => image && (
                  <div key={label} className="card" style={{ padding: 0, overflow: 'hidden', borderColor: 'rgba(57,255,20,0.2)' }}>
                    <div style={{ position: 'relative' }}>
                      <img src={image.url} alt={label} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
                      <div style={{ position: 'absolute', top: 8, left: 8 }}>
                        <span className="badge badge-neon"><Star size={10} fill="var(--neon)" /> {label}</span>
                      </div>
                    </div>
                    <div style={{ padding: '10px 12px', display: 'flex', gap: 8 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => downloadImage(image.url, label.toLowerCase())}>
                        <Download size={13} /> Download
                      </button>
                      <Link to={`/project/${project.id}/${path}`} className="btn btn-outline btn-sm">
                        View All
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {/* Full brand concepts */}
              {project.fullBrands?.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <Layers size={16} color="var(--neon)" />
                    <h3 style={{ fontSize: 15, fontWeight: 600 }}>Full Brand Concepts</h3>
                    <span className="badge badge-muted">{project.fullBrands.length}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
                    {project.fullBrands.map(img => (
                      <div key={img.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <img src={img.url} alt="Full brand" style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }} />
                        <div style={{ padding: '10px 12px' }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => downloadImage(img.url, 'full-brand')}>
                            <Download size={13} /> Download
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <hr className="divider" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
