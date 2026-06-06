import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { useState } from "react";
import 'react-toastify/dist/ReactToastify.css';
import { Analytics } from '@vercel/analytics/react';

import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import LandingPage from './pages/LandingPage';
import Progress from './pages/Progress';
import LifeStats from './pages/LifeStats';
import DowryCal from './pages/DowryCal';
import FcBarcelona from './pages/FcBarcelona';
import MoneySpent from './pages/MoneySpent';
import Share from './pages/Share';

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
                <Route path="/progress" element={<Progress />} />
                <Route path="/lifestats" element={<LifeStats />} />
                <Route path="/dowrycal" element={<DowryCal />} />
                <Route path="/fcbarcelona" element={<FcBarcelona />} />
                <Route path="/moneyspent" element={<MoneySpent />} />
                <Route path="/share" element={<Share />} />
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
