import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import '../styles/howmanytoday.css';
import { useTrackView } from '../hooks/useTrackView';

const API_URL = process.env.REACT_APP_API_URL;

/* ─── Slug → frontend metadata map ─── */
const STAT_META = {
    tea_coffee: {
        emoji: '☕',
        label: 'Cups of Chai & Coffee',
        description: 'India runs on chai. From the cutting chai at the tapri to the filter coffee in the south — the country guzzles over a billion cups every single day.',
        bg: '#1B4332',
    },
    waste: {
        emoji: '🗑️',
        label: 'Tonnes of Waste Generated',
        description: 'That\'s a mountain of garbage rising every day. Most of it ends up in landfills taller than your apartment building. Sort karo, yaar.',
        bg: '#5C4033',
    },
    water: {
        emoji: '💧',
        label: 'Litres of Water Used',
        description: 'From morning showers to farm irrigation — India drinks, bathes, washes, and waters its way through an absolutely insane amount of H₂O daily.',
        bg: '#0E4D64',
    },
    internet: {
        emoji: '📱',
        label: 'GB of Mobile Data Used',
        description: 'Jio changed the game. India now consumes more mobile data per capita than almost any country on Earth. Reels, memes, and "good morning" messages never stop.',
        bg: '#2D1B69',
    },
    golgappa: {
        emoji: '🤤',
        label: 'Golgappas Eaten',
        description: 'Pani puri, golgappa, puchka — call it what you want, India inhales millions of these crispy, tangy, spicy little bombs of joy every single day.',
        bg: '#8B2252',
    },
    trees: {
        emoji: '🌳',
        label: 'Trees Cut Down',
        description: 'Despite massive plantation drives, deforestation keeps pace. Every tree lost is a story of development vs. nature — India\'s oldest dilemma.',
        bg: '#2F4F2F',
    },
    petrol: {
        emoji: '⛽',
        label: 'Litres of Petrol Burned',
        description: 'India\'s roads never sleep. Autos, bikes, trucks, and that one uncle\'s ancient Maruti 800 — all guzzling fuel like there\'s no tomorrow. Literally.',
        bg: '#4A1A2E',
    },
    flights: {
        emoji: '✈️',
        label: 'Domestic Flights',
        description: 'From Delhi to Mumbai to "just going to Goa for the weekend" — thousands of planes criss-cross Indian skies every day. Sky\'s literally the limit.',
        bg: '#1A3A5C',
    },
    cold_drink: {
        emoji: '🥤',
        label: 'Cold Drinks Consumed',
        description: 'Thums Up, Limca, Maaza, Frooti — India\'s love affair with cold drinks is hotter than the summer that demands them. Thanda matlab… a LOT.',
        bg: '#6B1D1D',
    },
};

/* ═══════════════════════════════════════════════════════
   AnimatedNumber — counts up from 0 when visible
   Uses IntersectionObserver with cubic ease-out
   (matches LifeStats page pattern)
   ═══════════════════════════════════════════════════════ */
function AnimatedNumber({ value, duration = 2000 }) {
    const [display, setDisplay] = useState(0);
    const rafRef = useRef(null);
    const startRef = useRef(null);
    const hasAnimated = useRef(false);
    const nodeRef = useRef(null);

    useEffect(() => {
        if (hasAnimated.current) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasAnimated.current) {
                    hasAnimated.current = true;
                    startRef.current = performance.now();
                    const target = Math.floor(value);

                    const animate = (now) => {
                        const elapsed = now - startRef.current;
                        const progress = Math.min(elapsed / duration, 1);
                        /* cubic ease-out: 1 - (1 - t)^3 */
                        const eased = 1 - Math.pow(1 - progress, 3);
                        setDisplay(Math.floor(eased * target));
                        if (progress < 1) {
                            rafRef.current = requestAnimationFrame(animate);
                        }
                    };

                    rafRef.current = requestAnimationFrame(animate);
                    observer.disconnect();
                }
            },
            { threshold: 0.3 }
        );

        if (nodeRef.current) observer.observe(nodeRef.current);

        return () => {
            observer.disconnect();
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [value, duration]);

    return (
        <span ref={nodeRef}>
            {display.toLocaleString('en-IN')}
        </span>
    );
}

/* ═══════════════════════════════════════════════════════
   StatSection — full-screen section with scroll reveal
   ═══════════════════════════════════════════════════════ */
function StatSection({ stat, meta }) {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                }
            },
            { threshold: 0.15 }
        );

        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    return (
        <section
            className="hmt-section"
            style={{ background: meta.bg }}
            id={`hmt-${stat.slug}`}
        >
            <div
                ref={ref}
                className={`hmt-section-inner ${visible ? 'is-visible' : ''}`}
            >
                {/* Emoji */}
                <div className="hmt-emoji" aria-hidden="true">{meta.emoji}</div>

                {/* Number block: outline + solid */}
                <div className="hmt-number-block">
                    <div className="hmt-number-outline" aria-hidden="true">
                        <AnimatedNumber value={stat.value} duration={2200} />
                    </div>
                    <div className="hmt-number-solid">
                        <AnimatedNumber value={stat.value} duration={2200} />
                    </div>
                </div>

                {/* Label */}
                <div className="hmt-label">{meta.label}</div>

                {/* Description */}
                <p className="hmt-description">{meta.description}</p>

                {/* Unit badge */}
                <div className="hmt-unit-badge">{stat.unit}</div>
            </div>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════
   HowManyToday — Main page component
   ═══════════════════════════════════════════════════════ */
function HowManyToday() {

    useTrackView("HowManyToday");

    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchStats = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_URL}/api/howmanytoday`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setStats(data.data || []);
        } catch (err) {
            console.error('Failed to fetch howmanytoday:', err);
            setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    /* ── Loading ── */
    if (loading) {
        return (
            <div className="hmt-page">
                <div className="hmt-loader">
                    <div className="hmt-loader-spinner" />
                    <div className="hmt-loader-text">Loading India's daily numbers…</div>
                    <div className="hmt-loader-bar">
                        <div className="hmt-loader-bar-fill" />
                    </div>
                </div>
            </div>
        );
    }

    /* ── Error ── */
    if (error) {
        return (
            <div className="hmt-page">
                <div className="hmt-error">
                    <div className="hmt-error-emoji">😵</div>
                    <div className="hmt-error-title">Oops, something broke!</div>
                    <div className="hmt-error-desc">
                        We couldn't fetch India's stats right now. The servers might be taking a chai break. Give it another shot?
                    </div>
                    <button className="hmt-retry-btn" onClick={fetchStats}>
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="hmt-page">
            {/* ── Transparent Navbar ── */}
            <nav className="hmt-navbar">
                <Link to="/" className="hmt-home-link" aria-label="Home">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path d="M3 11.5L12 4l9 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M9 21V12h6v9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </Link>
            </nav>

            {/* ── Hero section ── */}
            <div className="hmt-hero">
                <div className="hmt-hero-flag" aria-hidden="true">
                    <div className="hmt-flag-bar" />
                    <div className="hmt-flag-bar" />
                    <div className="hmt-flag-bar" />
                </div>
                <h1 className="hmt-hero-title">How Many Today?</h1>
                <p className="hmt-hero-subtitle">
                    India in numbers — the wild, the wonderful, and the slightly unhinged daily stats of 1.4 billion people.
                </p>
                <div className="hmt-hero-scroll">
                    <span className="hmt-hero-scroll-text">Scroll to explore</span>
                    <div className="hmt-hero-scroll-arrow" />
                </div>
            </div>

            {/* ── Stat sections ── */}
            {stats.map((stat) => {
                const meta = STAT_META[stat.slug];
                if (!meta) return null;
                return <StatSection key={stat.slug} stat={stat} meta={meta} />;
            })}

            {/* ── Footer ── */}
            <footer className="hmt-footer">
                <p className="hmt-footer-text">
                    Made with data & desi vibes
                    <span className="hmt-footer-flag" aria-hidden="true">
                        <span className="hmt-footer-flag-bar" />
                        <span className="hmt-footer-flag-bar" />
                        <span className="hmt-footer-flag-bar" />
                    </span>
                </p>
            </footer>
        </div>
    );
}

export default HowManyToday;
