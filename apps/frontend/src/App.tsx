import './App.css'

import {BrowserRouter} from 'react-router-dom';
import Navbar from './components/Navbar';

function App() {
    // Your application must be wrapped with the BrowserRouter component to enable routing
    return (
        <BrowserRouter>
            <Navbar />
        </BrowserRouter>
    )
}

export default App
