import { Link } from 'react-router-dom';
import '../styles/CardPage.css';

function CardPage({ title, subtitle }) {
    return (
        <div className="card-page">
            <nav className="card-page-navbar">
                <div className="logo" aria-hidden="true"></div>
                <Link to="/" className="card-page-back" aria-label="Home">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path d="M3 11.5L12 4l9 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M9 21V12h6v9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </Link>
            </nav>

            <main className="card-page-content">
                <section className="card-page-header">
                    <div>
                        <h1>{title}</h1>
                        <p>{subtitle}</p>
                    </div>
                </section>

            </main>
        </div>
    );
}

export default CardPage;
