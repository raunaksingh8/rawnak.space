import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import '../styles/Dashboard.css';

function Dashboard({setToken}) {
    const user = JSON.parse(localStorage.getItem('user'));
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        toast.success("Logged out successfully!");
        navigate('/');
    };

    return (
        <div className="dashboard">
            <nav className="dash-navbar">
                <div className="logo" aria-hidden="true"></div>
                <div className="dash-nav-right">
                    <span>Hello, {user?.name}</span>
                    <button onClick={handleLogout}>Logout</button>
                </div>
            </nav>

            <div className="dash-content">
                <h1>Welcome back, {user?.name}!!</h1>
                <p>You are logged in as {user?.email}</p>

                <div className="dash-cards">
                    <div className="dash-card">
                        <h3>Profile</h3>
                        <p>View and edit your profile</p>
                    </div>
                    <div className="dash-card">
                        <h3>Settings</h3>
                        <p>Manage your preferences</p>
                    </div>
                    <div className="dash-card">
                        <h3>Activity</h3>
                        <p>See your recent activity</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
