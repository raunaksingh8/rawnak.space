import { Link } from 'react-router-dom';
import '../styles/LandingPage.css';

function LandingPage() {
    return (
        <div className="landing">
            <nav className="navbar">
                <div className="logo">MyApp</div>
                <div className="nav-links">
                    <Link to="/login" className="btn-signup">Login</Link>
                    <Link to="/signup" className="btn-signup">Sign Up</Link>
                </div>
            </nav>

            <div className="hero">
                <h1>Welcome to MyApp</h1>
                <p>A simple and powerful app to manage your work efficiently.</p>
                <Link to="/signup" className="btn-get-started">Get Started</Link>
            </div>
        </div>
    );
}

export default LandingPage;