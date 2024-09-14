import { useState, useEffect } from 'react';
import axios from 'axios';
import ProxyDetails from './components/ProxyDetails';

function App() {
  const [targetUrl, setTargetUrl] = useState('');
  const [rateLimit, setRateLimit] = useState(100);
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
      const response = await axios.post('http://localhost:8080/api/create-proxy', { targetUrl: fullTargetUrl, rateLimit });
      setProxies([...proxies, response.data]);
      setTargetUrl('');
      setRateLimit(100);
    } catch (error) {
      console.error('Error creating proxy:', error);
    }
  };

  const handleProxyUpdate = (updatedProxy) => {
    setProxies(proxies.map(proxy => proxy._id === updatedProxy._id ? updatedProxy : proxy));
  };

  return (
    <div className="App">
      <h1>API Security Tool</h1>
      <form onSubmit={handleSubmit}>
        <input 
          type="text" 
          value={targetUrl} 
          onChange={(e) => setTargetUrl(e.target.value)} 
          placeholder="Enter target API URL" 
          required 
        />
        <input 
          type="number" 
          value={rateLimit} 
          onChange={(e) => setRateLimit(e.target.value)} 
          placeholder="Rate Limit" 
        />
        <button type="submit">Create Proxy</button>
      </form>
      <div className="proxy-list">
        {proxies.map(proxy => (
          <ProxyDetails key={proxy._id} proxy={proxy} onUpdate={handleProxyUpdate} />
        ))}
      </div>
    </div>
  );
}

export default App;