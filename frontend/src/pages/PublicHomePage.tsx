import { Link } from 'react-router-dom';
import BrandMark from '../component/BrandMark';

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
            <section className="card brand-card landing-hero">
                <div className="brand-card-head">
                    <BrandMark size="lg" />
                    <div>
                        <h1 className="brand-card-title">VELOCITY FIT</h1>
                        <p className="brand-card-tagline">TRAIN HARD. STAY CONSISTENT.</p>
                    </div>
                </div>
                <p className="landing-lead">
                    Track every gym session, watch your personal records climb, and
                    compete with friends on the leaderboard. Sign in to start logging —
                    it only takes a few seconds.
                </p>
                <div className="brand-card-cta-row">
                    <Link to="/login" className="btn btn-primary btn-lg brand-card-cta">
                        Sign in to log a workout
                    </Link>
                    <Link to="/register" className="btn btn-ghost btn-lg brand-card-cta">
                        Create an account
                    </Link>
                </div>
            </section>

            <section className="landing-features">
                <div className="card landing-feature">
                    <h2 className="landing-feature-title">Log every set</h2>
                    <p className="muted">
                        Capture weight, reps, and timed exercises with a fast, mobile-first
                        logger built for the gym floor.
                    </p>
                </div>
                <div className="card landing-feature">
                    <h2 className="landing-feature-title">Track your PRs</h2>
                    <p className="muted">
                        Your all-time bests for every exercise are tracked automatically so
                        you always know what to beat.
                    </p>
                </div>
                <div className="card landing-feature">
                    <h2 className="landing-feature-title">Climb the leaderboard</h2>
                    <p className="muted">
                        Earn points for consistency and see how you stack up against the
                        rest of the community.
                    </p>
                </div>
            </section>
        </div>
    );
}