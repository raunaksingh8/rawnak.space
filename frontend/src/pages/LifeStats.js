import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Progress.css';
import '../styles/lifestats.css';
import { useTrackView } from '../hooks/useTrackView';

const SECOND = 1000;
const DAY = 24 * 60 * 60 * SECOND;
const YEAR = 365.2425 * DAY;

// function formatNumber(value) {
//     return Math.floor(value).toLocaleString('en-US');
// }

function formatShortDate(date) {
    return date.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric'
    });
}

function getValidBirthDate(day, month, year) {
    const dayNumber = Number(day);
    const monthNumber = Number(month);
    const yearNumber = Number(year);

    if (!day || !month || !year) {
        return null;
    }

    const date = new Date(yearNumber, monthNumber - 1, dayNumber);
    const today = new Date();

    if (
        date.getFullYear() !== yearNumber ||
        date.getMonth() !== monthNumber - 1 ||
        date.getDate() !== dayNumber ||
        date > today ||
        yearNumber < 1900
    ) {
        return null;
    }

    return date;
}

/* ── Animated number that counts up when visible ── */
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
        <span ref={nodeRef} className="ls-number-highlight">
            {display.toLocaleString('en-US')}
        </span>
    );
}

/* ── Section wrapper with reveal animation ── */
function StatSection({ children, className = '' }) {
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
        <div
            ref={ref}
            className={`ls-stat-section ls-reveal ${visible ? 'is-visible' : ''} ${className}`}
        >
            {children}
        </div>
    );
}

/* ── Main component ── */
function LifeStats() {

    useTrackView("LifeStats");

    const [day, setDay] = useState('');
    const [month, setMonth] = useState('');
    const [year, setYear] = useState('');
    const [birthDate, setBirthDate] = useState(null);
    const [now, setNow] = useState(new Date());
    const [error, setError] = useState('');
    const [isIntroLeaving, setIsIntroLeaving] = useState(false);
    const [scrollHintVisible, setScrollHintVisible] = useState(true);
    const transitionTimer = useRef(null);

    useEffect(() => {
        return () => {
            if (transitionTimer.current) {
                clearTimeout(transitionTimer.current);
            }
        };
    }, []);

    /* hide scroll hint after first scroll */
    const handleScroll = useCallback(() => {
        if (window.scrollY > 200) {
            setScrollHintVisible(false);
        } else {
            setScrollHintVisible(true);
        }
    }, []);

    useEffect(() => {
        if (birthDate) {
            window.addEventListener('scroll', handleScroll, { passive: true });
            return () => window.removeEventListener('scroll', handleScroll);
        }
    }, [birthDate, handleScroll]);

    const life = useMemo(() => {
        if (!birthDate) {
            return null;
        }

        const elapsed = Math.max(now - birthDate, 0);
        const seconds = elapsed / SECOND;
        const days = elapsed / DAY;
        const years = elapsed / YEAR;
        const heartbeats = seconds * 1.2;
        const breaths = seconds / 4;
        const bloodLiters = heartbeats * 0.000077;
        const sunDistance = seconds * 29.78;
        const moonLoops = days / 27.3;
        const blinks = days * 28800;
        const sleepDays = days * 0.33;
        const meals = days * 3;
        const waterLiters = days * 2;
        const steps = days * 7500;
        const words = days * 16000;
        const hairCm = days * 0.035;
        const laughs = days * 15;
        const weekday = birthDate.toLocaleDateString('en-US', { weekday: 'long' });

        return {
            days,
            years,
            weekday,
            heartbeats,
            breaths,
            bloodLiters,
            sunDistance,
            moonLoops,
            earthOrbits: years,
            blinks,
            sleepDays,
            meals,
            waterLiters,
            steps,
            words,
            hairCm,
            laughs,
            birthLabel: formatShortDate(birthDate)
        };
    }, [birthDate, now]);

    const handleSubmit = (event) => {
        event.preventDefault();
        const date = getValidBirthDate(day, month, year);

        if (!date) {
            if (transitionTimer.current) {
                clearTimeout(transitionTimer.current);
            }
            setIsIntroLeaving(false);
            setBirthDate(null);
            setError('Please enter a real past date after 1900.');
            return;
        }

        setError('');
        setNow(new Date());
        setIsIntroLeaving(true);

        transitionTimer.current = setTimeout(() => {
            setBirthDate(date);
            setIsIntroLeaving(false);
            window.scrollTo(0, 0);
        }, 360);
    };

    const handleRestart = () => {
        setBirthDate(null);
        setDay('');
        setMonth('');
        setYear('');
        window.scrollTo(0, 0);
    };

    return (
        <div className="progress-page">
            <nav className={`lifestat-navbar ${life ? 'has-results' : ''}`}>
                <div className="logo" aria-hidden="true"></div>
                <Link to="/" className="progress-home" aria-label="Home">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path d="M3 11.5L12 4l9 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M9 21V12h6v9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </Link>
            </nav>

            <main className="progress-content">
                {/* ── DOB Form (untouched) ── */}
                {!life && (
                    <div className={`progress-intro ${isIntroLeaving ? 'is-leaving' : ''}`}>
                        <section className="progress-hero">
                            <span className="progress-kicker">Life stats</span>
                            <h1>How long have you been doing this whole existence thing?</h1>
                            <p>Enter your birth date and watch the universe turn your age into strange little numbers.</p>
                        </section>

                        <form className="age-form" onSubmit={handleSubmit}>
                            <label>
                                Date
                                <input
                                    type="number"
                                    min="1"
                                    max="31"
                                    placeholder="DD"
                                    value={day}
                                    onChange={(event) => setDay(event.target.value)}
                                />
                            </label>
                            <label>
                                Month
                                <input
                                    type="number"
                                    min="1"
                                    max="12"
                                    placeholder="MM"
                                    value={month}
                                    onChange={(event) => setMonth(event.target.value)}
                                />
                            </label>
                            <label>
                                Year
                                <input
                                    type="number"
                                    min="1900"
                                    placeholder="YYYY"
                                    value={year}
                                    onChange={(event) => setYear(event.target.value)}
                                />
                            </label>
                            <button type="submit" disabled={isIntroLeaving}>Let's Go</button>
                        </form>

                        {error && <p className="progress-error">{error}</p>}
                    </div>
                )}

                {/* ── Neal.fun-inspired results ── */}
                {life && (
                    <div className="ls-results">

                        {/* Scroll hint */}
                        <div className={`ls-scroll-hint ${!scrollHintVisible ? 'is-hidden' : ''}`}>
                            <span className="ls-scroll-hint-text">Scroll to explore</span>
                            <div className="ls-scroll-arrow"></div>
                        </div>

                        {/* 1 — Birthday hero */}
                        <StatSection className="ls-hero-section">
                            <div className="ls-hero-calendar">
                                <div className="ls-cal-header">{life.weekday}</div>
                                <div className="ls-cal-body">
                                    <div className="ls-cal-day">{birthDate.getDate()}</div>
                                    <div className="ls-cal-month">{life.birthLabel}</div>
                                </div>
                            </div>
                            <div className="ls-stat-number">
                                <AnimatedNumber value={life.days} />
                            </div>
                            <div className="ls-stat-title">Days alive</div>
                            <div className="ls-stat-desc">
                                A lot has happened since you entered the world. Let's see what your body has been up to.
                            </div>
                        </StatSection>

                        {/* 2 — Heartbeats */}
                        <StatSection>
                            <div className="ls-stat-number">
                                <AnimatedNumber value={life.heartbeats} />
                            </div>
                            <div className="ls-stat-title">Heartbeats</div>
                            <div className="ls-stat-desc">
                                Your heart has been beating about 100,000 times every single day — without you ever asking it to.
                            </div>
                            <div className="ls-visual ls-heart-visual">
                                <div className="ls-heart">❤️</div>
                                <svg className="ls-ecg-line" viewBox="0 0 220 50">
                                    <polyline points="0,25 30,25 40,25 50,10 60,40 70,5 80,45 90,25 120,25 150,25 160,10 170,40 180,5 190,45 200,25 220,25" />
                                </svg>
                            </div>
                        </StatSection>

                        {/* 3 — Blood pumped */}
                        <StatSection>
                            <div className="ls-stat-number">
                                <AnimatedNumber value={life.bloodLiters} />
                            </div>
                            <div className="ls-stat-title">Liters of blood pumped</div>
                            <div className="ls-stat-desc">
                                That's enough to fill several swimming pools. Your heart is basically a tireless engine.
                            </div>
                            <div className="ls-visual ls-blood-visual">
                                <div className="ls-blood-drop"></div>
                                <div className="ls-blood-ripple"></div>
                            </div>
                        </StatSection>

                        {/* 4 — Breaths */}
                        <StatSection>
                            <div className="ls-stat-number">
                                <AnimatedNumber value={life.breaths} />
                            </div>
                            <div className="ls-stat-title">Breaths taken</div>
                            <div className="ls-stat-desc">
                                In and out, about 15 times a minute. Each one keeping you going — effortlessly.
                            </div>
                            <div className="ls-visual ls-breath-visual">
                                <div className="ls-lungs">
                                    <div className="ls-lung"></div>
                                    <div className="ls-lung"></div>
                                </div>
                                <div className="ls-air-particles">
                                    <div className="ls-air-dot"></div>
                                    <div className="ls-air-dot"></div>
                                    <div className="ls-air-dot"></div>
                                    <div className="ls-air-dot"></div>
                                    <div className="ls-air-dot"></div>
                                </div>
                            </div>
                        </StatSection>

                        {/* 5 — Blinks */}
                        <StatSection>
                            <div className="ls-stat-number">
                                <AnimatedNumber value={life.blinks} />
                            </div>
                            <div className="ls-stat-title">Times you've blinked</div>
                            <div className="ls-stat-desc">
                                You blink about 20 times per minute. Each blink lasts roughly 0.3 seconds — so you've spent a fair chunk of life in the dark.
                            </div>
                            <div className="ls-visual ls-blink-visual">
                                <div className="ls-eye">
                                    <div className="ls-eye-iris"></div>
                                </div>
                            </div>
                        </StatSection>

                        {/* 6 — Sleep */}
                        <StatSection className="ls-sleep-section">
                            <div className="ls-stat-number">
                                <AnimatedNumber value={life.sleepDays} />
                            </div>
                            <div className="ls-stat-title">Days spent sleeping</div>
                            <div className="ls-stat-desc">
                                That's about a third of your entire life — spent in dreams, recovery, and peaceful silence.
                            </div>
                            <div className="ls-visual ls-sleep-visual">
                                <div className="ls-moon-sleep">
                                    <span className="ls-zzz">z</span>
                                    <span className="ls-zzz">z</span>
                                    <span className="ls-zzz">z</span>
                                    <span className="ls-zzz">z</span>
                                </div>
                            </div>
                        </StatSection>

                        {/* 7 — Food */}
                        <StatSection>
                            <div className="ls-stat-number">
                                <AnimatedNumber value={life.meals} />
                            </div>
                            <div className="ls-stat-title">Meals eaten</div>
                            <div className="ls-stat-desc">
                                Breakfast, lunch, dinner — repeat. You've nourished yourself thousands and thousands of times.
                            </div>
                            <div className="ls-visual ls-food-visual">
                                <span className="ls-food-item">🍕</span>
                                <span className="ls-food-item">🍎</span>
                                <span className="ls-food-item">🍔</span>
                                <span className="ls-food-item">🍣</span>
                                <span className="ls-food-item">🥗</span>
                                <span className="ls-food-item">🍩</span>
                            </div>
                        </StatSection>

                        {/* 8 — Water */}
                        <StatSection className="ls-water-section">
                            <div className="ls-stat-number">
                                <AnimatedNumber value={life.waterLiters} />
                            </div>
                            <div className="ls-stat-title">Liters of water consumed</div>
                            <div className="ls-stat-desc">
                                Your body is roughly 60% water. You've been topping it off every single day.
                            </div>
                            <div className="ls-visual ls-water-visual">
                                <div className="ls-water-glass">
                                    <div className="ls-water-fill"></div>
                                </div>
                                <div className="ls-water-drops">
                                    <div className="ls-water-drop"></div>
                                    <div className="ls-water-drop"></div>
                                    <div className="ls-water-drop"></div>
                                </div>
                            </div>
                        </StatSection>

                        {/* 9 — Steps */}
                        <StatSection>
                            <div className="ls-stat-number">
                                <AnimatedNumber value={life.steps} />
                            </div>
                            <div className="ls-stat-title">Steps taken</div>
                            <div className="ls-stat-desc">
                                One foot in front of the other — around 7,500 a day. You've walked the equivalent of circling the Earth multiple times.
                            </div>
                            <div className="ls-visual ls-steps-visual">
                                <span className="ls-footprint">👣</span>
                                <span className="ls-footprint">👣</span>
                                <span className="ls-footprint">👣</span>
                                <span className="ls-footprint">👣</span>
                                <span className="ls-footprint">👣</span>
                            </div>
                        </StatSection>

                        {/* 10 — Words spoken */}
                        <StatSection>
                            <div className="ls-stat-number">
                                <AnimatedNumber value={life.words} />
                            </div>
                            <div className="ls-stat-title">Words spoken</div>
                            <div className="ls-stat-desc">
                                The average person speaks about 16,000 words a day. That's novels worth of conversations, stories, and "hmm"s.
                            </div>
                            <div className="ls-visual ls-words-visual">
                                <div className="ls-speech-bubble">
                                    Namaste !
                                    <div className="ls-speech-dots">
                                        <div className="ls-speech-dot"></div>
                                        <div className="ls-speech-dot"></div>
                                        <div className="ls-speech-dot"></div>
                                    </div>
                                </div>
                            </div>
                        </StatSection>

                        {/* 11 — Hair growth */}
                        <StatSection>
                            <div className="ls-stat-number">
                                <AnimatedNumber value={life.hairCm} />
                            </div>
                            <div className="ls-stat-title">cm of hair grown</div>
                            <div className="ls-stat-desc">
                                Your hair grows about 0.35mm per day. If you never cut it, it would be impressively long by now.
                            </div>
                            <div className="ls-visual ls-hair-visual">
                                <div className="ls-hair-head">
                                    <div className="ls-hair-strand"></div>
                                    <div className="ls-hair-strand"></div>
                                    <div className="ls-hair-strand"></div>
                                    <div className="ls-hair-strand"></div>
                                    <div className="ls-hair-strand"></div>
                                </div>
                            </div>
                        </StatSection>

                        {/* 12 — Laughter */}
                        <StatSection className="ls-laugh-section">
                            <div className="ls-stat-number">
                                <AnimatedNumber value={life.laughs} />
                            </div>
                            <div className="ls-stat-title">Times you've laughed</div>
                            <div className="ls-stat-desc">
                                The average adult laughs about 15 times a day. That's a lot of joy you've spread around.
                            </div>
                            <div className="ls-visual ls-laugh-visual">
                                <div className="ls-smiley">
                                    <div className="ls-smiley-eye"></div>
                                    <div className="ls-smiley-eye"></div>
                                    <div className="ls-smiley-mouth"></div>
                                </div>
                                <div className="ls-ha-particles">
                                    <span className="ls-ha">ha</span>
                                    <span className="ls-ha">ha</span>
                                    <span className="ls-ha">ha</span>
                                    <span className="ls-ha">ha</span>
                                </div>
                            </div>
                        </StatSection>

                        {/* 13 — Sun distance */}
                        <StatSection className="ls-space-section">
                            <div className="ls-stat-number">
                                <AnimatedNumber value={life.sunDistance} />
                            </div>
                            <div className="ls-stat-title">km traveled around the Sun</div>
                            <div className="ls-stat-desc">
                                Earth moves at 29.78 km/s. You've been hurtling through space your entire life — even while sitting still.
                            </div>
                            <div className="ls-visual ls-orbit-visual">
                                <div className="ls-orbit-ring">
                                    <div className="ls-orbit-sun"></div>
                                    <div className="ls-orbit-earth"></div>
                                </div>
                            </div>
                        </StatSection>

                        {/* 14 — Earth rotations */}
                        <StatSection className="ls-space-section">
                            <div className="ls-stat-number">
                                <AnimatedNumber value={life.days} />
                            </div>
                            <div className="ls-stat-title">Earth rotations</div>
                            <div className="ls-stat-desc">
                                Every single day the entire planet spins once. You've completed {life.earthOrbits.toFixed(2)} full trips around the Sun.
                            </div>
                            <div className="ls-visual ls-earth-visual">
                                <div className="ls-earth-globe"></div>
                                <div className="ls-earth-atmosphere"></div>
                            </div>
                        </StatSection>

                        {/* 15 — Moon loops */}
                        <StatSection className="ls-space-section">
                            <div className="ls-stat-number">
                                <AnimatedNumber value={life.moonLoops} />
                            </div>
                            <div className="ls-stat-title">Moon orbits</div>
                            <div className="ls-stat-desc">
                                The Moon loops around Earth every 27.3 days. It's been your silent companion through all of them.
                            </div>
                            <div className="ls-visual ls-moon-visual">
                                <div className="ls-moon-orbit-ring">
                                    <div className="ls-moon-earth-center"></div>
                                    <div className="ls-moon-body"></div>
                                </div>
                            </div>
                        </StatSection>

                        {/* Final section */}
                        <StatSection className="ls-final-section">
                            <div className="ls-final-emoji">✨</div>
                            <div className="ls-final-message">
                                And this is just the beginning.
                            </div>
                            <div className="ls-final-sub">
                                Every second adds to your story.
                            </div>
                            <button className="ls-restart-btn" onClick={handleRestart}>
                                Try another date
                            </button>
                        </StatSection>

                    </div>
                )}
            </main>
        </div>
    );
}

export default LifeStats;
