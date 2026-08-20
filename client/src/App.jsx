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
            setErrorMessage('Could not connect to Render backend or CognoDB.');
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
        if (networkRef.current && graphData.nodes?.length > 0) {
            const visNodes = graphData.nodes.map((node) => {
                const label = node.labels?.[0] || 'Node';
                let color = '#6366f1';
                if (label === 'Developer') color = '#3b82f6';
                if (label === 'Skill') color = '#10b981';
                if (label === 'JobRole') color = '#f59e0b';
                if (label === 'Project') color = '#ec4899';

                const nodeName = node.properties?.name || node.properties?.title || 'Entity';

                return {
                    id: String(node.id),
                    label: `${nodeName}\n(${label})`,
                    color: { background: color, border: '#ffffff' },
                    font: { color: '#ffffff', size: 14 },
                    shape: 'box',
                    margin: 10,
                };
            });

            const visEdges = graphData.links.map((link) => ({
                id: String(link.id),
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
                    barnesHut: { gravitationalConstant: -2000, springLength: 120 },
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
        <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', padding: '24px', fontFamily: 'sans-serif' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '16px', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '24px', color: '#818cf8' }}>SkillGraph Navigator</h1>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>
                        AI-Powered Career Pathway & 2-Hop Knowledge Graph Traversal
                    </p>
                </div>
                <button
                    onClick={loadGraph}
                    style={{ backgroundColor: '#4f46e5', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    🔄 Reload Graph
                </button>
            </header>

            {errorMessage && (
                <div style={{ padding: '12px', backgroundColor: '#4c0519', border: '1px solid #9f1239', borderRadius: '6px', color: '#fecdd3', fontSize: '14px', marginBottom: '16px' }}>
                    🚨 {errorMessage}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                {/* Visual Graph View */}
                <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '12px', border: '1px solid #334155' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h2 style={{ margin: 0, fontSize: '16px', color: '#f1f5f9' }}>Interactive Visual Graph Canvas</h2>
                        {loading && <span style={{ color: '#818cf8', fontSize: '12px' }}>Loading...</span>}
                    </div>

                    <div
                        ref={networkRef}
                        style={{
                            height: '520px',
                            width: '100%',
                            backgroundColor: '#020617',
                            borderRadius: '8px',
                            border: '1px solid #1e293b',
                        }}
                    />
                </div>

                {/* Skill Gap Side Panel */}
                <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '12px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                        <h2 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#a5b4fc' }}>Skill Gap Analysis</h2>
                        <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#94a3b8' }}>
                            2-hop parameterized query executing over REQUIRES and RELATED_TO paths.
                        </p>

                        <div style={{ backgroundColor: '#0f172a', padding: '12px', borderRadius: '8px', border: '1px solid #1e293b', marginBottom: '16px' }}>
                            {/* Added htmlFor matching the select element's id */}
                            <label htmlFor="target-job-role" style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px' }}>
                                Target Job Role:
                            </label>
                            <select
                                id="target-job-role"
                                name="targetJobRole"
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                                style={{ width: '100%', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', borderRadius: '4px', padding: '8px', fontSize: '13px' }}
                            >
                                <option value="Graph Database Developer">Graph Database Developer</option>
                                <option value="Full Stack Engineer">Full Stack Engineer</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                            {skillGap?.skillGaps?.length > 0 ? (
                                skillGap.skillGaps.map((gap, i) => (
                                    <div key={i} style={{ backgroundColor: '#0f172a', padding: '10px', borderRadius: '6px', border: '1px solid #881337', fontSize: '12px', color: '#fb7185' }}>
                                        ⚠️ Missing: {gap.missingSkill}
                                    </div>
                                ))
                            ) : (
                                <div style={{ backgroundColor: '#064e3b', padding: '12px', borderRadius: '6px', border: '1px solid #047857', textAlign: 'center' }}>
                                    <p style={{ margin: 0, color: '#34d399', fontSize: '13px', fontWeight: 'bold' }}>✨ No missing skills found!</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ borderTop: '1px solid #334155', paddingTop: '12px', fontSize: '11px', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Database: <strong>CognoDB Cloud</strong></span>
                        <span>Query: <strong>Parameterized Cypher</strong></span>
                    </div>
                </div>
            </div>
        </div>
    );
}