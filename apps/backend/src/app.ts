import express from 'express';
import morgan from 'morgan';

const app = express();

// You can change this later to process.env.VARIABLE
const port = 3001;

// Middleware
app.use(express.json());
app.use(morgan('dev'));

// Send HTTP 200 at root
app.get('/', (req, res) => {
    res.sendStatus(200);
});

// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

export default app;