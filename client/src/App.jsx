import React, { useState, useEffect, useRef } from 'react';
import { Network } from 'vis-network';
import { getGraphData, getSkillGap } from './api';
import 'vis-network/styles/vis-network.css';

export default function App() {
    const [graphData, setGraphData] = useState({ nodes: [], links: [] });
    const [skillGap, setSkillGap] = useState(null);
    const [selectedRole, setSelectedRole] = useState('Graph Database Developer');
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState(null);
    const networkRef = useRef(null);

    useEffect(() => {
        loadGraph();
    }, []);

    useEffect(() => {
        loadSkillGap();
    }, [selectedRole]);

    const loadGraph = async () => {
        setLoading(true);
        setErrorMessage(null);
        try {
            const data = await getGraphData();
            setGraphData(data);
        } catch (err) {
            console.error('Failed to load graph:', err);
            setErrorMessage('Could not connect to Render backend or CognoDB. Ensure backend is active.');
        } finally {
            setLoading(false);
        }
    };

    const loadSkillGap = async () => {
        try {
            const data = await getSkillGap('Alex Johnson', selectedRole);
            setSkillGap(data);
        } catch (err) {
            console.error('Skill gap fetch failed:', err);
        }
    };

    // vis-network initialization logic
    useEffect(() => {
        if (networkRef.current) {
            // Use API data or fallback sample nodes if database is empty
            const rawNodes = graphData.nodes?.length > 0 ? graphData.nodes : [];
            const rawLinks = graphData.links?.length > 0 ? graphData.links : [];

            const visNodes = rawNodes.map((node, index) => {
                const label = node.labels?.[0] || 'Node';
                let color = '#6366f1';
                if (label === 'Developer') color = '#3b82f6';
                if (label === 'Skill') color = '#10b981';
                if (label === 'JobRole') color = '#f59e0b';
                if (label === 'Project') color = '#ec4899';

                return {
                    id: String(node.id || index + 1),
                    label: `${node.properties?.name || node.properties?.title || 'Entity'}\n(${label})`,
                    color: { background: color, border: '#ffffff' },
                    font: { color: '#ffffff', size: 13 },
                    shape: 'box',
                    margin: 10,
                };
            });

            const visEdges = rawLinks.map((link, index) => ({
                id: `e-${index}`,
                from: String(link.source),
                to: String(link.target),
                label: link.type || '',
                font: { color: '#94a3b8', size: 10, align: 'top' },
                arrows: 'to',
                color: { color: '#64748b' },
            }));

            const options = {
                autoResize: true,
                height: '100%',
                width: '100%',
                nodes: { borderWidth: 2, shadow: true },
                edges: { smooth: { type: 'continuous' } },
                physics: {
                    enabled: true,
                    barnesHut: { gravitationalConstant: -2000, springLength: 100 },
                },
                interaction: { hover: true },
            };

            const network = new Network(
                networkRef.current,
                { nodes: visNodes, edges: visEdges },
                options
            );

            return () => network.destroy();
        }
    }, [graphData]);

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 p-6 font-sans">
            <header className="mb-6 flex flex-col md:flex-row justify-between md:items-center border-b border-slate-800 pb-4 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-indigo-400">SkillGraph Navigator</h1>
                    <p className="text-slate-400 text-xs mt-1">
                        AI-Powered Career Pathway & 2-Hop Knowledge Graph Traversal
                    </p>
                </div>
                <button
                    onClick={loadGraph}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-lg self-start md:self-auto"
                >
                    🔄 Reload Graph
                </button>
            </header>

            {errorMessage && (
                <div className="mb-4 p-3 bg-rose-950/80 border border-rose-800 rounded-lg text-rose-300 text-xs">
                    🚨 {errorMessage}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Interactive Visual Canvas Container */}
                <div className="lg:col-span-2 bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-xl flex flex-col">
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-md font-bold text-slate-200">Interactive Visual Graph Canvas</h2>
                        {loading && <span className="text-indigo-400 text-xs animate-pulse">Loading CognoDB...</span>}
                    </div>

                    {/* Enforced explicit inline styles prevent container collapse */}
                    <div
                        ref={networkRef}
                        style={{
                            height: '500px',
                            width: '100%',
                            minHeight: '500px',
                            backgroundColor: '#0f172a',
                            borderRadius: '8px',
                            border: '1px solid #334155',
                            display: 'block',
                        }}
                    />
                </div>

                {/* 2-Hop Traversal Skill Gap Panel */}
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-xl flex flex-col justify-between">
                    <div>
                        <h2 className="text-md font-bold text-indigo-300 mb-1">Skill Gap Analysis</h2>
                        <p className="text-[11px] text-slate-400 mb-4">
                            2-hop parameterized query executing over <code className="text-indigo-400">REQUIRES</code> and <code className="text-indigo-400">RELATED_TO</code> paths.
                        </p>

                        <div className="mb-4 bg-slate-900 p-3 rounded-lg border border-slate-800">
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Target Job Role:</label>
                            <select
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                                className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded p-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                                <option value="Graph Database Developer">Graph Database Developer</option>
                                <option value="Full Stack Engineer">Full Stack Engineer</option>
                            </select>
                        </div>

                        <div className="space-y-2 max-h-[320px] overflow-y-auto">
                            {skillGap?.skillGaps?.length > 0 ? (
                                skillGap.skillGaps.map((gap, i) => (
                                    <div key={i} className="bg-slate-900/80 p-3 rounded-lg border border-rose-900/40 text-xs">
                                        <span className="font-semibold text-rose-400">⚠️ Missing: {gap.missingSkill}</span>
                                        {gap.prerequisites?.length > 0 && (
                                            <p className="text-[11px] text-slate-400 mt-1">
                                                💡 Prerequisites: {gap.prerequisites.join(', ')}
                                            </p>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="bg-emerald-950/30 p-3.5 rounded-lg border border-emerald-800/50 text-center">
                                    <p className="text-emerald-400 text-xs font-medium">✨ No missing skills found!</p>
                                    <p className="text-[10px] text-slate-400 mt-1">Developer satisfies all role criteria.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-700 text-[10px] text-slate-400 flex justify-between">
                        <span>Database: <strong>CognoDB Cloud</strong></span>
                        <span>Query: <strong>Parameterized Cypher</strong></span>
                    </div>
                </div>
            </div>
        </div>
    );
}