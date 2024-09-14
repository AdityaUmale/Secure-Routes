import  { useState } from 'react';
import axios from 'axios';

function ProxyDetails({ proxy, onUpdate }) {
  const [tempRateLimit, setTempRateLimit] = useState(proxy.rateLimit);

  const handleRateLimitChange = (e) => {
    setTempRateLimit(parseInt(e.target.value));
  };

  const handleSaveRateLimit = async () => {
    try {
      const response = await axios.put(`http://localhost:8080/api/update-rate-limit/${proxy._id}`, {
        rateLimit: tempRateLimit
      });
      onUpdate(response.data);
    } catch (error) {
      console.error('Error updating rate limit:', error);
    }
  };

  return (
    <div className="container mx-auto p-4 font-sans bg-green-50 mb-4 rounded-2xl">
      <h1 className="text-2xl font-bold mb-4 text-green-800">Proxy Details</h1>

      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2 text-green-700">Original URL</h2>
        <input
          type="text"
          value={proxy.originalUrl}
          readOnly
          className="w-full p-2 border rounded border-green-300 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
        />
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2 text-green-700">Proxy URL</h2>
        <input
          type="text"
          value={proxy.proxyUrl}
          readOnly
          className="w-full p-2 border rounded border-green-300 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
        />
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2 text-green-700">Stats</h2>
        <div className="bg-green-100 p-4 rounded">
          <div className="mb-2">
            <label htmlFor="rateLimit" className="block mb-1 text-green-800">
              Rate Limit:
            </label>
            <div className="flex items-center">
              <input
                type="number"
                id="rateLimit"
                name="rateLimit"
                value={tempRateLimit}
                onChange={handleRateLimitChange}
                className="w-full p-2 border rounded-l border-green-300 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              />
              <button
                onClick={handleSaveRateLimit}
                className="bg-green-500 text-white px-4 py-2 rounded-r hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Save
              </button>
            </div>
          </div>
          <div>
            <p className="font-semibold text-green-800">
              Request Count:{" "}
              <span className="font-normal text-green-900">{proxy.requestCount}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProxyDetails;
