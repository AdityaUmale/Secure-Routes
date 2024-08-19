import  { useState } from 'react';
import axios from 'axios';

function App() {
  const [targetUrl, setTargetUrl] = useState('');
  const [rateLimit, setRateLimit] = useState(100);
  const [proxyUrl, setProxyUrl] = useState('');
  const [stats, setStats] = useState(null);
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8080/api/create-proxy', { targetUrl, rateLimit });
      setProxyUrl(response.data.proxyUrl);
    } catch (error) {
      console.error('Error creating proxy:', error);
    }
  };

  const getStats = async () => {
    try {
      const id = proxyUrl.split('/').pop();
      const response = await axios.get(`http://localhost:8080/api/stats/${id}`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
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
      {proxyUrl && (
        <div>
          <h2>Your Proxy URL:</h2>
          <p>{proxyUrl}</p>
          <button onClick={getStats}>Get Stats</button>
        </div>
      )}
      {stats && (
        <div>
          <h2>Stats:</h2>
          <p>Request Count: {stats.requestCount}</p>
          <p>Rate Limit: {stats.rateLimit}</p>
        </div>
      )}
    </div>
  );
}

export default App;