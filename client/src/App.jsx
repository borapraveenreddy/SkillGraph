import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Network } from 'vis-network';

// Ensure URL format is clean
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');

export default function App() {
    const [graphData, setGraphData] = useState({ nodes: [], links: [] });
    const [skillGap, setSkillGap] = useState(null);
    const [selectedRole, setSelectedRole] = useState('Graph Database Developer');
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState(null);
    const networkRef = useRef(null);

    useEffect(() => {
        fetchGraph();
    }, []);

    useEffect(() => {
        fetchSkillGap();
    }, [selectedRole]);

    useEffect(() => {
        // Only initialize network if nodes exist and DOM ref is ready
        if (graphData.nodes && graphData.nodes.length > 0 && networkRef.current) {
            try {
                const visNodes = graphData.nodes.map((node) => {
                    const label = node.labels?.[0] || 'Node';
                    let color = '#6366f1';
                    if (label === 'Developer') color = '#3b82f6';
                    if (label === 'Skill') color = '#10b981';
                    if (label === 'JobRole') color = '#f59e0b';
                    if (label === 'Project') color = '#ec4899';

                    return {
                        id: node.id,
                        label: `${node.properties?.name || node.properties?.title || 'Unnamed'}\n(${label})`,
                        color: { background: color, border: '#ffffff' },
                        font: { color: '#ffffff', size: 14 },
                        shape: 'box',
                        margin: 10,
                    };
                });

                const visEdges = graphData.links.map((link) => ({
                    from: link.source,
                    to: link.target,
                    label: link.type || '',
                    font: { color: '#94a3b8', size: 10, align: 'top' },
                    arrows: 'to',
                    color: { color: '#475569' },
                }));

                const options = {
                    nodes: { borderWidth: 2, shadow: true },
                    edges: { smooth: { type: 'continuous' } },
                    physics: {
                        stabilization: false,
                        barnesHut: { gravitationalConstant: -3000, springLength: 120 },
                    },
                    interaction: { hover: true },
                };

                new Network(networkRef.current, { nodes: visNodes, edges: visEdges }, options);
            } catch (err) {
                console.error('Failed to render Vis Network:', err);
                setErrorMessage('Failed to render graph visualization.');
            }
        }
    }, [graphData]);

    const fetchGraph = async () => {
        setLoading(true);
        setErrorMessage(null);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/graph`);
            setGraphData(res.data);
        } catch (err) {
            console.error('Error fetching graph:', err);
            setErrorMessage(`Backend connection failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const fetchSkillGap = async () => {
        try {
            const res = await axios.get(
                `${API_BASE_URL}/api/skill-gap?developer=Alex%20Johnson&role=${encodeURIComponent(selectedRole)}`
            );
            setSkillGap(res.data);
        } catch (err) {
            console.error('Error fetching skill gap:', err);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 p-6 font-sans">
            <header className="mb-6 border-b border-slate-800 pb-4 flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-indigo-400 tracking-tight">SkillGraph Navigator</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        AI-Powered Career Pathway & 2-Hop Graph Traversal Engine
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={fetchGraph}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm py-2 px-4 rounded-lg transition-colors shadow-lg"
                    >
                        🔄 Reload Graph
                    </button>
                </div>
            </header>

            {errorMessage && (
                <div className="mb-6 p-4 bg-rose-950/80 border border-rose-800 rounded-lg text-rose-200 text-sm">
                    🚨 {errorMessage}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-800/90 p-5 rounded-xl border border-slate-700/80 shadow-xl flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-slate-200">Interactive Knowledge Graph</h2>
                        {loading && <span className="text-indigo-400 text-xs animate-pulse">Loading data...</span>}
                    </div>

                    <div
                        ref={networkRef}
                        className="w-full h-[520px] bg-slate-950/80 rounded-lg border border-slate-800 flex items-center justify-center text-slate-500"
                    >
                        {loading ? 'Fetching Graph from CognoDB...' : graphData.nodes.length === 0 ? 'No graph data found.' : ''}
                    </div>
                </div>

                <div className="bg-slate-800/90 p-5 rounded-xl border border-slate-700/80 shadow-xl flex flex-col justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-indigo-300 mb-1">Skill Gap Analysis</h2>
                        <div className="mb-5 bg-slate-900/60 p-3.5 rounded-lg border border-slate-800">
                            <label className="block text-xs font-semibold text-slate-300 mb-2">Target Job Role:</label>
                            <select
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                                className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded-md py-2 px-3 text-sm"
                            >
                                <option value="Graph Database Developer">Graph Database Developer</option>
                                <option value="Full Stack Engineer">Full Stack Engineer</option>
                            </select>
                        </div>

                        <div className="space-y-3 max-h-[340px] overflow-y-auto">
                            {skillGap?.skillGaps?.length > 0 ? (
                                skillGap.skillGaps.map((gap, i) => (
                                    <div key={i} className="bg-slate-900/80 p-3.5 rounded-lg border border-rose-900/40">
                                        <span className="font-semibold text-rose-400 text-sm">{gap.missingSkill}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="bg-emerald-950/30 p-4 rounded-lg border border-emerald-800/50 text-center">
                                    <p className="text-emerald-400 text-sm">✨ No missing skills found!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}