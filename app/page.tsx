'use client';

import { useState } from 'react';

interface SearchResult {
  title: string;
  content: string;
  source: string;
}

export default function Home() {
  const [topic, setTopic] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [progress, setProgress] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleDeepSearch = async () => {
    if (!topic.trim()) return;

    setIsSearching(true);
    setSearchResults([]);
    setProgress('Initializing deep search...');

    try {
      const response = await fetch('/api/deep-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic }),
      });

      if (!response.ok) throw new Error('Search failed');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.type === 'progress') {
                  setProgress(data.message);
                } else if (data.type === 'result') {
                  setSearchResults(prev => [...prev, data.result]);
                } else if (data.type === 'complete') {
                  setProgress('Deep search complete!');
                  setIsSearching(false);
                }
              } catch (e) {
                console.error('Parse error:', e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      setProgress('Search failed. Please try again.');
      setIsSearching(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (searchResults.length === 0) return;

    setIsGeneratingPdf(true);
    setProgress('Generating PDF...');

    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          results: searchResults
        }),
      });

      if (!response.ok) throw new Error('PDF generation failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${topic.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_report.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setProgress('PDF downloaded successfully!');
    } catch (error) {
      console.error('PDF generation error:', error);
      setProgress('PDF generation failed. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4 text-center">
            Deep Search PDF Generator
          </h1>
          <p className="text-gray-600 text-center mb-8">
            Research any topic with AI-powered deep search and generate comprehensive PDF reports - completely free!
          </p>

          <div className="space-y-4">
            <div>
              <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
                Enter your topic or niche
              </label>
              <input
                id="topic"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isSearching && handleDeepSearch()}
                placeholder="e.g., Machine Learning in Healthcare, Sustainable Energy Solutions..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-800"
                disabled={isSearching}
              />
            </div>

            <button
              onClick={handleDeepSearch}
              disabled={isSearching || !topic.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
            >
              {isSearching ? 'Searching...' : 'Start Deep Search'}
            </button>
          </div>

          {progress && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-700 text-sm font-medium flex items-center">
                {isSearching && (
                  <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {progress}
              </p>
            </div>
          )}
        </div>

        {searchResults.length > 0 && (
          <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Search Results ({searchResults.length})
              </h2>
              <button
                onClick={handleGeneratePDF}
                disabled={isGeneratingPdf}
                className="bg-green-600 text-white py-2 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
              >
                {isGeneratingPdf ? 'Generating...' : 'Generate PDF'}
              </button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {searchResults.map((result, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-gray-800 mb-2">{result.title}</h3>
                  <p className="text-gray-600 text-sm mb-2 line-clamp-3">{result.content}</p>
                  <p className="text-xs text-purple-600 font-medium">Source: {result.source}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white/90 rounded-xl p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">How it works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div className="p-4">
              <div className="text-3xl mb-2">🔍</div>
              <div className="font-semibold mb-1">Deep Search</div>
              <div>AI-powered multi-source research on your topic</div>
            </div>
            <div className="p-4">
              <div className="text-3xl mb-2">📊</div>
              <div className="font-semibold mb-1">Real-time Results</div>
              <div>See information as it's discovered and validated</div>
            </div>
            <div className="p-4">
              <div className="text-3xl mb-2">📄</div>
              <div className="font-semibold mb-1">Generate PDF</div>
              <div>Create professional reports instantly</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
