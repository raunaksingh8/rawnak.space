import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { useState } from "react";
import 'react-toastify/dist/ReactToastify.css';
import { Analytics } from '@vercel/analytics/react';

import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import LandingPage from './pages/LandingPage';

function App() {

    const [token, setToken] = useState(localStorage.getItem("token"));

    return (
        <BrowserRouter>
            <ToastContainer position="top-right" autoClose={2000} />

            <Routes>

                <Route
                    path="/"
                    element={
                        token
                            ? <Navigate to="/dashboard" />
                            : <LandingPage />
                    }
                />
                <Route
                    path="/login"
                    element={
                        token
                            ? <Navigate to="/dashboard" />
                            : <Login setToken={setToken} />
                    }
                />
                <Route
                    path="/signup"
                    element={
                        token
                            ? <Navigate to="/dashboard" />
                            : <Signup />
                    }
                />
                <Route
                    path='/dashboard'
                    element={
                        token
                            ? <Dashboard setToken={setToken}/>
                            : <Navigate to="/" />
                    }
                />
                <Route
                    path="*"
                    element={
                        token
                            ? <Navigate to="/dashboard" />
                            : <Navigate to="/" />
                    }
                />
            </Routes>
            <Analytics/>
        </BrowserRouter>
    );
}

export default App;