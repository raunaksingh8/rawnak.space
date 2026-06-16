import { useEffect, useRef, useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/birthheatmap.css';

/* ═══════════════════════════════════════════════════════════════
   India Live Birth Counter — birthheatmap.js
   All logic lives here. No inline scripts.
   ═══════════════════════════════════════════════════════════════ */

/* ─── Constants ─── */
const BIRTH_INTERVAL = 1280; // ms between births
const BLINK_DURATION = 900;  // ms for gold blink on state
const FEED_MAX = 8;          // max items in recent births feed
const GEOJSON_URL = process.env.PUBLIC_URL + '/Indian_States.geojson';

/* ─── Population weights for weighted random ─── */
const STATE_WEIGHTS = {
    'Uttar Pradesh': 20,
    'Bihar': 12,
    'Maharashtra': 9,
    'West Bengal': 8,
    'Madhya Pradesh': 7,
    'Rajasthan': 7,
    'Tamil Nadu': 6,
    'Andhra Pradesh': 5,
    'Gujarat': 5,
    'Karnataka': 5,
    'Jharkhand': 4,
    'Orissa': 4,
    'Assam': 4,
    'Kerala': 3,
    'Chhattisgarh': 3,
    'Punjab': 3,
    'Haryana': 3,
    'Delhi': 3,
    'Uttaranchal': 2,
    'Jammu and Kashmir': 2,
    'Himachal Pradesh': 2,
    'Tripura': 1,
    'Meghalaya': 1,
    'Manipur': 1,
    'Nagaland': 1,
    'Mizoram': 1,
    'Arunachal Pradesh': 1,
    'Goa': 1,
    'Sikkim': 1,
    'Puducherry': 1,
    'Chandigarh': 1,
    'Andaman and Nicobar': 1,
    'Dadra and Nagar Haveli': 1,
    'Daman and Diu': 1,
    'Lakshadweep': 1,
};

/* ─── Helpers ─── */

function buildWeightedPool(geojsonFeatures) {
    const pool = [];
    const features = Array.isArray(geojsonFeatures) ? geojsonFeatures : (geojsonFeatures?.features || []);
    features.forEach((feature) => {
        const name = feature.properties?.NAME_1;
        if (!name) return;
        const weight = STATE_WEIGHTS[name] || 1;
        for (let i = 0; i < weight; i++) {
            pool.push(name);
        }
    });
    return pool;
}

function pickWeightedState(pool) {
    return pool[Math.floor(Math.random() * pool.length)];
}

function formatTimer(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const pad = (n) => String(n).padStart(2, '0');
    if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
    return `${pad(m)}:${pad(s)}`;
}

function timeAgo(timestamp) {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 5) return 'just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
}

/* ─── Main Component ─── */

export default function BirthHeatmap() {
    /* Refs for D3-managed DOM */
    const svgRef = useRef(null);
    const tooltipRef = useRef(null);
    const progressRef = useRef(null);
    const counterRef = useRef(null);

    /* State */
    const [loading, setLoading] = useState(true);
    const [geojson, setGeojson] = useState(null);
    const [birthCount, setBirthCount] = useState(0);
    const [elapsedSec, setElapsedSec] = useState(0);
    const [feedItems, setFeedItems] = useState([]);

    /* Mutable refs for interval callbacks */
    const birthCountRef = useRef(0);
    const statePathsRef = useRef({});  // name -> DOM path element
    const stateBirthsRef = useRef({}); // name -> count this session
    const weightedPoolRef = useRef([]);
    const geojsonRef = useRef(null);
    const startTimeRef = useRef(Date.now());
    const d3Ref = useRef(null);

    /* ─── Load D3 dynamically ─── */
    const loadD3 = useCallback(() => {
        return new Promise((resolve, reject) => {
            if (window.d3) { resolve(window.d3); return; }
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/d3/7.9.0/d3.min.js';
            script.onload = () => resolve(window.d3);
            script.onerror = reject;
            document.body.appendChild(script);
        });
    }, []);

    /* ─── Draw map ─── */
    const drawMap = useCallback((d3, geojson) => {
        const svgEl = svgRef.current;
        if (!svgEl) return;

        const svg = d3.select(svgEl);
        svg.selectAll('*').remove();

        const containerEl = svgEl.parentElement;
        const width = containerEl.clientWidth;
        const height = containerEl.clientHeight || width * 1.05;

        svg.attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');

        /* Projection — Mercator centered on India */
        const projection = d3.geoMercator()
            .center([82, 22])
            .scale(Math.min(width, height) * 1.35)
            .translate([width / 2, height / 2]);

        const path = d3.geoPath().projection(projection);

        /* Draw states */
        const paths = svg.selectAll('path')
            .data(geojson.features)
            .enter()
            .append('path')
            .attr('d', path)
            .attr('class', 'bh-state')
            .attr('data-state', (d) => d.properties.NAME_1);

        /* Store references */
        const statePathMap = {};
        paths.each(function (d) {
            statePathMap[d.properties.NAME_1] = this;
        });
        statePathsRef.current = statePathMap;

        /* Tooltip handlers */
        const tooltipEl = tooltipRef.current;

        paths.on('mousemove', function (event, d) {
            const name = d.properties.NAME_1;
            const births = stateBirthsRef.current[name] || 0;
            if (tooltipEl) {
                tooltipEl.innerHTML =
                    `<div class="bh-tooltip-name">${name}</div>` +
                    `<div class="bh-tooltip-births">${births} birth${births !== 1 ? 's' : ''} this session</div>`;
                tooltipEl.style.left = event.clientX + 14 + 'px';
                tooltipEl.style.top = event.clientY - 10 + 'px';
                tooltipEl.classList.add('visible');
            }
        });

        paths.on('mouseleave', function () {
            if (tooltipEl) tooltipEl.classList.remove('visible');
        });
    }, []);

    /* ─── Birth event ─── */
    const triggerBirth = useCallback(() => {
        const pool = weightedPoolRef.current;
        if (!pool.length) return;

        const stateName = pickWeightedState(pool);

        /* Blink the state path */
        const pathEl = statePathsRef.current[stateName];
        if (pathEl) {
            pathEl.classList.add('blink');
            setTimeout(() => pathEl.classList.remove('blink'), BLINK_DURATION);
        }

        /* Increment birth count */
        birthCountRef.current += 1;
        setBirthCount(birthCountRef.current);

        /* Track per-state births */
        stateBirthsRef.current[stateName] = (stateBirthsRef.current[stateName] || 0) + 1;

        /* Pop animation on counter */
        const counterEl = counterRef.current;
        if (counterEl) {
            counterEl.classList.remove('pop');
            // Force reflow to restart animation
            void counterEl.offsetWidth;
            counterEl.classList.add('pop');
        }

        /* Add to feed */
        setFeedItems((prev) => {
            const newItem = {
                state: stateName,
                time: Date.now(),
                id: birthCountRef.current,
            };
            return [newItem, ...prev].slice(0, FEED_MAX);
        });
    }, []);

    /* ─── Initialize everything ─── */
    useEffect(() => {
        let birthInterval;
        let timerInterval;
        let progressInterval;
        let cancelled = false;

        async function init() {
            try {
                const d3 = await loadD3();
                d3Ref.current = d3;

                const response = await fetch(GEOJSON_URL);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const geojson = await response.json();

                if (cancelled) return;

                /* Build weighted pool */
                weightedPoolRef.current = buildWeightedPool(geojson.features);
                geojsonRef.current = geojson;
                setGeojson(geojson);

                /* Start birth ticker */
                birthInterval = setInterval(triggerBirth, BIRTH_INTERVAL);

                /* Session timer — ticks every second */
                startTimeRef.current = Date.now();
                timerInterval = setInterval(() => {
                    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
                    setElapsedSec(elapsed);
                }, 1000);

                /* Progress bar — smooth 60fps-ish animation */
                progressInterval = setInterval(() => {
                    const progressEl = progressRef.current;
                    if (!progressEl) return;
                    const now = Date.now();
                    // Approximate: the interval fires every BIRTH_INTERVAL from the start
                    const elapsed = (now - startTimeRef.current) % BIRTH_INTERVAL;
                    const pct = Math.min((elapsed / BIRTH_INTERVAL) * 100, 100);
                    progressEl.style.width = pct + '%';
                }, 30);

                setLoading(false);
            } catch (err) {
                console.error('BirthHeatmap init error:', err);
                setLoading(false);
            }
        }

        init();

        /* Handle resize */
        function handleResize() {
            const d3 = d3Ref.current;
            const geojson = geojsonRef.current;
            if (!d3 || !svgRef.current || !geojson) return;
            drawMap(d3, geojson);
        }
        window.addEventListener('resize', handleResize);

        return () => {
            cancelled = true;
            clearInterval(birthInterval);
            clearInterval(timerInterval);
            clearInterval(progressInterval);
            window.removeEventListener('resize', handleResize);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ─── Draw map when loaded ─── */
    useEffect(() => {
        const d3 = d3Ref.current;
        if (!loading && geojson && d3) {
            drawMap(d3, geojson);
        }
    }, [loading, geojson, drawMap]);

    /* ─── Derived stats ─── */
    const ratePerMinute = elapsedSec > 0
        ? ((birthCount / elapsedSec) * 60).toFixed(1)
        : '0.0';

    const ratePerHour = elapsedSec > 0
        ? Math.round((birthCount / elapsedSec) * 3600)
        : 0;

    const ratePerDay = elapsedSec > 0
        ? Math.round((birthCount / elapsedSec) * 86400).toLocaleString()
        : '0';

    const intervalDisplay = (BIRTH_INTERVAL / 1000).toFixed(1) + 's';

    /* ─── Render ─── */
    if (loading) {
        return (
            <div className="bh-page">
                <div className="bh-loading">
                    <div className="bh-loading-spinner"></div>
                    <div className="bh-loading-text">Loading India map…</div>
                </div>
            </div>
        );
    }

    return (
        <div className="bh-page">
            {/* Navbar */}
            <nav className="bh-navbar">
                <Link to="/" className="bh-home-link" aria-label="Home">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path d="M3 11.5L12 4l9 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M9 21V12h6v9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Home
                </Link>
            </nav>

            {/* Tooltip (positioned fixed, moved by JS) */}
            <div className="bh-tooltip" ref={tooltipRef}></div>

            {/* Main Layout */}
            <div className="bh-layout">

                {/* ─── Left: Map ─── */}
                <div className="bh-map-panel">
                    <div className="bh-map-title">🇮🇳 India Live Birth Map</div>
                    <div className="bh-map-subtitle">Real-time simulated birth events across states</div>
                    <div className="bh-map-svg-container">
                        <svg ref={svgRef}></svg>
                    </div>
                </div>

                {/* ─── Right: Stats Panel ─── */}
                <div className="bh-stats-panel">

                    {/* Timer */}
                    <div className="bh-card bh-timer-card">
                        <div className="bh-timer-label">Session Duration</div>
                        <div className="bh-timer-value">{formatTimer(elapsedSec)}</div>
                    </div>

                    {/* Baby Counter */}
                    <div className="bh-card bh-counter-card">
                        <span className="bh-counter-icon">👶</span>
                        <div
                            className="bh-counter-number"
                            ref={counterRef}
                        >
                            {birthCount.toLocaleString()}
                        </div>
                        <div className="bh-counter-label">Births This Session</div>

                        {/* Progress bar to next birth */}
                        <div className="bh-progress-wrap">
                            <div className="bh-progress-label">Next birth</div>
                            <div className="bh-progress-track">
                                <div className="bh-progress-bar" ref={progressRef}></div>
                            </div>
                        </div>
                    </div>

                    {/* Mini Stats Grid */}
                    <div className="bh-stats-grid">
                        <div className="bh-stat-item">
                            <div className="bh-stat-value">{ratePerMinute}</div>
                            <div className="bh-stat-label">Rate / min</div>
                        </div>
                        <div className="bh-stat-item">
                            <div className="bh-stat-value">{ratePerHour.toLocaleString()}</div>
                            <div className="bh-stat-label">Rate / hour</div>
                        </div>
                        <div className="bh-stat-item">
                            <div className="bh-stat-value">{ratePerDay}</div>
                            <div className="bh-stat-label">Rate / day</div>
                        </div>
                        <div className="bh-stat-item">
                            <div className="bh-stat-value">{intervalDisplay}</div>
                            <div className="bh-stat-label">Interval</div>
                        </div>
                    </div>

                    {/* Recent Births Feed */}
                    <div className="bh-card bh-feed-card">
                        <div className="bh-feed-title">Live Feed</div>
                        <ul className="bh-feed-list">
                            {feedItems.map((item) => (
                                <li className="bh-feed-item" key={item.id}>
                                    <span className="bh-feed-state">{item.state}</span>
                                    <span className="bh-feed-time">{timeAgo(item.time)}</span>
                                </li>
                            ))}
                            {feedItems.length === 0 && (
                                <li className="bh-feed-item" style={{ opacity: 0.4, borderLeftColor: 'var(--bh-text-muted)' }}>
                                    <span className="bh-feed-state">Waiting for first birth…</span>
                                    <span className="bh-feed-time">—</span>
                                </li>
                            )}
                        </ul>
                    </div>

                    {/* India Birth Rate Fact */}
                    <div className="bh-fact">
                        <span className="bh-fact-icon">📊</span>
                        <div className="bh-fact-text">
                            India records approximately <strong>67,000+ births every day</strong>,
                            making it roughly <strong>1 birth every 1.3 seconds</strong>.
                            With a birth rate of <strong>17.2 per 1,000</strong> population,
                            India adds about <strong>24.5 million</strong> people annually.
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
