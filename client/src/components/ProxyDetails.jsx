import  { useState } from 'react';
import axios from 'axios';

function ProxyDetails({ proxy, onUpdate }) {
  const [editingRateLimit, setEditingRateLimit] = useState(false);
  const [newRateLimit, setNewRateLimit] = useState(proxy.rateLimit);

  const handleRateLimitChange = async () => {
    try {
      const response = await axios.put(`http://localhost:8080/api/update-rate-limit/${proxy._id}`, {
        rateLimit: newRateLimit
      });
      onUpdate(response.data);
      setEditingRateLimit(false);
    } catch (error) {
      console.error('Error updating rate limit:', error);
    }
  };

  return (
    <div className="proxy-details">
      <h3>Proxy Details</h3>
      <p><strong>Original URL:</strong> {proxy.originalUrl}</p>
      <p><strong>Proxy URL:</strong> {proxy.proxyUrl}</p>
      <div>
        <strong>Rate Limit:</strong>
        {editingRateLimit ? (
          <>
            <input
              type="number"
              value={newRateLimit}
              onChange={(e) => setNewRateLimit(e.target.value)}
            />
            <button onClick={handleRateLimitChange}>Save</button>
            <button onClick={() => setEditingRateLimit(false)}>Cancel</button>
          </>
        ) : (
          <>
            {proxy.rateLimit}
            <button onClick={() => setEditingRateLimit(true)}>Edit</button>
          </>
        )}
      </div>
      <p><strong>Request Count:</strong> {proxy.requestCount}</p>
    </div>
  );
}

export default ProxyDetails;
