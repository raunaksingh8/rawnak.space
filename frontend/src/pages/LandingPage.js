import { Link } from 'react-router-dom';
import '../styles/LandingPage.css';

function LandingPage() {
    return (
        <div className="landing">
            <nav className="navbar">
                <div className="logo">MyApp</div>
                <div className="nav-links">
                    <Link to="/login">Login</Link>
                    <Link to="/signup" className="btn-signup">Sign Up</Link>
                </div>
            </nav>

            <div className="hero">
                <h1>Welcome to MyApp</h1>
                <p>A simple and powerful app to manage your work efficiently.</p>
                <Link to="/signup" className="btn-get-started">Get Started</Link>
            </div>

            <div className="features">
                <div className="feature-card">
                    <h3>Fast</h3>
                    <p>Lightning fast performance for all your needs.</p>
                </div>
                <div className="feature-card">
                    <h3>Secure</h3>
                    <p>Your data is safe and encrypted at all times.</p>
                </div>
                <div className="feature-card">
                    <h3>Simple</h3>
                    <p>Easy to use interface for everyone.</p>
                </div>
            </div>
        </div>
    );
}

export default LandingPage;