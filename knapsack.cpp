#include <iostream>
#include <vector>
#include <string>
#include <algorithm>

using namespace std;

struct Movie {
    int duration;
    int rating;
    string name;
};

int main() {
    int T, N;
    if (!(cin >> T >> N)) return 0;
    
    vector<Movie> movies(N);
    for (int i = 0; i < N; ++i) {
        cin >> movies[i].duration >> movies[i].rating;
        getline(cin >> ws, movies[i].name);
    }
    
    vector<vector<int>> dp(N + 1, vector<int>(T + 1, 0));
    
    for (int i = 1; i <= N; ++i) {
        int w = movies[i-1].duration;
        int v = movies[i-1].rating;
        for (int j = 0; j <= T; ++j) {
            if (w <= j) {
                dp[i][j] = max(dp[i-1][j], dp[i-1][j - w] + v);
            } else {
                dp[i][j] = dp[i-1][j];
            }
        }
    }
    
    int res = dp[N][T];
    int w = T;
    vector<string> selected_movies;
    for (int i = N; i > 0 && res > 0; --i) {
        if (res == dp[i-1][w]) {
            continue;
        } else {
            selected_movies.push_back(movies[i-1].name);
            res -= movies[i-1].rating;
            w -= movies[i-1].duration;
        }
    }
    
    cout << dp[N][T] << endl;
    for (int i = selected_movies.size() - 1; i >= 0; --i) {
        cout << selected_movies[i] << endl;
    }
    
    return 0;
}
