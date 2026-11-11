// ==========================================
// CINEVAULT - MOVIE DISCOVERY APPLICATION
// ==========================================


// ==========================================
// 1. API CONFIGURATION
// ==========================================

const API_BASE_URL = "/api/movies";
const WATCHLIST_API_URL = "/api/watchlist";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

const PLACEHOLDER_IMAGE =
    "https://placehold.co/500x750/151a29/ffffff?text=Poster+Unavailable";


// ==========================================
// 2. AUTHENTICATION CONFIGURATION
// ==========================================


function getAuthToken() {
    return sessionStorage.getItem("cinevault-token");
}
// ==========================================
// 2. GLOBAL MOVIE DATA
// ==========================================

let movies = [];

let trendingMovies = [];

let popularMovies = [];

let watchlist = [];

let selectedMovie = null;


// ==========================================
// 3. DOM ELEMENTS
// ==========================================

const trendingContainer =
    document.getElementById("trendingMovies");

const popularContainer =
    document.getElementById("popularMovies");

const watchlistContainer =
    document.getElementById("watchlistMovies");

const searchInput =
    document.getElementById("searchInput");

const searchButton =
    document.getElementById("searchBtn");

const searchSection =
    document.getElementById("searchSection");

const searchResults =
    document.getElementById("searchResults");

const movieModal =
    document.getElementById("movieModal");

const closeModal =
    document.getElementById("closeModal");


// ==========================================
// 4. HELPER FUNCTIONS
// ==========================================

// Escape external text before inserting it into HTML.

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
}


// Convert TMDB movie object into our frontend format.

function formatMovie(movie, category) {

    return {
        id: movie.id,

        title: movie.title || "Untitled Movie",

        year: movie.release_date
            ? movie.release_date.substring(0, 4)
            : "N/A",

        rating: Number.isFinite(Number(movie.vote_average))
            ? Number(movie.vote_average).toFixed(1)
            : "N/A",

        genre: "Movie",

        description:
            movie.overview || "No description available.",

        poster: movie.poster_path
            ? `${IMAGE_BASE_URL}${movie.poster_path}`
            : PLACEHOLDER_IMAGE,

        // Original TMDB data required for DynamoDB
        posterPath: movie.poster_path || null,

        releaseDate: movie.release_date || null,

        category: category
    };
}

// ==========================================
// 5. FETCH TRENDING MOVIES
// ==========================================

async function fetchTrendingMovies() {

    try {

        console.log("Fetching trending movies...");

        const response = await fetch(
            `${API_BASE_URL}/trending`
        );

        if (!response.ok) {
            throw new Error(
                `Trending API failed: ${response.status}`
            );
        }

        const data = await response.json();

        if (!Array.isArray(data.results)) {
            throw new Error("Invalid trending movie response");
        }

        trendingMovies = data.results.map(movie =>
            formatMovie(movie, "trending")
        );

        updateAllMovies();

        console.log("Trending movies loaded successfully!");

    } catch (error) {

        console.error("Trending API Error:", error);

        if (trendingContainer) {
            trendingContainer.innerHTML =
                "<p>Unable to load trending movies.</p>";
        }

    }
}


// ==========================================
// 6. FETCH POPULAR MOVIES
// ==========================================

async function fetchPopularMovies() {

    try {

        console.log("Fetching popular movies...");

        const response = await fetch(
            `${API_BASE_URL}/popular`
        );

        if (!response.ok) {
            throw new Error(
                `Popular API failed: ${response.status}`
            );
        }

        const data = await response.json();

        if (!Array.isArray(data.results)) {
            throw new Error("Invalid popular movie response");
        }

        popularMovies = data.results.map(movie =>
            formatMovie(movie, "popular")
        );

        updateAllMovies();

        console.log("Popular movies loaded successfully!");

    } catch (error) {

        console.error("Popular API Error:", error);

        if (popularContainer) {
            popularContainer.innerHTML =
                "<p>Unable to load popular movies.</p>";
        }

    }
}


// ==========================================
// 7. COMBINE MOVIE DATA
// ==========================================

function updateAllMovies() {

    // Combine trending and popular movies.
    // Remove duplicates using TMDB movie ID.

    const combinedMovies = [
        ...trendingMovies,
        ...popularMovies
    ];

    const uniqueMovies = new Map();

    combinedMovies.forEach(movie => {

        if (!uniqueMovies.has(movie.id)) {
            uniqueMovies.set(movie.id, movie);
        }

    });

    movies = Array.from(uniqueMovies.values());

    // Update homepage sections.

    displayTrendingMovies();

    displayPopularMovies();

    displayWatchlist();

}


// ==========================================
// 8. WATCHLIST STORAGE
// ==========================================

async function loadWatchlist() {

    const token = getAuthToken();

    // User is not logged in.
    if (!token) {
        watchlist = [];
        displayWatchlist();
        return;
    }

    try {

        const response = await fetch(WATCHLIST_API_URL, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {

            if (response.status === 401) {
                sessionStorage.removeItem("cinevault-token");
                sessionStorage.removeItem("cinevault-user");
            }

            throw new Error(data.message || "Unable to load watchlist.");
        }

        // Convert DynamoDB movie format into frontend format.
        watchlist = (data.movies || []).map(movie => ({
            id: Number(movie.movieId),
            title: movie.title,
            poster: movie.posterPath
                ? `${IMAGE_BASE_URL}${movie.posterPath}`
                : PLACEHOLDER_IMAGE,
            rating: Number(movie.rating || 0).toFixed(1),
            year: movie.releaseDate
                ? movie.releaseDate.substring(0, 4)
                : "N/A",
            description: movie.overview || "No description available.",
            genre: "Movie"
        }));

        displayWatchlist();

        console.log("Watchlist loaded from DynamoDB!");

    } catch (error) {

        console.error("Watchlist loading error:", error);

        watchlist = [];
        displayWatchlist();

    }
}




// ==========================================
// 9. CREATE MOVIE CARD
// ==========================================

function createMovieCard(movie) {

    const isSaved = watchlist.some(
        item => item.id === movie.id
    );

    const safeTitle = escapeHTML(movie.title);

    const safeYear = escapeHTML(movie.year);

    const safeRating = escapeHTML(movie.rating);

    const safePoster = escapeHTML(movie.poster);

    return `

        <div class="movie-card" data-id="${movie.id}">

            <img
                src="${safePoster}"
                alt="${safeTitle} poster"
                loading="lazy"
                onerror="this.onerror=null; this.src='${PLACEHOLDER_IMAGE}';"
            >

            <div class="movie-info">

                <h3>${safeTitle}</h3>

                <div class="movie-meta">

                    <span>${safeYear}</span>

                    <span class="rating">
                        ★ ${safeRating}
                    </span>

                </div>

                <button
                    class="watchlist-btn"
                    data-action="watchlist"
                    data-id="${movie.id}"
                >

                    ${isSaved
                        ? "Remove from Watchlist"
                        : "+ Add to Watchlist"
                    }

                </button>

            </div>

        </div>

    `;

}


// ==========================================
// 10. DISPLAY MOVIES
// ==========================================

function displayMovies(movieList, container) {

    if (!container) {
        console.error("Movie container not found.");
        return;
    }

    if (!movieList || movieList.length === 0) {

        container.innerHTML =
            "<p>No movies found.</p>";

        return;

    }

    container.innerHTML = movieList
        .map(movie => createMovieCard(movie))
        .join("");

}


// ==========================================
// 11. DISPLAY TRENDING MOVIES
// ==========================================

function displayTrendingMovies() {

    displayMovies(
        trendingMovies,
        trendingContainer
    );

}


// ==========================================
// 12. DISPLAY POPULAR MOVIES
// ==========================================

function displayPopularMovies() {

    displayMovies(
        popularMovies,
        popularContainer
    );

}


// ==========================================
// 13. DISPLAY WATCHLIST
// ==========================================

function displayWatchlist() {

    displayMovies(
        watchlist,
        watchlistContainer
    );

}


// ==========================================
// 14. SEARCH FUNCTIONALITY
// ==========================================

function searchMovies() {

    if (!searchInput || !searchSection) {
        return;
    }

    const query = searchInput.value
        .trim()
        .toLowerCase();

    if (!query) {

        searchSection.classList.add("hidden");

        return;

    }

    const results = movies.filter(movie =>

        movie.title.toLowerCase().includes(query)

    );

    searchSection.classList.remove("hidden");

    displayMovies(
        results,
        searchResults
    );

    searchSection.scrollIntoView({
        behavior: "smooth"
    });

}


// Search button event.

if (searchButton) {

    searchButton.addEventListener(
        "click",
        searchMovies
    );

}


// Enter key event.

if (searchInput) {

    searchInput.addEventListener(
        "keydown",
        event => {

            if (event.key === "Enter") {
                searchMovies();
            }

        }
    );

}


// ==========================================
// 15. MOVIE DETAILS MODAL
// ==========================================

function openMovieDetails(movie) {

    if (!movieModal) {
        return;
    }

    selectedMovie = movie;

    const modalPoster =
        document.getElementById("modalPoster");

    const modalTitle =
        document.getElementById("modalTitle");

    const modalRating =
        document.getElementById("modalRating");

    const modalDescription =
        document.getElementById("modalDescription");

    if (modalPoster) {

        modalPoster.src = movie.poster;

        modalPoster.alt = `${movie.title} poster`;

    }

    if (modalTitle) {

        modalTitle.textContent = movie.title;

    }

    if (modalRating) {

        modalRating.textContent =
            `★ ${movie.rating} | ${movie.year} | ${movie.genre}`;

    }

    if (modalDescription) {

        modalDescription.textContent =
            movie.description;

    }

    updateModalButton();

    movieModal.classList.remove("hidden");

}


// Update modal watchlist button.

function updateModalButton() {

    const button =
        document.getElementById("modalWatchlistBtn");

    if (!button || !selectedMovie) {
        return;
    }

    const isSaved = watchlist.some(
        item => item.id === selectedMovie.id
    );

    button.textContent = isSaved
        ? "Remove from Watchlist"
        : "Add to Watchlist";

}


// Close modal.

function closeMovieDetails() {

    if (!movieModal) {
        return;
    }

    movieModal.classList.add("hidden");

    selectedMovie = null;

}


// Close button event.

if (closeModal) {

    closeModal.addEventListener(
        "click",
        closeMovieDetails
    );

}


// Close modal by clicking outside.

if (movieModal) {

    movieModal.addEventListener(
        "click",
        event => {

            if (event.target === movieModal) {
                closeMovieDetails();
            }

        }
    );

}


// Close modal using Escape key.

document.addEventListener(
    "keydown",
    event => {

        if (event.key === "Escape") {
            closeMovieDetails();
        }

    }
);


// ==========================================
// 16. ADD / REMOVE WATCHLIST
// ==========================================

async function toggleWatchlist(movieId) {

    const token = getAuthToken();

    // Check whether the user is logged in.
    if (!token) {
        alert("Please log in to manage your watchlist.");
        window.location.href = "auth.html";
        return;
    }

    const existingMovie = watchlist.find(
        movie => Number(movie.id) === Number(movieId)
    );

    try {

        let response;

        if (existingMovie) {

            // REMOVE MOVIE FROM DYNAMODB

            response = await fetch(
                `${WATCHLIST_API_URL}/${movieId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

        } else {

            // FIND MOVIE IN LOADED MOVIE DATA

            const movie = movies.find(
                item => Number(item.id) === Number(movieId)
            );

            if (!movie) {
                console.error("Movie not found:", movieId);
                return;
            }

            // ADD MOVIE TO DYNAMODB

            const movieData = {
                id: movie.id,
                title: movie.title,
                poster_path: movie.posterPath || (
                    movie.poster
                        ? new URL(movie.poster).pathname.replace(/^\/w500/, "")
                        : null
                ),
                vote_average: Number(movie.rating) || 0,
                release_date: movie.releaseDate || null,
                overview: movie.description || ""
            };

            response = await fetch(WATCHLIST_API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(movieData)
            });

        }

        const data = await response.json();

        if (!response.ok) {

            if (response.status === 401) {
                sessionStorage.removeItem("cinevault-token");
                sessionStorage.removeItem("cinevault-user");

                alert("Your session has expired. Please log in again.");
                window.location.href = "auth.html";
                return;
            }

            throw new Error(data.message || "Watchlist operation failed.");
        }

        console.log(data.message || "Watchlist updated successfully!");

        // Reload the latest watchlist from DynamoDB.
        await loadWatchlist();

        // Refresh movie sections.
        displayTrendingMovies();
        displayPopularMovies();

        // Refresh search results.
        if (searchInput && searchInput.value.trim()) {

            const query = searchInput.value.trim().toLowerCase();

            const filteredMovies = movies.filter(movie =>
                movie.title.toLowerCase().includes(query)
            );

            displayMovies(filteredMovies, searchResults);
        }

        // Update movie modal button.
        if (selectedMovie) {
            updateModalButton();
        }

    } catch (error) {

        console.error("Watchlist error:", error);
        alert(error.message || "Unable to update watchlist.");
    }
}


// ==========================================
// 17. EVENT DELEGATION
// ==========================================

document.addEventListener(
    "click",
    event => {

        // Watchlist button.

        const watchlistButton =
            event.target.closest(".watchlist-btn");

        if (watchlistButton) {

            event.stopPropagation();

            const movieId = Number(
                watchlistButton.dataset.id
            );

            toggleWatchlist(movieId);

            return;

        }


        // Movie card click.

        const movieCard =
            event.target.closest(".movie-card");

        if (movieCard) {

            const movieId = Number(
                movieCard.dataset.id
            );

            const movie = movies.find(
                item => item.id === movieId
            );

            if (movie) {

                openMovieDetails(movie);

            }

        }

    }
);


// ==========================================
// 18. MODAL WATCHLIST BUTTON
// ==========================================

const modalWatchlistButton =
    document.getElementById("modalWatchlistBtn");

if (modalWatchlistButton) {

    modalWatchlistButton.addEventListener(
        "click",
        () => {

            if (selectedMovie) {

                toggleWatchlist(selectedMovie.id);

            }

        }
    );

}


// ==========================================
// 19. INITIALIZE APPLICATION
// ==========================================

async function initializeCineVault() {

    console.log("Initializing CineVault...");

    // Load the user's watchlist from DynamoDB.
    await loadWatchlist();

    // Fetch live TMDB movie data.
    fetchTrendingMovies();
    fetchPopularMovies();

    console.log("CineVault initialized successfully!");

}

// Wait until HTML is completely loaded.
document.addEventListener(
    "DOMContentLoaded",
    initializeCineVault
);
// Wait until HTML is completely loaded.

document.addEventListener(
    "DOMContentLoaded",
    initializeCineVault
);