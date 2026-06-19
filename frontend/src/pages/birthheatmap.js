import { useEffect, useRef, useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/birthheatmap.css';

const BIRTH_INTERVAL = 1280;
const BLINK_DURATION = 900;
const GEOJSON_URL = process.env.PUBLIC_URL + '/Indian_States.geojson';

/* ─── Population weights ─── */
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
        for (let i = 0; i < weight; i++) pool.push(name);
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



/* ─── Main Component ─── */
export default function BirthHeatmap() {
    const svgRef = useRef(null);
    const tooltipRef = useRef(null);

    const counterRef = useRef(null);
    const mapContainerRef = useRef(null); // FIX: ref the container for accurate sizing

    const [loading, setLoading] = useState(true);
    const [geojson, setGeojson] = useState(null);
    const [birthCount, setBirthCount] = useState(0);
    const [elapsedSec, setElapsedSec] = useState(0);

    const birthCountRef = useRef(0);
    const statePathsRef = useRef({});
    const stateBirthsRef = useRef({});
    const weightedPoolRef = useRef([]);
    const geojsonRef = useRef(null);
    const startTimeRef = useRef(Date.now());
    const d3Ref = useRef(null);
    const blinkTimeoutsRef = useRef({}); // FIX: track blink timeouts per state

    /* ─── Load D3 ─── */
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
        const containerEl = mapContainerRef.current; // FIX: use dedicated container ref
        if (!svgEl || !containerEl) return;

        const svg = d3.select(svgEl);
        svg.selectAll('*').remove();

        // FIX: use getBoundingClientRect for reliable dimensions on mobile
        const rect = containerEl.getBoundingClientRect();
        const width = rect.width || containerEl.offsetWidth || 300;
        const height = rect.height || containerEl.offsetHeight || width * 1.05;

        // Focus projection on mainland India (exclude far-flung islands from fit calculation)
        // so the map appears large and centered instead of zoomed-out to fit Andaman & Nicobar
        const mainlandBounds = {
            type: 'Feature',
            geometry: {
                type: 'Polygon',
                coordinates: [[[68, 8.2], [68, 35.8], [97.5, 35.8], [97.5, 8.2], [68, 8.2]]]
            }
        };

        const pad = Math.min(width, height) * 0.03;
        const projection = d3.geoMercator()
            .fitExtent([[pad, pad], [width - pad, height - pad]], mainlandBounds);

        svg.attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');

        const path = d3.geoPath().projection(projection);

        const paths = svg.selectAll('path')
            .data(geojson.features)
            .enter()
            .append('path')
            .attr('d', path)
            .attr('class', 'bh-state')
            .attr('data-state', (d) => d.properties.NAME_1);

        const statePathMap = {};
        paths.each(function (d) {
            statePathMap[d.properties.NAME_1] = this;
        });
        statePathsRef.current = statePathMap;

        // FIX: tooltip only on non-touch devices; use touchstart on mobile
        const isTouchDevice = window.matchMedia('(hover: none)').matches;
        const tooltipEl = tooltipRef.current;

        if (!isTouchDevice) {
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
        } else {
            // FIX: use click instead of touchstart — touchstart + preventDefault()
            // blocks the browser scroll thread over the entire map area.
            // Click fires after tap-up so it never fights scrolling.
            paths.on('click', function (event, d) {
                const name = d.properties.NAME_1;
                const births = stateBirthsRef.current[name] || 0;
                if (tooltipEl) {
                    tooltipEl.innerHTML =
                        `<div class="bh-tooltip-name">${name}</div>` +
                        `<div class="bh-tooltip-births">${births} birth${births !== 1 ? 's' : ''} this session</div>`;
                    tooltipEl.style.left = event.clientX + 14 + 'px';
                    tooltipEl.style.top = event.clientY - 40 + 'px';
                    tooltipEl.classList.add('visible');
                    setTimeout(() => tooltipEl.classList.remove('visible'), 2000);
                }
            });
        }
    }, []);

    /* ─── Birth event ─── */
    const triggerBirth = useCallback(() => {
        const pool = weightedPoolRef.current;
        if (!pool.length) return;

        const stateName = pickWeightedState(pool);
        const pathEl = statePathsRef.current[stateName];

        if (pathEl) {
            // Clear any existing blink timeout for this state before re-adding class
            if (blinkTimeoutsRef.current[stateName]) {
                clearTimeout(blinkTimeoutsRef.current[stateName]);
                pathEl.classList.remove('blink');
            }
            // Use rAF to restart animation without forced reflow (avoids layout thrash on mobile)
            requestAnimationFrame(() => {
                pathEl.classList.add('blink');
                blinkTimeoutsRef.current[stateName] = setTimeout(() => {
                    pathEl.classList.remove('blink');
                    delete blinkTimeoutsRef.current[stateName];
                }, BLINK_DURATION);
            });
        }

        birthCountRef.current += 1;
        setBirthCount(birthCountRef.current);

        stateBirthsRef.current[stateName] = (stateBirthsRef.current[stateName] || 0) + 1;

        const counterEl = counterRef.current;
        if (counterEl) {
            counterEl.classList.remove('pop');
            // Use rAF instead of forced reflow to restart pop animation
            requestAnimationFrame(() => {
                counterEl.classList.add('pop');
            });
        }
    }, []);

    /* ─── Init ─── */
    useEffect(() => {
        let birthInterval;
        let timerInterval;
        let cancelled = false;

        async function init() {
            try {
                const d3 = await loadD3();
                d3Ref.current = d3;

                const response = await fetch(GEOJSON_URL);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const geojson = await response.json();

                if (cancelled) return;

                weightedPoolRef.current = buildWeightedPool(geojson.features);
                geojsonRef.current = geojson;
                setGeojson(geojson);

                birthInterval = setInterval(triggerBirth, BIRTH_INTERVAL);

                startTimeRef.current = Date.now();
                timerInterval = setInterval(() => {
                    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
                    setElapsedSec(elapsed);
                }, 1000);



                setLoading(false);
            } catch (err) {
                console.error('BirthHeatmap init error:', err);
                setLoading(false);
            }
        }

        init();

        // FIX: debounced resize handler to avoid excessive redraws on mobile scroll/zoom
        let resizeTimer;
        function handleResize() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                const d3 = d3Ref.current;
                const geojson = geojsonRef.current;
                if (!d3 || !svgRef.current || !geojson) return;
                drawMap(d3, geojson);
            }, 150);
        }
        window.addEventListener('resize', handleResize);

        return () => {
            cancelled = true;
            clearInterval(birthInterval);
            clearInterval(timerInterval);
            clearTimeout(resizeTimer);
            // Clear all pending blink timeouts
            // Object.values(blinkTimeoutsRef.current).forEach(clearTimeout);
            window.removeEventListener('resize', handleResize);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ─── Draw map after load — FIX: use requestAnimationFrame so container has painted ─── */
    useEffect(() => {
        const d3 = d3Ref.current;
        if (!loading && geojson && d3) {
            // Wait two animation frames so the layout has fully settled on mobile
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    drawMap(d3, geojson);
                });
            });
        }
    }, [loading, geojson, drawMap]);

    /* ─── Derived stats ─── */
    // const ratePerMinute = elapsedSec > 0 ? ((birthCount / elapsedSec) * 60).toFixed(1) : '0.0';
    // const ratePerHour = elapsedSec > 0 ? Math.round((birthCount / elapsedSec) * 3600) : 0;
    // const ratePerDay = elapsedSec > 0 ? Math.round((birthCount / elapsedSec) * 86400).toLocaleString() : '0';
    // const intervalDisplay = (BIRTH_INTERVAL / 1000).toFixed(1) + 's';

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
            <nav className="bh-navbar">
                <Link to="/" className="bh-home-link" aria-label="Home">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path d="M3 11.5L12 4l9 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M9 21V12h6v9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Home
                </Link>
            </nav>

            <div className="bh-tooltip" ref={tooltipRef}></div>

            <div className="bh-layout">
                <div className="bh-map-panel">
                    <div className="bh-map-title">India Live Birth Map</div>
                    {/* <div className="bh-map-subtitle">Real-time simulated birth events across states</div> */}
                    {/* FIX: attach mapContainerRef here for accurate size measurement */}
                    <div className="bh-map-svg-container" ref={mapContainerRef}>
                        <svg ref={svgRef}></svg>
                    </div>
                </div>

                <div className="bh-stats-panel">
                    <div className="bh-card bh-timer-card">
                        <div className="bh-timer-label">Time on this page</div>
                        <div className="bh-timer-value">{formatTimer(elapsedSec)}</div>
                    </div>

                    <div className="bh-card bh-counter-card">
                        {/* <span className="bh-counter-icon">👶</span> */}
                        <div className="bh-counter-number" ref={counterRef}>
                            {birthCount.toLocaleString()}
                        </div>
                        <div className="bh-counter-label">Total Births</div>
                    </div>

                    {/* <div className="bh-stats-grid">
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
                    </div> */}



                    <div className="bh-fact">
                        {/* <span className="bh-fact-icon">📊</span> */}
                        <div className="bh-fact-text">
                            India records approximately <strong>67,000+ births every day</strong>,
                            making it roughly <strong>1 birth every 1.3 seconds</strong>.
                            With a birth rate of <strong>17.2 per 1,000</strong> population,
                            India adds about <strong>24.5 million</strong> people annually.
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}