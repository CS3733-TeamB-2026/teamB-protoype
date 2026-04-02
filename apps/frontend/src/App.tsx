import './App.css'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import {BrowserRouter} from 'react-router-dom';

function App() {
    // Your application must be wrapped with the BrowserRouter component to enable routing
    return (
        <BrowserRouter>
            <div className="min-h-screen flex flex-col">
                {/*Home page gets automatically loaded when Navbar is initialized, we might want to change this*/}
                <Navbar />
                <Footer />
            </div>
        </BrowserRouter>
    )
}
export default App
