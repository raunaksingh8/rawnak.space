import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import '../styles/Login.css';
import {VscEye,VscEyeClosed} from "react-icons/vsc";
import Loader from "../components/Loader"

function Login({setToken}) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error] = useState('');
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    console.log(loading);
    console.log("API URL:", process.env.REACT_APP_API_URL);

    const handleLogin = async () => {
        setLoading(true);
        try {
            const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/login`, {
                email,
                password
            });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            setToken(res.data.token);
            toast.success("Login Successfull !")
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response.data.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <h2>Login</h2>
            {error && <p className="error">{error}</p>}
            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
            />
            <div className="password-wrapper">
                <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                />

                <span className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <VscEyeClosed /> : <VscEye />}
                </span>
            </div>
            <button onClick={handleLogin} disabled={loading}>Login
            </button>
            {loading && <Loader />}
            <p>
                Don't have an account? <Link to="/signup">Sign up</Link>
            </p>
        </div>
    );
}

export default Login;