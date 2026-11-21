import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  SearchIcon,
  PlusIcon,
  CattleIcon,
  DownloadIcon
} from '../../components/Icons';
import { Modal } from '../../components/Modal';

// Random 4-digit PIN (crypto-backed) so new farmers never share a guessable default.
function generatePin() {
  const buf = new Uint32Array(1);
  window.crypto.getRandomValues(buf);
  return String(buf[0] % 10000).padStart(4, '0');
}

export function AdminFarmers() {
  const [farmers, setFarmers] = useState([]);
  const [villages, setVillages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [farmerCattle, setFarmerCattle] = useState([]);

  // New Farmer Form
  const [newFarmer, setNewFarmer] = useState({
    farmer_uid: '',
    full_name: '',
    phone: '',
    village: '',
    pin_code: '',
    bank_account_no: '',
    ifsc_code: '',
    initial_pin: generatePin()
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Passbook Download State
  const [statementStart, setStatementStart] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  });
  const [statementEnd, setStatementEnd] = useState(() => new Date().toISOString().split('T')[0]);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [passbookError, setPassbookError] = useState('');
  const [passbookSuccess, setPassbookSuccess] = useState('');

  const handleAdminDownloadPassbook = async () => {
    if (!selectedFarmer) return;
    setDownloadingPdf(true);
    setPassbookError('');
    setPassbookSuccess('');
    try {
      await api.downloadPassbookPdf({
        farmer_id: selectedFarmer.id,
        start_date: statementStart,
        end_date: statementEnd
      });
      setPassbookSuccess("Official Member E-Passbook downloaded successfully.");
      setTimeout(() => setPassbookSuccess(''), 4000);
    } catch (err) {
      setPassbookError(err.message || "Failed to generate member passbook statement.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const loadFarmers = async () => {
    setLoading(true);
    try {
      const [list, vList] = await Promise.all([
        api.getFarmers({
          search: searchTerm,
          village: selectedVillage || undefined
        }),
        api.getVillages()
      ]);
      setFarmers(list);
      setVillages(vList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFarmers();
  }, [searchTerm, selectedVillage]);

  const handleCreateFarmer = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    try {
      await api.createFarmer(newFarmer);
      setFormSuccess("Farmer registered successfully with initial PIN!");
      setNewFarmer({
        farmer_uid: '',
        full_name: '',
        phone: '',
        village: '',
        pin_code: '',
        bank_account_no: '',
        ifsc_code: '',
        initial_pin: generatePin()
      });
      loadFarmers();
      setTimeout(() => {
        setIsAddModalOpen(false);
        setFormSuccess('');
      }, 1500);
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleViewProfile = async (farmer) => {
    setSelectedFarmer(farmer);
    try {
      const cList = await api.getCattle({ farmer_id: farmer.id });
      setFarmerCattle(cList);
    } catch (e) {
      setFarmerCattle([]);
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.2s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>
            Registered Farmers Management
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Manage farmer membership, linked cattle profiles, and payment credentials
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn btn-primary touch-target"
        >
          <PlusIcon size={18} />
          <span>Register New Farmer</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: '1.25rem', padding: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: 14, color: 'var(--text-muted)' }}>
              <SearchIcon size={18} />
            </span>
            <input
              type="text"
              className="form-input"
              placeholder="Search by name, Farmer UID, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: 38 }}
            />
          </div>

          {/* Village Filter */}
          <div>
            <select
              className="form-input"
              value={selectedVillage}
              onChange={(e) => setSelectedVillage(e.target.value)}
            >
              <option value="">All Villages / Localities</option>
              {villages.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Farmers Table */}
      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem' }}>Farmer UID</th>
                <th style={{ padding: '0.75rem' }}>Full Name</th>
                <th style={{ padding: '0.75rem' }}>Phone</th>
                <th style={{ padding: '0.75rem' }}>Village</th>
                <th style={{ padding: '0.75rem' }}>Cattle</th>
                <th style={{ padding: '0.75rem' }}>Month Litres</th>
                <th style={{ padding: '0.75rem' }}>Pending (₹)</th>
                <th style={{ padding: '0.75rem' }}>Status</th>
                <th style={{ padding: '0.75rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '2rem' }}>Loading farmers...</td>
                </tr>
              ) : farmers.length > 0 ? (
                farmers.map((f) => (
                  <tr key={f.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>
                      {f.farmer_uid}
                    </td>
                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>{f.full_name}</td>
                    <td style={{ padding: '0.75rem' }}>{f.phone}</td>
                    <td style={{ padding: '0.75rem' }}>{f.village}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className="badge badge-settled" style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                        <CattleIcon size={12} /> {f.cattle_count}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', fontWeight: 700 }}>
                      {f.total_litres_month} L
                    </td>
                    <td style={{ padding: '0.75rem', fontWeight: 700, color: 'var(--status-pending)' }}>
                      ₹{f.pending_payout.toFixed(2)}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className={`badge ${f.is_active ? 'badge-settled' : 'badge-overdue'}`}>
                        {f.is_active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <button
                        onClick={() => handleViewProfile(f)}
                        className="btn btn-outline touch-target"
                        style={{ minHeight: 34, padding: '0.3rem 0.65rem', fontSize: '0.78rem' }}
                      >
                        Profile & Cattle
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No farmers found matching query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Farmer Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Cooperative Farmer"
        maxWidth={600}
      >
        {formSuccess && (
          <div style={{ padding: '0.85rem', backgroundColor: 'var(--status-settled-bg)', color: 'var(--status-settled)', borderRadius: 6, marginBottom: '1rem', fontWeight: 600 }}>
            {formSuccess}
          </div>
        )}
        {formError && (
          <div style={{ padding: '0.85rem', backgroundColor: 'var(--status-overdue-bg)', color: 'var(--status-overdue)', borderRadius: 6, marginBottom: '1rem', fontWeight: 600 }}>
            {formError}
          </div>
        )}

        <form onSubmit={handleCreateFarmer}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Farmer UID *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. DS-FARM-106"
                value={newFarmer.farmer_uid}
                onChange={(e) => setNewFarmer({ ...newFarmer, farmer_uid: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Anand Murthy"
                value={newFarmer.full_name}
                onChange={(e) => setNewFarmer({ ...newFarmer, full_name: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Mobile Number *</label>
              <input
                type="tel"
                className="form-input"
                placeholder="10-digit number"
                value={newFarmer.phone}
                onChange={(e) => setNewFarmer({ ...newFarmer, phone: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Village / Locality *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Hosahalli"
                value={newFarmer.village}
                onChange={(e) => setNewFarmer({ ...newFarmer, village: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Bank Account Number</label>
              <input
                type="text"
                className="form-input"
                placeholder="Direct deposit account"
                value={newFarmer.bank_account_no}
                onChange={(e) => setNewFarmer({ ...newFarmer, bank_account_no: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Bank IFSC Code</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. SBIN0001234"
                value={newFarmer.ifsc_code}
                onChange={(e) => setNewFarmer({ ...newFarmer, ifsc_code: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Initial Login PIN (4 digits, share it with the farmer)</label>
            <input
              type="text"
              className="form-input"
              value={newFarmer.initial_pin}
              onChange={(e) => setNewFarmer({ ...newFarmer, initial_pin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              title="Enter exactly 4 digits"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', minHeight: 48 }}>
            Save Farmer Profile
          </button>
        </form>
      </Modal>

      {/* Farmer Profile & Linked Cattle Modal */}
      {selectedFarmer && (
        <Modal
          isOpen={!!selectedFarmer}
          onClose={() => setSelectedFarmer(null)}
          title={`Farmer Profile: ${selectedFarmer.full_name} (${selectedFarmer.farmer_uid})`}
          maxWidth={680}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem', backgroundColor: 'var(--bg-page)', padding: '1rem', borderRadius: 8 }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Contact Phone</span>
              <div style={{ fontWeight: 700 }}>{selectedFarmer.phone}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Village</span>
              <div style={{ fontWeight: 700 }}>{selectedFarmer.village}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Bank Account</span>
              <div style={{ fontWeight: 700 }}>{selectedFarmer.bank_account_no || 'N/A'} ({selectedFarmer.ifsc_code || 'N/A'})</div>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pending Milk Balance</span>
              <div style={{ fontWeight: 800, color: 'var(--status-pending)' }}>₹{selectedFarmer.pending_payout.toFixed(2)}</div>
            </div>
          </div>

          <h4 style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem' }}>
            Registered Cattle Herd ({farmerCattle.length})
          </h4>

          {farmerCattle.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 220, overflowY: 'auto' }}>
              {farmerCattle.map((c) => (
                <div key={c.id} style={{ padding: '0.65rem 0.85rem', backgroundColor: '#FFFFFF', border: '1px solid var(--border)', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{c.name}</strong> <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>({c.tag_number})</span>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Breed: {c.breed} | Age: {c.age_years} yrs</div>
                  </div>
                  <span className="badge badge-settled">{c.milking_status}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No cattle registered yet for this farmer.</div>
          )}

          {/* Official E-Passbook PDF Generation for Admin */}
          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
            <h4 style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <DownloadIcon size={18} /> Official Member E-Passbook (PDF)
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Generate an official, audited electronic milk statement for this member.
            </p>

            {passbookSuccess && (
              <div style={{ padding: '0.5rem 0.75rem', backgroundColor: '#ECFDF5', color: '#065F46', borderRadius: 6, fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                {passbookSuccess}
              </div>
            )}
            {passbookError && (
              <div style={{ padding: '0.5rem 0.75rem', backgroundColor: '#FEF2F2', color: '#991B1B', borderRadius: 6, fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                {passbookError}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.5rem', alignItems: 'flex-end' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>From Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={statementStart}
                  onChange={(e) => setStatementStart(e.target.value)}
                  style={{ minHeight: 40, padding: '0.35rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>To Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={statementEnd}
                  onChange={(e) => setStatementEnd(e.target.value)}
                  style={{ minHeight: 40, padding: '0.35rem' }}
                />
              </div>
              <button
                type="button"
                onClick={handleAdminDownloadPassbook}
                disabled={downloadingPdf}
                className="btn btn-primary"
                style={{ minHeight: 40, padding: '0.4rem 1rem', whiteSpace: 'nowrap' }}
              >
                {downloadingPdf ? "Generating PDF..." : "Download Passbook PDF"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
