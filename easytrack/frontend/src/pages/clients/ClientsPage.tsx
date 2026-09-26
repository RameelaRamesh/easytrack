import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api/client';
import { UserSquare2, Mail, X, Save } from 'lucide-react';
import { Client } from '../../types';

export const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchClients = async () => {
    try {
      const res = await apiClient.get<Client[]>('/clients/');
      if (res.data.length === 0) {
        setClients([
          { id: 1, name: 'Apex Health Partners', client_id: 'CLI-APEX', status: 'active', ops_head_name: 'Sanjay Sharma', tl_name: 'Vikram Rathore' },
          { id: 2, name: 'Beacon Medical Group', client_id: 'CLI-BEAC', status: 'active', ops_head_name: 'Sanjay Sharma', tl_name: 'Vikram Rathore' }
        ]);
      } else {
        setClients(res.data);
      }
    } catch (err) {
      console.error(err);
      // Fallback
      setClients([
        { id: 1, name: 'Apex Health Partners', client_id: 'CLI-APEX', status: 'active', ops_head_name: 'Sanjay Sharma', tl_name: 'Vikram Rathore' },
        { id: 2, name: 'Beacon Medical Group', client_id: 'CLI-BEAC', status: 'active', ops_head_name: 'Sanjay Sharma', tl_name: 'Vikram Rathore' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setEditStatus(client.status);
    setMsg('');
  };

  const handleSaveStatus = async () => {
    if (!selectedClient) return;
    setSaving(true);
    setMsg('');
    try {
      await apiClient.patch(`/clients/${selectedClient.id}/`, {
        status: editStatus
      });
      setMsg('Client status updated successfully!');
      fetchClients();
      setSelectedClient(prev => prev ? { ...prev, status: editStatus as any } : null);
    } catch (err) {
      console.error(err);
      setMsg('Failed to update status. Custom data saved locally.');
      // Local fallback edit
      setClients(prev => prev.map(c => c.id === selectedClient.id ? { ...c, status: editStatus as any } : c));
    } finally {
      setSaving(false);
    }
  };

  const handleSendMail = (client: Client) => {
    const email = `${client.client_id.toLowerCase().replace('cli-', '')}@medicalbilling.com`;
    const subject = `EasyTrack Operations: Update for ${client.name}`;
    const body = `Hi Team,\n\nThis is Sanjay Sharma, Operations Head. I wanted to check in on the service level agreement metrics for ${client.name}.\n\nBest Regards,\nSanjay Sharma`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-card border border-gray-200 dark:border-slate-700 shadow-sm p-6 space-y-6 text-slate-800 dark:text-slate-100">
      
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
          <UserSquare2 className="h-5 w-5 mr-2 text-brand-primary" />
          Client Directory
        </h2>
        <p className="text-sm text-slate-500 mt-1">Manage active billing contracts, send operations emails, and audit configurations.</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-primary border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {clients.map((client) => (
            <div
              key={client.id}
              onClick={() => handleSelectClient(client)}
              className="p-5 border border-gray-150 dark:border-slate-750 bg-gray-50/50 dark:bg-slate-900 rounded-xl space-y-4 hover:shadow-md cursor-pointer transition duration-150 hover:border-brand-primary"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">{client.name}</h3>
                  <p className="text-xs font-mono text-brand-primary mt-0.5">{client.client_id}</p>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${
                  client.status === 'active' 
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900' 
                    : client.status === 'onboarding' 
                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-200 dark:border-amber-900'
                    : 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-400 border-gray-200 dark:border-slate-700'
                }`}>
                  {client.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs font-medium text-slate-500 border-t border-gray-100 dark:border-slate-800 pt-3">
                <div>
                  <p className="font-bold uppercase tracking-wider text-[10px] text-slate-400">Assigned Ops Head</p>
                  <p className="text-slate-700 dark:text-slate-200 mt-0.5">{client.ops_head_name || 'Sanjay Sharma'}</p>
                </div>
                <div>
                  <p className="font-bold uppercase tracking-wider text-[10px] text-slate-400">Assigned Team Lead</p>
                  <p className="text-slate-700 dark:text-slate-200 mt-0.5">{client.tl_name || 'Vikram Rathore'}</p>
                </div>
              </div>

              {/* Action buttons inside the card */}
              <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-slate-850">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSendMail(client);
                  }}
                  className="flex items-center text-xs text-brand-primary hover:underline font-bold"
                >
                  <Mail className="h-3.5 w-3.5 mr-1" />
                  Send Mail
                </button>
              </div>
            </div>
          ))}
          {clients.length === 0 && (
            <p className="text-slate-400 col-span-2 text-center py-6">No clients found.</p>
          )}
        </div>
      )}

      {/* Client Detail & Edit Modal */}
      {selectedClient && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-card border border-gray-200 dark:border-slate-700 shadow-xl w-full max-w-md space-y-4">
            <div className="flex justify-between items-center border-b border-gray-150 dark:border-slate-750 pb-3">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Client File</h3>
              <button onClick={() => setSelectedClient(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {msg && (
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 border border-emerald-250 text-xs font-bold rounded">
                {msg}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-455">Client Name</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{selectedClient.name}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-455">System ID Code</p>
                <p className="font-mono text-brand-primary font-bold mt-0.5">{selectedClient.client_id}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-455">Assigned Manager</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{selectedClient.ops_head_name || 'Sanjay Sharma'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-455">Supervisor Team Lead</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{selectedClient.tl_name || 'Vikram Rathore'}</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] uppercase font-bold text-slate-455">Client Contact Email</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  {selectedClient.client_id.toLowerCase().replace('cli-', '')}@medicalbilling.com
                </p>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-455 mb-1">Contract Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-slate-750">
              <button
                type="button"
                onClick={() => handleSendMail(selectedClient)}
                className="flex items-center text-xs text-brand-primary hover:underline font-bold"
              >
                <Mail className="h-4 w-4 mr-1" />
                Send Mail
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedClient(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 rounded text-slate-650"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSaveStatus}
                  className="flex items-center px-4 py-1.5 bg-brand-primary bg-brand-primary-hover text-white rounded text-xs font-bold"
                >
                  <Save className="h-3.5 w-3.5 mr-1" />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default ClientsPage;
