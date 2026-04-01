import './App.css'
import {BrowserRouter, Routes, Route, Link} from 'react-router-dom';

function App() {
    // Your application must be wrapped with the BrowserRouter component to enable routing
    return (
        <BrowserRouter>
            <nav>
                <Link to="/">Home</Link> |{" "}
                <Link to="/about">About</Link> |{" "}
                <Link to="/contact">Contact</Link>
            </nav>
            <Routes>
                <Route path="/" element={<Home/>}/>
                <Route path="/about" element={<About/>}/>
                <Route path="/contact" element={<Contact/>}/>
            </Routes>
        </BrowserRouter>
    )
}

//example pages to show how it works
function Home() {
    return <h1>Home Page</h1>;
}

function About() {
    return <h1>About Page</h1>;
}

function Contact() {
    return <h1>Contact Page</h1>;
}

export default App
