import React from 'react';
import { InfoIcon } from '../../../components/Icons';

export function SchemesTab({ announcements, handleTogglePublishScheme, handleDeleteScheme }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
        {announcements.map((annc) => (
          <div
            key={annc.id}
            className="card"
            style={{
              padding: '1.1rem',
              borderTop: `4px solid ${annc.is_published ? 'var(--primary)' : '#9ca3af'}`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '0.15rem 0.5rem',
                  borderRadius: 4,
                  backgroundColor: '#eff6ff',
                  color: '#1d4ed8'
                }}>
                  {annc.category}
                </span>

                <span className={`badge badge-${annc.is_published ? 'settled' : 'pending'}`} style={{ fontSize: '0.72rem' }}>
                  {annc.is_published ? 'Published' : 'Draft / Archived'}
                </span>
              </div>

              <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                {annc.title}
              </h4>
              {annc.title_kn && (
                <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '0.4rem' }}>
                  {annc.title_kn}
                </div>
              )}

              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.45, marginBottom: '0.75rem', maxHeight: 80, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {annc.content}
              </p>

              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <div>Audience: <strong style={{ textTransform: 'capitalize' }}>{annc.target_audience} {annc.target_village ? `(${annc.target_village})` : ''}</strong></div>
                {annc.expires_at && <div>Valid Until: <strong>{new Date(annc.expires_at).toLocaleDateString()}</strong></div>}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
              <button
                onClick={() => handleTogglePublishScheme(annc)}
                className="btn btn-outline"
                style={{ flex: 1, minHeight: 34, fontSize: '0.78rem', padding: '0.2rem 0.5rem' }}
              >
                {annc.is_published ? 'Unpublish' : 'Publish'}
              </button>
              <button
                onClick={() => handleDeleteScheme(annc.id)}
                className="btn btn-outline"
                style={{ minHeight: 34, fontSize: '0.78rem', padding: '0.2rem 0.5rem', color: '#dc2626', borderColor: '#fca5a5' }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {announcements.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <InfoIcon size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
          <p style={{ color: 'var(--text-muted)' }}>No cooperative schemes or notices created yet.</p>
        </div>
      )}
    </div>
  );
}
