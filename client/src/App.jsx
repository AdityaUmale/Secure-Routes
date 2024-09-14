import { useState, useEffect } from 'react';
import axios from 'axios';
import ProxyDetails from './components/ProxyDetails';

function App() {
  const [targetUrl, setTargetUrl] = useState('');
  const [rateLimit, setRateLimit] = useState('');
  const [proxies, setProxies] = useState([]);

  useEffect(() => {
    fetchProxies();
  }, []);

  const fetchProxies = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/proxies');
      setProxies(response.data);
    } catch (error) {
      console.error('Error fetching proxies:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const fullTargetUrl = targetUrl.startsWith('http') ? targetUrl : `http://${targetUrl}`;
      const response = await axios.post('http://localhost:8080/api/create-proxy', { targetUrl: fullTargetUrl, rateLimit: parseInt(rateLimit) });
      setProxies([...proxies, response.data]);
      setTargetUrl('');
      setRateLimit('');
    } catch (error) {
      console.error('Error creating proxy:', error);
    }
  };

  const handleProxyUpdate = (updatedProxy) => {
    setProxies(proxies.map(proxy => proxy._id === updatedProxy._id ? updatedProxy : proxy));
  };

  return (
    <div className="container mx-auto p-4 font-sans">
      <h1 className="text-3xl font-bold mb-6 text-purple-800">API Security Tool</h1>
      
      <div className="mx-4 bg-purple-100 p-6 rounded-2xl mb-8">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              className="block text-purple-700 text-sm font-bold mb-2"
              htmlFor="targetUrl"
            >
              API URL
            </label>
            <input
              className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-purple-700 leading-tight focus:outline-none focus:shadow-outline"
              id="targetUrl"
              type="text"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="Enter target API URL"
              required
            />
          </div>
          <div className="mb-4">
            <label
              className="block text-purple-700 text-sm font-bold mb-2"
              htmlFor="rateLimit"
            >
              Rate Limit
            </label>
            <input
              className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-purple-700 leading-tight focus:outline-none focus:shadow-outline"
              id="rateLimit"
              type="number"
              value={rateLimit}
              onChange={(e) => setRateLimit(e.target.value)}
              placeholder="Enter Rate Limit"
              required
            />
          </div>
          <div>
            <button
              className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline w-full"
              type="submit"
            >
              Create Proxy
            </button>
          </div>
        </form>
      </div>
      
      <div className="proxy-list">
        {proxies.map(proxy => (
          <ProxyDetails key={proxy._id} proxy={proxy} onUpdate={handleProxyUpdate} />
        ))}
      </div>
    </div>
  );
}

export default App;