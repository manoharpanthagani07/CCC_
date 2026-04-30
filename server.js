const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.use(express.static(path.join(__dirname, 'public')));

app.post('/recommend', (req, res) => {
    const { totalTime, movies } = req.body;

    // Support both totalTime and timeLimit for backward compatibility if needed, but spec says totalTime
    const timeLimit = totalTime || req.body.timeLimit;

    if (!timeLimit || !movies || !Array.isArray(movies)) {
        return res.status(400).json({ error: 'Invalid input. Ensure totalTime and movies array are provided.' });
    }

    // Prepare input for C++ process
    let input = `${timeLimit} ${movies.length}\n`;
    for (const movie of movies) {
        input += `${movie.duration} ${movie.rating} ${movie.name}\n`;
    }

    const knapsackExe = os.platform() === 'win32' ? 'knapsack.exe' : './knapsack';
    const child = spawn(path.join(__dirname, knapsackExe));

    let stdoutData = '';
    let stderrData = '';

    child.stdout.on('data', (data) => {
        stdoutData += data.toString();
    });

    child.stderr.on('data', (data) => {
        stderrData += data.toString();
    });

    child.on('close', (code) => {
        if (code !== 0) {
            console.error('C++ process exited with code', code);
            console.error(stderrData);
            return res.status(500).json({ error: 'Internal server error during recommendation' });
        }

        const lines = stdoutData.trim().split('\n').map(line => line.trim()).filter(line => line.length > 0);
        
        if (lines.length === 0) {
             return res.json({ totalRating: 0, selectedMovies: [], totalTimeUsed: 0 });
        }

        const totalRating = parseInt(lines[0], 10);
        const selectedMovies = lines.slice(1);

        // Calculate totalTimeUsed
        let totalTimeUsed = 0;
        for (const selectedName of selectedMovies) {
            const matchedMovie = movies.find(m => m.name === selectedName);
            if (matchedMovie) {
                totalTimeUsed += matchedMovie.duration;
            }
        }

        res.json({ totalRating, selectedMovies, totalTimeUsed });
    });

    child.on('error', (err) => {
        console.error('Failed to start C++ process:', err);
        res.status(500).json({ error: 'Failed to start recommendation engine' });
    });

    // Write input to child process stdin
    child.stdin.write(input);
    child.stdin.end();
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
