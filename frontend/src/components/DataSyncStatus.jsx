import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CloudIcon,
  ServerIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  SignalIcon,
  DatabaseIcon,
  ClockIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import apiClient from '../services/api/client';
import toast from 'react-hot-toast';

const DataSyncStatus = () => {
  const [syncStatus, setSyncStatus] = useState(null);
  const [connectionInfo, setConnectionInfo] = useState(null);
  const [collections, setCollections] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchSyncStatus();
    fetchConnectionInfo();
    fetchCollections();
  }, []);

  const fetchSyncStatus = async () => {
    try {
      const response = await apiClient.get('/data-sync/status');
      if (response.data.success) {
        setSyncStatus(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching sync status:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConnectionInfo = async () => {
    try {
      const response = await apiClient.get('/data-sync/connection-info');
      if (response.data.success) {
        setConnectionInfo(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching connection info:', error);
    }
  };

  const fetchCollections = async () => {
    try {
      const response = await apiClient.get('/data-sync/collections');
      if (response.data.success) {
        setCollections(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
    }
  };

  const handleForceSync = async () => {
    try {
      setSyncing(true);
      const response = await apiClient.post('/data-sync/force-sync');
      if (response.data.success) {
        toast.success('Manual sync completed successfully');
        fetchSyncStatus();
        fetchCollections();
      }
    } catch (error) {
      console.error('Error during manual sync:', error);
      toast.error('Manual sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
      case 'connected':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'disconnected':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'syncing':
      case 'validating':
        return <ArrowPathIcon className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <SignalIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
      case 'connected':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'disconnected':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'syncing':
      case 'validating':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatUptime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm border"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <DatabaseIcon className="h-5 w-5 mr-2 text-emerald-600" />
              Data Synchronization Status
            </h3>
            <button
              onClick={handleForceSync}
              disabled={syncing}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-4 w-4 mr-1 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Force Sync'}
            </button>
          </div>

          {/* Connection Status */}
          {connectionInfo && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className={`p-4 rounded-lg border ${getStatusColor(syncStatus?.status || 'idle')}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {connectionInfo.isAtlas ? (
                      <CloudIcon className="h-5 w-5 mr-2" />
                    ) : (
                      <ServerIcon className="h-5 w-5 mr-2" />
                    )}
                    <span className="font-medium">
                      {connectionInfo.isAtlas ? 'MongoDB Atlas' : 'Local MongoDB'}
                    </span>
                  </div>
                  {getStatusIcon(syncStatus?.status)}
                </div>
                <div className="mt-2 text-sm opacity-75">
                  <div>Database: {connectionInfo.name}</div>
                  <div>Host: {connectionInfo.host}:{connectionInfo.port}</div>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <ChartBarIcon className="h-5 w-5 mr-2 text-gray-600" />
                    <span className="font-medium text-gray-900">Sync Metrics</span>
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  <div>Sync Count: {syncStatus?.syncCount || 0}</div>
                  <div>Errors: {syncStatus?.errors || 0}</div>
                  <div>Health Score: {syncStatus?.healthScore || 100}%</div>
                </div>
              </div>
            </div>
          )}

          {/* Sync Statistics */}
          {syncStatus && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{syncStatus.syncCount || 0}</div>
                <div className="text-sm text-gray-600">Total Syncs</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{syncStatus.changeStreamsActive || 0}</div>
                <div className="text-sm text-gray-600">Active Streams</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{syncStatus.conflicts || 0}</div>
                <div className="text-sm text-gray-600">Conflicts</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{syncStatus.errors || 0}</div>
                <div className="text-sm text-gray-600">Errors</div>
              </div>
            </div>
          )}

          {/* Last Sync Info */}
          {syncStatus?.lastSync && (
            <div className="flex items-center text-sm text-gray-600 mb-4">
              <ClockIcon className="h-4 w-4 mr-1" />
              Last sync: {new Date(syncStatus.lastSync).toLocaleString()}
            </div>
          )}

          {/* System Info */}
          {syncStatus && (
            <div className="text-xs text-gray-500 space-y-1">
              <div>Uptime: {formatUptime(syncStatus.uptime)}</div>
              <div>Memory: {formatBytes(syncStatus.memoryUsage?.heapUsed || 0)} / {formatBytes(syncStatus.memoryUsage?.heapTotal || 0)}</div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Collections Status */}
      {collections && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm border"
        >
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Collection Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(collections.collections).map(([name, stats]) => (
                <div key={name} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900 capitalize">{name}</span>
                    {stats.hasDocuments ? (
                      <CheckCircleIcon className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircleIcon className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    <div>Documents: {stats.documentCount?.toLocaleString() || 0}</div>
                    <div>Indexes: {stats.indexes || 0}</div>
                    {stats.storageSize && (
                      <div>Size: {formatBytes(stats.storageSize)}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default DataSyncStatus;
