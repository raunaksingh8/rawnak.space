import { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import '../styles/sincewhen.css';

/* ───── helpers ───── */

function getElapsed(timestamp) {
    const start = new Date(timestamp);
    const now = new Date();
    if (now < start) return { yrs: 0, mos: 0, days: 0, hrs: 0, min: 0, sec: 0 };

    let yrs = now.getFullYear() - start.getFullYear();
    let mos = now.getMonth() - start.getMonth();
    let days = now.getDate() - start.getDate();
    let hrs = now.getHours() - start.getHours();
    let min = now.getMinutes() - start.getMinutes();
    let sec = now.getSeconds() - start.getSeconds();

    if (sec < 0) { sec += 60; min -= 1; }
    if (min < 0) { min += 60; hrs -= 1; }
    if (hrs < 0) { hrs += 24; days -= 1; }
    if (days < 0) {
        const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        days += prevMonth.getDate();
        mos -= 1;
    }
    if (mos < 0) { mos += 12; yrs -= 1; }

    return { yrs, mos, days, hrs, min, sec };
}

function pad(n, width) {
    return String(n).padStart(width, '0');
}

function formatDate(ts) {
    return new Date(ts).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

function randomDigitStr(width) {
    let s = '';
    for (let i = 0; i < width; i++) {
        s += Math.floor(Math.random() * 10);
    }
    return s;
}

/* ───── SlotDigit — a single digit group with spin animation ───── */

function SlotDigit({ value, width, label, delay, accentColor }) {
    const [display, setDisplay] = useState(randomDigitStr(width));
    const [phase, setPhase] = useState('spinning'); // spinning | locked
    const intervalRef = useRef(null);

    useEffect(() => {
        // Start spinning with random digits
        intervalRef.current = setInterval(() => {
            setDisplay(randomDigitStr(width));
        }, 60);

        // After delay, lock in to the real value
        const lockTimer = setTimeout(() => {
            clearInterval(intervalRef.current);
            setDisplay(pad(value, width));
            setPhase('locked');
        }, delay);

        return () => {
            clearInterval(intervalRef.current);
            clearTimeout(lockTimer);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run on mount for the initial spin animation

    // After lock, keep updating with the live value
    useEffect(() => {
        if (phase === 'locked') {
            setDisplay(pad(value, width));
        }
    }, [value, width, phase]);

    return (
        <div className="sincewhen-digit-group">
            <div className="sincewhen-digit-box">
                <span
                    className={`sincewhen-digit-value ${phase === 'spinning' ? 'spinning' : 'locked'}`}
                    style={{ color: accentColor }}
                >
                    {display}
                </span>
            </div>
            <span className="sincewhen-digit-label">{label}</span>
        </div>
    );
}

/* ───── EventCard — one event with timer ───── */

function EventCard({ event, index }) {
    const [elapsed, setElapsed] = useState(() => getElapsed(event.timestamp));

    useEffect(() => {
        const interval = setInterval(() => {
            setElapsed(getElapsed(event.timestamp));
        }, 1000);
        return () => clearInterval(interval);
    }, [event.timestamp]);

    const accent = event.color || '#f97316';

    // Stagger lock-in: yrs first, then mos, days, hrs, min, sec
    const baseDelay = 600 + index * 150;

    return (
        <div
            className="sincewhen-card"
            style={{ '--card-accent': accent, animationDelay: `${index * 0.07}s` }}
        >
            <div className="sincewhen-card-header">
                <span className="sincewhen-card-icon"></span>
                <div>
                    <div className="sincewhen-card-title">{event.title}</div>
                    {event.subtitle && (
                        <div className="sincewhen-card-subtitle">{event.subtitle}</div>
                    )}
                </div>
            </div>

            <div className="sincewhen-timer">
                <SlotDigit value={elapsed.yrs} width={Math.max(2, String(elapsed.yrs).length)} label="Yrs" delay={baseDelay} accentColor={accent} />
                <span className="sincewhen-separator">:</span>
                <SlotDigit value={elapsed.mos} width={Math.max(2, String(elapsed.mos).length)} label="Mos" delay={baseDelay + 200} accentColor={accent} />
                <span className="sincewhen-separator">:</span>
                <SlotDigit value={elapsed.days} width={Math.max(2, String(elapsed.days).length)} label="Days" delay={baseDelay + 400} accentColor={accent} />
                <span className="sincewhen-separator">:</span>
                <SlotDigit value={elapsed.hrs} width={Math.max(2, String(elapsed.hrs).length)} label="Hrs" delay={baseDelay + 600} accentColor={accent} />
                <span className="sincewhen-separator">:</span>
                <SlotDigit value={elapsed.min} width={Math.max(2, String(elapsed.min).length)} label="Min" delay={baseDelay + 800} accentColor={accent} />
                <span className="sincewhen-separator">:</span>
                <SlotDigit value={elapsed.sec} width={Math.max(2, String(elapsed.sec).length)} label="Sec" delay={baseDelay + 1000} accentColor={accent} />
            </div>

            <div className="sincewhen-card-date">
                Last on - {formatDate(event.timestamp)}
            </div>
        </div>
    );
}

/* ───── Main Page ───── */

function SinceWhen() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchEvents = useCallback(async () => {
        try {
            const { data, error: sbError } = await supabase
                .from('since_when')
                .select('*')
                .order('timestamp', { ascending: true });

            if (sbError) throw sbError;
            setEvents(data || []);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch since_when events:', err);
            setError('Failed to load events.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEvents();

        // Poll every 30 seconds for fresh data
        const poll = setInterval(fetchEvents, 30000);
        return () => clearInterval(poll);
    }, [fetchEvents]);

    return (
        <div className="sincewhen-page">
            <nav className="sincewhen-navbar">
                <div className="logo" aria-hidden="true"></div>
                <Link to="/" className="sincewhen-home" aria-label="Home">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path d="M3 11.5L12 4l9 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M9 21V12h6v9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </Link>
            </nav>

            <section className="sincewhen-hero">
                <span className="sincewhen-kicker">Since When</span>
                <h1>How Long Has It Been?</h1>
                <p>Tracking the time since notable events happened.</p>
            </section>

            {loading && (
                <div className="sincewhen-loading">
                    <div className="sincewhen-loading-spinner"></div>
                    Loading events…
                </div>
            )}

            {error && <div className="sincewhen-error">{error}</div>}

            {!loading && !error && (
                <div className="sincewhen-grid">
                    {events.map((event, index) => (
                        <EventCard key={event.id} event={event} index={index} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default SinceWhen;
