'use client';

import { useState } from 'react';
import Layout from '../components/layout/Layout';

const SettingsPage = () => {
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    sms: true,
    pushNotifications: false,
    sendToAuthorities: true
  });
  
  const [securitySettings, setSecuritySettings] = useState({
    confidenceThreshold: 75,
    recordFootage: true,
    autoAlert: true,
    alertDelay: 0
  });
  
  const [apiKeys, setApiKeys] = useState({
    geminiApiKey: '',
    mappedInApiKey: ''
  });
  
  const handleNotificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setNotificationSettings(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  
  const handleSecurityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSecuritySettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setApiKeys(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, we would save these settings to the backend
    alert('Settings saved successfully!');
  };
  
  return (
    <Layout>
      <div className="space-y-8">
        <h2 className="text-2xl font-bold text-gray-800">System Settings</h2>
        
        <form onSubmit={handleSaveSettings}>
          {/* Notification Settings */}
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h3 className="text-lg font-semibold mb-4">Notification Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="email" className="block text-gray-700 font-medium">Email Alerts</label>
                  <p className="text-sm text-gray-500">Receive email notifications for high-priority alerts</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    id="email"
                    name="email"
                    checked={notificationSettings.email}
                    onChange={handleNotificationChange}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="sms" className="block text-gray-700 font-medium">SMS Alerts</label>
                  <p className="text-sm text-gray-500">Receive text messages for high-priority alerts</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    id="sms"
                    name="sms"
                    checked={notificationSettings.sms}
                    onChange={handleNotificationChange}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="pushNotifications" className="block text-gray-700 font-medium">Push Notifications</label>
                  <p className="text-sm text-gray-500">Receive push notifications on mobile devices</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    id="pushNotifications"
                    name="pushNotifications"
                    checked={notificationSettings.pushNotifications}
                    onChange={handleNotificationChange}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="sendToAuthorities" className="block text-gray-700 font-medium">Notify Authorities</label>
                  <p className="text-sm text-gray-500">Automatically notify local authorities for critical threats</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    id="sendToAuthorities"
                    name="sendToAuthorities"
                    checked={notificationSettings.sendToAuthorities}
                    onChange={handleNotificationChange}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>
            </div>
          </div>
          
          {/* Security Settings */}
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h3 className="text-lg font-semibold mb-4">Security Settings</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="confidenceThreshold" className="block text-gray-700 font-medium mb-1">Detection Confidence Threshold (%)</label>
                <div className="flex items-center">
                  <input 
                    type="range" 
                    id="confidenceThreshold"
                    name="confidenceThreshold"
                    min="50"
                    max="95"
                    value={securitySettings.confidenceThreshold}
                    onChange={handleSecurityChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" 
                  />
                  <span className="ml-2 w-8 text-gray-700">{securitySettings.confidenceThreshold}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">Higher values reduce false positives but may miss some threats</p>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="recordFootage" className="block text-gray-700 font-medium">Record All Footage</label>
                  <p className="text-sm text-gray-500">Save all video feeds for later review</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    id="recordFootage"
                    name="recordFootage"
                    checked={securitySettings.recordFootage}
                    onChange={handleSecurityChange}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="autoAlert" className="block text-gray-700 font-medium">Automatic Alerts</label>
                  <p className="text-sm text-gray-500">Automatically generate alerts when threats are detected</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    id="autoAlert"
                    name="autoAlert"
                    checked={securitySettings.autoAlert}
                    onChange={handleSecurityChange}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>
              
              <div>
                <label htmlFor="alertDelay" className="block text-gray-700 font-medium mb-1">Alert Delay (seconds)</label>
                <input 
                  type="number" 
                  id="alertDelay"
                  name="alertDelay"
                  min="0"
                  max="30"
                  value={securitySettings.alertDelay}
                  onChange={handleSecurityChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2" 
                />
                <p className="text-sm text-gray-500 mt-1">Delay before sending alerts to verify threats (0 for immediate)</p>
              </div>
            </div>
          </div>
          
          {/* API Keys */}
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h3 className="text-lg font-semibold mb-4">API Configuration</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="geminiApiKey" className="block text-gray-700 font-medium mb-1">Gemini API Key</label>
                <input 
                  type="password" 
                  id="geminiApiKey"
                  name="geminiApiKey"
                  value={apiKeys.geminiApiKey}
                  onChange={handleApiKeyChange}
                  placeholder="Enter your Gemini API key"
                  className="w-full border border-gray-300 rounded-md px-3 py-2" 
                />
                <p className="text-sm text-gray-500 mt-1">Required for AI-powered threat analysis</p>
              </div>
              
              <div>
                <label htmlFor="mappedInApiKey" className="block text-gray-700 font-medium mb-1">MappedIn API Key</label>
                <input 
                  type="password" 
                  id="mappedInApiKey"
                  name="mappedInApiKey"
                  value={apiKeys.mappedInApiKey}
                  onChange={handleApiKeyChange}
                  placeholder="Enter your MappedIn API key"
                  className="w-full border border-gray-300 rounded-md px-3 py-2" 
                />
                <p className="text-sm text-gray-500 mt-1">Required for interactive building maps</p>
              </div>
            </div>
          </div>
          
          {/* Submit Button */}
          <div className="flex justify-end">
            <button 
              type="submit" 
              className="px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default SettingsPage;
