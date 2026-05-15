'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@workspace/backend/convex/_generated/api';
import type { Id } from '@workspace/backend/convex/_generated/dataModel';
import { useDeviceId } from '@/hooks/useDeviceId';
import { DateTime } from 'luxon';

type MedicalSubType = 'temperature' | 'medicine';

export default function MedicalEditPage() {
  const router = useRouter();
  const params = useParams();
  const activityId = params.activityId as string;
  const deviceId = useDeviceId();
  const activityIdTyped = activityId as Id<'activities'>;

  const activity = useQuery(
    api.web.babyTracker.activities.getById,
    deviceId ? { deviceId, activityId: activityIdTyped } : 'skip'
  );

  const updateActivity = useMutation(api.web.babyTracker.activities.update);
  const deleteActivity = useMutation(api.web.babyTracker.activities.deleteActivity);

  const [subType, setSubType] = useState<MedicalSubType>('temperature');
  const [timestamp, setTimestamp] = useState('');
  const [tempValue, setTempValue] = useState('');
  const [medName, setMedName] = useState('');
  const [medValue, setMedValue] = useState('');
  const [medUnit, setMedUnit] = useState('ml');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized || !activity) return;
    const a = activity as any;

    const med = a.medical;
    if (med) {
      if (med.type) setSubType(med.type);
      if (med.temperature?.value !== undefined) setTempValue(String(med.temperature.value));
      if (med.medicine) {
        setMedName(med.medicine.name || '');
        setMedValue(med.medicine.value !== undefined ? String(med.medicine.value) : '');
        setMedUnit(med.medicine.unit || 'ml');
      }
    }

    const ts = DateTime.fromISO(a.timestamp);
    if (ts.isValid) setTimestamp(ts.toFormat("yyyy-MM-dd'T'HH:mm"));

    setInitialized(true);
  }, [activity, initialized]);

  const isFuture = timestamp ? DateTime.fromISO(timestamp) > DateTime.now() : false;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceId) return;
    setError(null);
    setSubmitting(true);

    try {
      const ts = DateTime.fromISO(timestamp);
      if (!ts.isValid) {
        setError('Invalid timestamp');
        setSubmitting(false);
        return;
      }

      let activityPayload: any = {
        timestamp: ts.toUTC().toISO(),
        type: 'medical',
      };

      if (subType === 'temperature') {
        const val = parseFloat(tempValue);
        if (isNaN(val)) {
          setError('Please enter a valid temperature');
          setSubmitting(false);
          return;
        }
        activityPayload.medical = { type: 'temperature', temperature: { value: val } };
      } else {
        const val = parseFloat(medValue);
        if (!medName.trim()) {
          setError('Please enter a medicine name');
          setSubmitting(false);
          return;
        }
        if (isNaN(val) || val <= 0) {
          setError('Please enter a valid amount');
          setSubmitting(false);
          return;
        }
        activityPayload.medical = {
          type: 'medicine',
          medicine: { name: medName.trim(), unit: medUnit || 'ml', value: val },
        };
      }

      await updateActivity({ deviceId, activityId: activityIdTyped, activity: activityPayload });
      router.push('/');
    } catch (err: any) {
      setError(err?.message || 'Failed to update');
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteActivity({ activityId: activityIdTyped });
      router.push('/');
    } catch (err: any) {
      setError(err?.message || 'Failed to delete');
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 bg-white/80 backdrop-blur border-b border-gray-200 z-40">
        <div className="flex items-center px-4 py-3">
          <button onClick={() => router.back()} className="text-gray-500 mr-3 text-lg">
            ←
          </button>
          <h1 className="text-lg font-bold text-gray-900 flex-1">Edit Medical Record</h1>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="text-red-500 text-sm font-medium"
          >
            Delete
          </button>
        </div>
      </header>

      {!activity && deviceId && (
        <div className="flex items-center justify-center h-40 text-gray-400">Loading...</div>
      )}

      {activity && (
        <form onSubmit={handleUpdate} className="p-4">
          {/* Sub-type selector */}
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setSubType('temperature')}
              className={`flex-1 flex flex-col items-center gap-1 py-4 px-2 rounded-xl text-sm font-medium transition-colors border-2 ${
                subType === 'temperature'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
              }`}
            >
              <span className="text-2xl">🌡️</span>
              Temperature
            </button>
            <button
              type="button"
              onClick={() => setSubType('medicine')}
              className={`flex-1 flex flex-col items-center gap-1 py-4 px-2 rounded-xl text-sm font-medium transition-colors border-2 ${
                subType === 'medicine'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
              }`}
            >
              <span className="text-2xl">💊</span>
              Medicine
            </button>
          </div>

          {/* Timestamp */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
            <input
              type="datetime-local"
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {isFuture && (
              <p className="mt-1 text-xs text-amber-600 flex items-center gap-1">
                ⚠️ This activity is in the future
              </p>
            )}
          </div>

          {/* Sub-type fields */}
          {subType === 'temperature' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Temperature (°C)
              </label>
              <input
                type="number"
                step="0.1"
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. 37.5"
              />
            </div>
          )}

          {subType === 'medicine' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={medName}
                  onChange={(e) => setMedName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. Paracetamol"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <input
                    type="number"
                    step="0.1"
                    value={medValue}
                    onChange={(e) => setMedValue(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="5"
                  />
                </div>
                <div className="w-24">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <input
                    type="text"
                    value={medUnit}
                    onChange={(e) => setMedUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="ml"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="mt-4 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full py-3 bg-blue-600 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
          >
            {submitting ? 'Saving...' : 'Update Medical Record'}
          </button>
        </form>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Delete Medical Record?</h2>
            <p className="text-sm text-gray-500 mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
