"use client"

export default function DebugPage() {
    // In client components, we can't use getRequestContext easily. 
    // We'll rely on the /api/debug route for the heavy lifting of env probing.
    // This page will act as a UI shell.
    
    return (
        <div style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ color: '#059669' }}>Infrastructure Diagnostics</h1>
            <p>This page helps you check your Cloudflare Pages configuration.</p>
            
            <div style={{ padding: '1.5rem', background: '#eff6ff', borderLeft: '4px solid #3b82f6', borderRadius: '0.5rem', marginBottom: '2rem' }}>
                <h3 style={{ margin: 0, color: '#1e40af' }}>Action Recommended</h3>
                <p>1. Go to your <b>Cloudflare Pages Dashboard</b> &rarr; <b>Settings</b> &rarr; <b>Functions</b> &rarr; <b>D1 database bindings</b>.</p>
                <p>2. Link <b>school-nexus-db</b> with Variable name: <b>DB</b>.</p>
                <p>3. Do the same for <b>R2 Bucket bindings</b> with name: <b>BUCKET</b>.</p>
                
                <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                    <button 
                        onClick={() => window.location.reload()} 
                        style={{ background: '#1d4ed8', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        I've Linked it, Refresh
                    </button>
                    <a 
                        href="/api/debug" 
                        target="_blank"
                        style={{ background: '#059669', color: 'white', textDecoration: 'none', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontWeight: 'bold' }}
                    >
                        View Raw Env Data
                    </a>
                </div>
            </div>

            <p style={{ marginTop: '2rem', fontSize: '0.8rem', color: '#64748b' }}>
                Platform: schoolnexuspro.pages.dev | Architecture: Native-Path-V3
            </p>
        </div>
    );
}
