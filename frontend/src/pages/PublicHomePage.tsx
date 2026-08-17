import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import BrandMark from '../component/BrandMark';

/**
 * Photography for the landing page. Served from Unsplash's CDN so the app
 * bundle stays small — the hero is the only one loaded eagerly, everything
 * below the fold waits until it scrolls into view.
 */
const PHOTOS = {
    hero: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=1200&q=80',
    cta: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?auto=format&fit=crop&w=1600&q=80',
    push: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=75',
    pull: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=75',
    press: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=800&q=75',
    volume:
        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=75',
};

interface Feature {
    icon: ReactNode;
    title: string;
    body: string;
}

const FEATURES: Feature[] = [
    {
        icon: <IconTrend />,
        title: 'Track everything',
        body: 'Log sets, reps, weight and timed work with a logger built for one-handed use on the gym floor.',
    },
    {
        icon: <IconChart />,
        title: 'See real progress',
        body: 'Every session rolls up into volume, streaks and per-exercise history so gains are measurable.',
    },
    {
        icon: <IconTrophy />,
        title: 'Stay motivated',
        body: 'Earn points for consistency and climb a live leaderboard against everyone else training.',
    },
    {
        icon: <IconFlame />,
        title: 'Build consistency',
        body: 'A calendar view of your training year makes missed days obvious and streaks satisfying.',
    },
    {
        icon: <IconTarget />,
        title: 'Beat your PRs',
        body: 'All-time bests are detected automatically, so you always walk in knowing the number to beat.',
    },
    {
        icon: <IconRoute />,
        title: 'Runs, mapped',
        body: 'GPS-tracked runs with pace, distance and a route map — cardio counts towards your points too.',
    },
];

const STATS = [
    { value: '12', label: 'Muscle groups' },
    { value: 'GPS', label: 'Run tracking' },
    { value: 'Auto', label: 'PR detection' },
    { value: 'Live', label: 'Leaderboard' },
];

const DISCIPLINES = [
    { src: PHOTOS.pull, label: 'Pull', caption: 'Back & biceps' },
    { src: PHOTOS.push, label: 'Push', caption: 'Chest & triceps' },
    { src: PHOTOS.press, label: 'Overhead', caption: 'Shoulders & traps' },
    { src: PHOTOS.volume, label: 'Volume', caption: 'Every set counted' },
];

/**
 * Public landing page shown to visitors who are NOT signed in.
 *
 * Anyone can view this page, but the moment they want to actually log a
 * workout they're sent to the login screen. Once authenticated, the router
 * swaps this out for the full dashboard (calendar, stats, leaderboard, …).
 */
export default function PublicHomePage() {
    return (
        <div className="page page-landing">
            <section className="landing-hero">
                <div className="landing-hero-copy">
                    <span className="landing-eyebrow">
                        <BrandMark size="sm" />
                        Train hard. Stay consistent.
                    </span>
                    <h1 className="landing-title">
                        Built for focus.
                        <br />
                        <span className="landing-title-accent">Made for results.</span>
                    </h1>
                    <p className="landing-lead">
                        Track every rep, watch your personal records climb, and compete
                        with friends on the leaderboard. Signing in takes a few seconds —
                        your first set is the hard part.
                    </p>
                    <div className="landing-cta-row">
                        <Link to="/login" className="btn btn-primary btn-lg">
                            Sign in to get started
                            <span aria-hidden="true">→</span>
                        </Link>
                        <Link to="/register" className="btn btn-ghost btn-lg">
                            Create an account
                        </Link>
                    </div>
                    <ul className="landing-stats">
                        {STATS.map((stat) => (
                            <li key={stat.label} className="landing-stat">
                                <span className="landing-stat-value">{stat.value}</span>
                                <span className="landing-stat-label">{stat.label}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="landing-hero-media">
                    <img
                        src={PHOTOS.hero}
                        alt="Athlete pulling themselves up on a bar in a dimly lit gym"
                        className="landing-hero-img"
                        loading="eager"
                        decoding="async"
                        draggable={false}
                    />
                    <div className="landing-hero-badge">
                        <span className="landing-hero-badge-value">+1 PR</span>
                        <span className="landing-hero-badge-label">Logged today</span>
                    </div>
                </div>
            </section>

            <section className="landing-section">
                <header className="landing-section-head">
                    <h2 className="landing-section-title">Why Velocity Fit?</h2>
                    <p className="muted landing-section-sub">
                        Everything you need to train smarter and stay consistent.
                    </p>
                </header>
                <div className="landing-features">
                    {FEATURES.map((feature) => (
                        <article key={feature.title} className="landing-feature">
                            <span className="landing-feature-icon" aria-hidden="true">
                                {feature.icon}
                            </span>
                            <h3 className="landing-feature-title">{feature.title}</h3>
                            <p className="muted landing-feature-body">{feature.body}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section className="landing-section">
                <header className="landing-section-head">
                    <h2 className="landing-section-title">Every session, covered</h2>
                    <p className="muted landing-section-sub">
                        Push, pull, legs, cardio — log it all in one place.
                    </p>
                </header>
                <div className="landing-gallery">
                    {DISCIPLINES.map((item) => (
                        <figure key={item.label} className="landing-shot">
                            <img
                                src={item.src}
                                alt={`${item.label} training`}
                                loading="lazy"
                                decoding="async"
                                draggable={false}
                            />
                            <figcaption className="landing-shot-caption">
                                <strong>{item.label}</strong>
                                <span>{item.caption}</span>
                            </figcaption>
                        </figure>
                    ))}
                </div>
            </section>

            <section
                className="landing-closer"
                style={{ backgroundImage: `url(${PHOTOS.cta})` }}
            >
                <div className="landing-closer-inner">
                    <h2 className="landing-closer-title">
                        Your best self
                        <br />
                        <span className="landing-title-accent">is one workout away.</span>
                    </h2>
                    <p className="landing-closer-sub">
                        Join Velocity Fit and start your streak today.
                    </p>
                    <div className="landing-cta-row">
                        <Link to="/register" className="btn btn-primary btn-lg">
                            Create an account
                            <span aria-hidden="true">→</span>
                        </Link>
                        <Link to="/login" className="btn btn-ghost btn-lg">
                            I already have one
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}

/* ---------- Inline feature icons (stroke follows currentColor) ---------- */

const ICON_PROPS = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
} as const;

function IconTrend() {
    return (
        <svg {...ICON_PROPS}>
            <path d="M3 17l6-6 4 4 8-8" />
            <path d="M15 7h6v6" />
        </svg>
    );
}

function IconChart() {
    return (
        <svg {...ICON_PROPS}>
            <path d="M4 20V10" />
            <path d="M10 20V4" />
            <path d="M16 20v-7" />
            <path d="M22 20H2" />
        </svg>
    );
}

function IconTrophy() {
    return (
        <svg {...ICON_PROPS}>
            <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" />
            <path d="M7 6H4v1a3 3 0 0 0 3 3" />
            <path d="M17 6h3v1a3 3 0 0 1-3 3" />
            <path d="M12 14v3" />
            <path d="M8 20h8" />
            <path d="M10 17h4l1 3H9l1-3z" />
        </svg>
    );
}

function IconFlame() {
    return (
        <svg {...ICON_PROPS}>
            <path d="M12 3s5 4.5 5 9a5 5 0 0 1-10 0c0-1.7.8-3.2 1.7-4.3.3 1 1 1.8 1.8 2.1C10.2 7.7 12 6 12 3z" />
        </svg>
    );
}

function IconTarget() {
    return (
        <svg {...ICON_PROPS}>
            <circle cx="12" cy="12" r="8" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="12" cy="12" r="1" />
        </svg>
    );
}

function IconRoute() {
    return (
        <svg {...ICON_PROPS}>
            <circle cx="6" cy="18" r="2.5" />
            <circle cx="18" cy="6" r="2.5" />
            <path d="M8.5 18H14a3.5 3.5 0 0 0 0-7h-4a3.5 3.5 0 0 1 0-7h5.5" />
        </svg>
    );
}