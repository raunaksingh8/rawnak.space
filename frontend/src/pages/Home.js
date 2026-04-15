import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import '../styles/Home.css';

function Home() {
    const user = JSON.parse(localStorage.getItem('user'));
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        toast.info("Logout Successfull !")
        navigate('/login');
    };

    return (
        <div className="home-container">
            <div className="home-card">
                <h1>Welcome, {user?.name}!</h1>
                <p>You are logged in as <strong>{user?.email}</strong></p>
                <button onClick={handleLogout}>Logout</button>
            </div>
        </div>
    );
}

export default Home;