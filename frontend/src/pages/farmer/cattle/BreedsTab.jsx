import React from 'react';

function BreedDetail({ selectedBreed, language }) {
  return (
    <div className="card" style={{ padding: '1.25rem', border: '2px solid var(--secondary)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>
            {language === 'kn' ? selectedBreed.name_kn : selectedBreed.name}
          </h3>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Origin: {selectedBreed.origin}
          </div>
        </div>
        <span className="badge badge-settled" style={{ fontSize: '0.8rem' }}>
          {selectedBreed.category.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      <p style={{ fontSize: '0.9rem', lineHeight: 1.5, color: 'var(--text-main)', marginBottom: '1.25rem' }}>
        {language === 'kn' ? selectedBreed.description_kn : selectedBreed.description}
      </p>

      {/* Stats Highlights */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '0.75rem',
        backgroundColor: 'var(--bg-main)',
        padding: '0.85rem',
        borderRadius: 'var(--radius-sm)',
        marginBottom: '1.25rem'
      }}>
        <div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Daily Yield</span>
          <strong style={{ fontSize: '0.95rem', color: 'var(--primary)' }}>{selectedBreed.avg_yield_litres}</strong>
        </div>
        <div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Avg Fat Content</span>
          <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>{selectedBreed.fat_content}</strong>
        </div>
        <div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Avg SNF Content</span>
          <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>{selectedBreed.snf_content}</strong>
        </div>
        <div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Heat Tolerance</span>
          <strong style={{ fontSize: '0.85rem', color: 'var(--secondary)' }}>{selectedBreed.heat_tolerance}</strong>
        </div>
      </div>

      {/* Feeding Chart */}
      <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.5rem' }}>
        {language === 'kn' ? 'ದೈನಂದಿನ ಆಹಾರ ಮಾರ್ಗಸೂಚಿ (ಪೌಷ್ಟಿಕತೆ):' : 'Daily Feeding Guidelines (Nutrition Plan):'}
      </h4>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '0.5rem',
        marginBottom: '1.25rem',
        fontSize: '0.85rem'
      }}>
        <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6 }}>
          🌿 <strong>{language === 'kn' ? 'ಹಸಿರು ಮೇವು' : 'Green Fodder'}:</strong>
          <div>{language === 'kn' ? selectedBreed.feeding_guide_kn?.green_fodder : selectedBreed.feeding_guide?.green_fodder}</div>
        </div>
        <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6 }}>
          🌾 <strong>{language === 'kn' ? 'ಒಣ ಮೇವು (ಫೈಬರ್)' : 'Dry Fodder'}:</strong>
          <div>{language === 'kn' ? selectedBreed.feeding_guide_kn?.dry_fodder : selectedBreed.feeding_guide?.dry_fodder}</div>
        </div>
        <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6 }}>
          🥣 <strong>{language === 'kn' ? 'ಹಿಂಡಿ / ಸಾಂದ್ರ ಆಹಾರ' : 'Concentrate Feed'}:</strong>
          <div>{language === 'kn' ? selectedBreed.feeding_guide_kn?.concentrate : selectedBreed.feeding_guide?.concentrate}</div>
        </div>
        <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6 }}>
          🧂 <strong>{language === 'kn' ? 'ಖನಿಜ ಮಿಶ್ರಣ' : 'Mineral Mixture'}:</strong>
          <div>{language === 'kn' ? selectedBreed.feeding_guide_kn?.mineral_mix : selectedBreed.feeding_guide?.mineral_mix}</div>
        </div>
      </div>

      {/* Care Tips */}
      <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.5rem' }}>
        {language === 'kn' ? 'ಆರೈಕೆ ಮತ್ತು ಕೊಟ್ಟಿಗೆ ನಿರ್ವಹಣೆ:' : 'Care & Management Tips:'}
      </h4>
      <ul style={{ paddingLeft: '1.2rem', fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.5, marginBottom: '1rem' }}>
        {(language === 'kn' ? selectedBreed.care_tips_kn : selectedBreed.care_tips)?.map((tip, idx) => (
          <li key={idx} style={{ marginBottom: '0.3rem' }}>{tip}</li>
        ))}
      </ul>

      <div style={{ fontSize: '0.85rem', color: 'var(--primary)', backgroundColor: 'var(--primary-light)', padding: '0.5rem 0.8rem', borderRadius: 6, fontWeight: 600 }}>
        💡 {language === 'kn' ? 'ಯಾರಿಗೆ ಹೆಚ್ಚು ಸೂಕ್ತ: ' : 'Suitability: '} {selectedBreed.suitability}
      </div>
    </div>
  );
}

export function BreedsTab({ breeds, selectedBreed, setSelectedBreed, language }) {
  return (
    <div>
      <div style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
          {language === 'kn' ? 'ಭಾರತೀಯ ಹೈನುಗಾರಿಕೆ ತಳಿ ಮಾರ್ಗದರ್ಶಿ' : 'Indian Dairy Cattle & Buffalo Breed Advisory'}
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {language === 'kn' ? 'ಪ್ರಮುಖ ತಳಿಗಳ ಹಾಲು ಇಳುವರಿ, ಫ್ಯಾಟ್ ಅಂಶ, ಆಹಾರ ಪದ್ಧತಿ ಮತ್ತು ರೋಗ ರಕ್ಷಣಾ ಮಾಹಿತಿ' : 'Milk yield potential, fat profiles, nutrition guidelines, and climate suitability'}
        </p>
      </div>

      {/* Breed Selector Pills */}
      <div style={{
        display: 'flex',
        gap: '0.4rem',
        overflowX: 'auto',
        paddingBottom: '0.5rem',
        marginBottom: '1.25rem'
      }}>
        {breeds.map((b) => (
          <button
            key={b.id}
            onClick={() => setSelectedBreed(b)}
            className="touch-target"
            style={{
              padding: '0.4rem 0.9rem',
              borderRadius: 'var(--radius-full)',
              border: '1.5px solid',
              borderColor: selectedBreed?.id === b.id ? 'var(--primary)' : 'var(--border)',
              backgroundColor: selectedBreed?.id === b.id ? 'var(--primary)' : 'var(--bg-card)',
              color: selectedBreed?.id === b.id ? '#FFFFFF' : 'var(--text-main)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {language === 'kn' ? b.name_kn : b.name}
          </button>
        ))}
      </div>

      {/* Selected Breed Detail Card */}
      {selectedBreed && <BreedDetail selectedBreed={selectedBreed} language={language} />}
    </div>
  );
}
