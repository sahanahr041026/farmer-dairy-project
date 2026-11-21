import React from 'react';
import { EditIcon } from '../../../components/Icons';

export function HerdTable({ cattleList, handleOpenEditCattle }) {
  return (
    <div className="card">
      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '1rem' }}>
        Registered Cattle Herd ({cattleList.length})
      </h3>

      <div style={{ overflowX: 'auto', maxHeight: 520 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
              <th style={{ padding: '0.5rem' }}>Tag</th>
              <th style={{ padding: '0.5rem' }}>Name</th>
              <th style={{ padding: '0.5rem' }}>Farmer</th>
              <th style={{ padding: '0.5rem' }}>Breed</th>
              <th style={{ padding: '0.5rem' }}>Status</th>
              <th style={{ padding: '0.5rem' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {cattleList.map((c) => (
              <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '0.5rem', fontWeight: 700, color: 'var(--primary)' }}>{c.tag_number}</td>
                <td style={{ padding: '0.5rem', fontWeight: 600 }}>{c.name}</td>
                <td style={{ padding: '0.5rem' }}>{c.farmer_name}</td>
                <td style={{ padding: '0.5rem' }}>{c.breed}</td>
                <td style={{ padding: '0.5rem' }}>
                  <span className="badge badge-settled">{c.milking_status}</span>
                </td>
                <td style={{ padding: '0.5rem' }}>
                  <button
                    onClick={() => handleOpenEditCattle(c)}
                    className="btn btn-outline touch-target"
                    style={{ minHeight: 28, padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                    title="Edit profile"
                  >
                    <EditIcon size={12} />
                    <span>Edit</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
