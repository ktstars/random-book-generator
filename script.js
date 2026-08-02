// Grab the interactive elements from the DOM
const generateBtn = document.getElementById('generate-btn');
const loadingDiv = document.getElementById('loading');
const bookCard = document.getElementById('book-card');
const errorDiv = document.getElementById('error-message');
const readMoreBtn = document.getElementById('read-more-btn');

// Grab the elements where we will inject the book data
const bookTitle = document.getElementById('book-title');
const bookAuthor = document.getElementById('book-author');
const bookCover = document.getElementById('book-cover');
const bookGenre = document.getElementById('book-genre');
const bookDate = document.getElementById('book-date');
const bookDescription = document.getElementById('book-description');
const bookLink = document.getElementById('book-link');

// A list of popular book subjects. We randomly select one to ensure varied results.
const subjects = [
    'fiction', 'mystery', 'thriller', 'romance', 'fantasy', 
    'history', 'philosophy', 'art', 'science_fiction', 'biography', 'adventure'
];

/**
 * Main function that runs when the user clicks the button.
 * Uses 'async/await' so it can pause and wait for the API network requests.
 */
async function fetchRandomBook() {
    // 1. Prepare UI: hide previous results/errors, show the loading spinner, disable the button
    hideElement(bookCard);
    hideElement(errorDiv);
    showElement(loadingDiv);
    generateBtn.disabled = true;

    try {
        // 2. Randomly select a subject and generate a random offset.
        const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];
        const randomOffset = Math.floor(Math.random() * 200); 

        // 3. First API call: Fetch a single book from the Open Library Search API
        const searchUrl = `https://openlibrary.org/search.json?subject=${randomSubject}&limit=1&offset=${randomOffset}`;
        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();

        // Guard clause: ensure we actually found a book
        if (!searchData.docs || searchData.docs.length === 0) {
            throw new Error("No book found for this query.");
        }

        // Extract the specific book object from the response array
        const book = searchData.docs[0];

        // 4. Extract basic info using logical OR (||) for graceful fallbacks
        const title = book.title || "Unknown Title";
        const author = (book.author_name && book.author_name.length > 0) ? book.author_name[0] : "Unknown Author";
        const year = book.first_publish_year || "Unknown Year";
        const genre = (book.subject && book.subject.length > 0) ? book.subject[0] : randomSubject;

        // Base URL for linking directly to the Open Library record
        const link = `https://openlibrary.org${book.key}`;

        // 5. Construct the Cover URL. 
        let coverUrl = 'https://openlibrary.org/images/icons/avatar_book-sm.png';
        if (book.cover_i) {
            coverUrl = `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`;
        }

        // 6. Second API call: Fetch the specific "Work" page to get the summary/description.
        let descriptionText = "No summary is currently available for this book.";
        
        try {
            const workUrl = `https://openlibrary.org${book.key}.json`;
            const workResponse = await fetch(workUrl);
            const workData = await workResponse.json();

            if (workData.description) {
                if (typeof workData.description === 'string') {
                    descriptionText = workData.description;
                } else if (workData.description.value) {
                    descriptionText = workData.description.value;
                }
            }
        } catch (workError) {
            console.warn("Could not fetch the detailed description.", workError);
        }

        // 7. Inject all the data into the DOM
        bookTitle.textContent = title;
        bookAuthor.textContent = `By ${author}`;
        bookCover.src = coverUrl;
        bookCover.alt = `Cover art for ${title}`;
        bookGenre.textContent = genre;
        
        // Add context to the date so users know it's the Work's first publishing, not the specific cover's printing
        bookDate.textContent = year !== "Unknown Year" ? `First Published: ${year}` : year;
        bookLink.href = link;

        // Inject the FULL description text
        bookDescription.textContent = descriptionText;
        
        // Reset the description to be collapsed
        bookDescription.classList.remove('expanded');
        readMoreBtn.textContent = 'Read More';

        // Check if the description is long enough to need a "Read More" button (approx. 250 characters)
        if (descriptionText.length > 250) {
            showElement(readMoreBtn);
        } else {
            hideElement(readMoreBtn);
        }

        // 8. Finalize UI: hide loading, show the completed card
        hideElement(loadingDiv);
        showElement(bookCard);
        
    } catch (error) {
        // If the main search fetch failed, log it and show the error alert
        console.error("Error generating random book:", error);
        hideElement(loadingDiv);
        showElement(errorDiv);
    } finally {
        // This block runs no matter what (success or error). Re-enable the button so the user can click again.
        generateBtn.disabled = false;
    }
}

// 9. Read More Toggle Logic
readMoreBtn.addEventListener('click', () => {
    // Toggle the 'expanded' class on the paragraph (managed in CSS)
    bookDescription.classList.toggle('expanded');
    
    // Change the button text based on whether it is expanded or not
    if (bookDescription.classList.contains('expanded')) {
        readMoreBtn.textContent = 'Read Less';
    } else {
        readMoreBtn.textContent = 'Read More';
    }
});

// Utility functions to manage CSS classes cleanly
function hideElement(el) {
    el.classList.add('hidden');
}

function showElement(el) {
    el.classList.remove('hidden');
}

// Listen for clicks on the Generate button
generateBtn.addEventListener('click', fetchRandomBook);