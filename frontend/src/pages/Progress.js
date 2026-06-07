import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Progress.css';

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function formatTimeLeft(duration) {
    const seconds = Math.floor(duration / SECOND);
    if (seconds < 60) {
        return `${seconds} seconds left`;
    }

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
        return `${minutes} minutes left`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
        return `${hours} hours left`;
    }

    const days = Math.floor(hours / 24);
    return `${days} days left`;
}

function getNextDate(year, month, day) {
    const next = new Date(year, month, day, 0, 0, 0, 0);
    return next;
}

function getNextHoliday(now, month, day) {
    const currentYear = now.getFullYear();
    let next = getNextDate(currentYear, month, day);
    if (next <= now) {
        next = getNextDate(currentYear + 1, month, day);
    }
    return next;
}

function getNextNthWeekday(now, month, weekday, n) {
    const year = now.getFullYear();
    let date = new Date(year, month, 1, 0, 0, 0, 0);
    const firstWeekday = date.getDay();
    const offset = (weekday - firstWeekday + 7) % 7;
    date.setDate(1 + offset + 7 * (n - 1));

    if (date <= now) {
        date = new Date(year + 1, month, 1, 0, 0, 0, 0);
        const nextFirstWeekday = date.getDay();
        const nextOffset = (weekday - nextFirstWeekday + 7) % 7;
        date.setDate(1 + nextOffset + 7 * (n - 1));
    }

    return date;
}

function getNextWeekday(now, month, weekday, n) {
    return getNextNthWeekday(now, month, weekday, n);
}

function calculateEaster(year) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day, 0, 0, 0, 0);
}

function getNextEaster(now) {
    const year = now.getFullYear();
    let next = calculateEaster(year);
    if (next <= now) {
        next = calculateEaster(year + 1);
    }
    return next;
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function getBarWidth(remaining, total) {
    if (total <= 0) {
        return '0%';
    }

    const percent = 100 - (remaining / total) * 100;
    return `${clamp(percent, 0, 100)}%`;
}

function getMoonPhaseTargets(now) {
    const knownNewMoon = new Date(Date.UTC(2023, 0, 21, 20, 53));
    const cycle = 29.530588853 * DAY;
    const age = ((now.getTime() - knownNewMoon.getTime()) % cycle + cycle) % cycle;

    const phases = [
        { emoji: '🌑', label: 'Next New Moon', ageDays: 0 },
        { emoji: '🌒', label: 'Next Waxing Crescent', ageDays: 3.7 },
        { emoji: '🌓', label: 'Next Quarter Moon', ageDays: 7.4 },
        { emoji: '🌔', label: 'Next Waxing Gibbous', ageDays: 11.1 },
        { emoji: '🌕', label: 'Next Full Moon', ageDays: 14.8 },
        { emoji: '🌖', label: 'Next Waning Gibbous', ageDays: 18.5 },
        { emoji: '🌗', label: 'Next Last Quarter Moon', ageDays: 22.1 },
        { emoji: '🌘', label: 'Next Waning Crescent', ageDays: 25.8 }
    ];

    return phases.map((phase, index) => {
        const targetAge = phase.ageDays * DAY;
        const offset = (targetAge - age + cycle) % cycle;
        return {
            key: `moon-${index}`,
            emoji: phase.emoji,
            label: phase.label,
            value: formatTimeLeft(offset),
            barWidth: getBarWidth(offset, cycle)
        };
    });
}

function Progress() {
    const [now, setNow] = useState(new Date());
    const [pagePixelsLeft, setPagePixelsLeft] = useState(0);

    useEffect(() => {
        const interval = window.setInterval(() => {
            setNow(new Date());
        }, SECOND);

        return () => window.clearInterval(interval);
    }, []);

    useEffect(() => {
        const updatePagePixels = () => {
            const html = document.documentElement;
            const remaining = Math.max(0, Math.round(html.scrollHeight - html.scrollTop - window.innerHeight));
            setPagePixelsLeft(remaining);
        };

        updatePagePixels();
        window.addEventListener('scroll', updatePagePixels);
        window.addEventListener('resize', updatePagePixels);

        return () => {
            window.removeEventListener('scroll', updatePagePixels);
            window.removeEventListener('resize', updatePagePixels);
        };
    }, []);

    const items = useMemo(() => {
        const nextMinute = new Date(now);
        nextMinute.setSeconds(0, 0);
        nextMinute.setMinutes(nextMinute.getMinutes() + 1);

        const nextHour = new Date(now);
        nextHour.setMinutes(0, 0, 0);
        nextHour.setHours(nextHour.getHours() + 1);

        const nextDay = new Date(now);
        nextDay.setHours(24, 0, 0, 0);

        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
        const nextYear = new Date(now.getFullYear() + 1, 0, 1, 0, 0, 0, 0);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        const startOfYear = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);

        const nextValentine = getNextHoliday(now, 1, 14);
        const nextStPatricks = getNextHoliday(now, 2, 17);
        const nextEaster = getNextEaster(now);
        const nextMother = getNextWeekday(now, 4, 0, 2);
        const nextFather = getNextWeekday(now, 5, 0, 3);
        const nextHalloween = getNextHoliday(now, 9, 31);
        const nextThanksgiving = getNextWeekday(now, 10, 4, 4);
        const nextChristmas = getNextHoliday(now, 11, 25);

        const nextDecadeYear = Math.floor(now.getFullYear() / 10) * 10 + 10;
        const nextDecade = new Date(nextDecadeYear, 0, 1, 0, 0, 0, 0);

        const nextCenturyYear = Math.floor(now.getFullYear() / 100) * 100 + 100;
        const nextCentury = new Date(nextCenturyYear, 0, 1, 0, 0, 0, 0);

        const nextMillenniumYear = Math.floor(now.getFullYear() / 1000) * 1000 + 1000;
        const nextMillennium = new Date(nextMillenniumYear, 0, 1, 0, 0, 0, 0);

        const itemsList = [
            { key: 'minute', emoji: '🕑', label: 'Next minute', value: formatTimeLeft(nextMinute - now), barWidth: getBarWidth(nextMinute - now, MINUTE) },
            { key: 'hour', emoji: '🕑', label: 'Next hour', value: formatTimeLeft(nextHour - now), barWidth: getBarWidth(nextHour - now, HOUR) },
            { key: 'day', emoji: '🌅', label: 'Next day', value: formatTimeLeft(nextDay - now), barWidth: getBarWidth(nextDay - now, DAY) },
            { key: 'month', emoji: '📅', label: 'Next month', value: formatTimeLeft(nextMonth - now), barWidth: getBarWidth(nextMonth - now, nextMonth - startOfMonth) },
            { key: 'year', emoji: '🎆', label: 'Next year', value: formatTimeLeft(nextYear - now), barWidth: getBarWidth(nextYear - now, nextYear - startOfYear) },
            { key: 'valentine', emoji: '💑', label: "Next Valentine's Day", value: formatTimeLeft(nextValentine - now), barWidth: getBarWidth(nextValentine - now, nextYear - startOfYear) },
            { key: 'saint-patrick', emoji: '🍀', label: 'Next Saint Patrick\'s Day', value: formatTimeLeft(nextStPatricks - now), barWidth: getBarWidth(nextStPatricks - now, nextYear - startOfYear) },
            { key: 'easter', emoji: '🐇', label: 'Next Easter', value: formatTimeLeft(nextEaster - now), barWidth: getBarWidth(nextEaster - now, nextYear - startOfYear) },
            { key: 'mothers-day', emoji: '👩', label: 'Next Mother\'s Day', value: formatTimeLeft(nextMother - now), barWidth: getBarWidth(nextMother - now, nextYear - startOfYear) },
            { key: 'fathers-day', emoji: '👨', label: 'Next Father\'s Day', value: formatTimeLeft(nextFather - now), barWidth: getBarWidth(nextFather - now, nextYear - startOfYear) },
            { key: 'halloween', emoji: '👻', label: 'Next Halloween', value: formatTimeLeft(nextHalloween - now), barWidth: getBarWidth(nextHalloween - now, nextYear - startOfYear) },
            { key: 'thanksgiving', emoji: '🦃', label: 'Next Thanksgiving', value: formatTimeLeft(nextThanksgiving - now), barWidth: getBarWidth(nextThanksgiving - now, nextYear - startOfYear) },
            { key: 'christmas', emoji: '🎅', label: 'Next Christmas', value: formatTimeLeft(nextChristmas - now), barWidth: getBarWidth(nextChristmas - now, nextYear - startOfYear) },
            { key: 'page-end', emoji: '💻', label: 'End of this page', value: `${pagePixelsLeft.toLocaleString()} pixels left`, barWidth: getBarWidth(pagePixelsLeft, Math.max(pagePixelsLeft, 6000)) }
        ]; 

        return [...itemsList, ...getMoonPhaseTargets(now),
            { key: 'decade', emoji: '📅', label: 'Next decade', value: formatTimeLeft(nextDecade - now), barWidth: getBarWidth(nextDecade - now, nextDecade - new Date(Math.floor(now.getFullYear() / 10) * 10, 0, 1, 0, 0, 0, 0)) },
            { key: 'century', emoji: '📅', label: 'Next century', value: formatTimeLeft(nextCentury - now), barWidth: getBarWidth(nextCentury - now, nextCentury - new Date(Math.floor(now.getFullYear() / 100) * 100, 0, 1, 0, 0, 0, 0)) },
            { key: 'millennium', emoji: '📅', label: 'Next millennium', value: formatTimeLeft(nextMillennium - now), barWidth: getBarWidth(nextMillennium - now, nextMillennium - new Date(Math.floor(now.getFullYear() / 1000) * 1000, 0, 1, 0, 0, 0, 0)) }
        ];
    }, [now, pagePixelsLeft]);

    return (
        <div className="progress-page">
            <nav className="progress-navbar">
                <div className="logo" aria-hidden="true"></div>
                <Link to="/" className="progress-home" aria-label="Home">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path d="M3 11.5L12 4l9 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M9 21V12h6v9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </Link>
            </nav>

            <main className="progress-content">
                <section className="progress-list-hero">
                    <h1>Progress</h1>
                </section>

                <section className="progress-list">
                    {items.map((item) => (
                        <div key={item.key} className="progress-item">
                            <div className="progress-item-emoji" aria-hidden="true">{item.emoji}</div>
                            <div className="progress-item-copy">
                                <div className="progress-item-label">{item.label}</div>
                                <div className="progress-item-value">{item.value}</div>
                                <div className="progress-item-bar" aria-hidden="true">
                                    <div className="progress-item-bar-fill" style={{ width: item.barWidth }} />
                                </div>
                            </div>
                        </div>
                    ))}
                </section>
            </main>
        </div>
    );
}

export default Progress;
