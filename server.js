const express = require('express');
const path = require('path');

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

    const timeLimit = totalTime || req.body.timeLimit;

    if (!timeLimit || !movies || !Array.isArray(movies)) {
        return res.status(400).json({ error: 'Invalid input. Ensure totalTime and movies array are provided.' });
    }

    // Pure JavaScript Knapsack DP Implementation
    const n = movies.length;
    const W = timeLimit;
    
    // dp[i][w] = max rating achievable using first i items with total duration <= w
    const dp = Array(n + 1).fill(null).map(() => Array(W + 1).fill(0));
    
    for (let i = 1; i <= n; i++) {
        const movie = movies[i - 1];
        const weight = movie.duration;
        const value = movie.rating;
        
        for (let w = 0; w <= W; w++) {
            // Don't include current movie
            dp[i][w] = dp[i - 1][w];
            
            // Include current movie if it fits
            if (weight <= w) {
                dp[i][w] = Math.max(dp[i][w], dp[i - 1][w - weight] + value);
            }
        }
    }

    // Backtrack to find selected movies
    const selectedMovies = [];
    let w = W;
    
    for (let i = n; i > 0 && w > 0; i--) {
        if (dp[i][w] !== dp[i - 1][w]) {
            const movie = movies[i - 1];
            selectedMovies.push(movie.name);
            w -= movie.duration;
        }
    }

    const totalRating = dp[n][W];
    const totalTimeUsed = selectedMovies.length > 0 
        ? selectedMovies.reduce((sum, name) => {
            const movie = movies.find(m => m.name === name);
            return sum + (movie ? movie.duration : 0);
        }, 0)
        : 0;

    res.json({ totalRating, selectedMovies, totalTimeUsed });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
