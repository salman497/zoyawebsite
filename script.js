// Initialize Supabase
const supabaseUrl = 'https://wwcfdhwkgsjvxqanogek.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3Y2ZkaHdrZ3NqdnhxYW5vZ2VrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjc1ODg2MTIsImV4cCI6MjA0MzE2NDYxMn0.scgCd02DWyfGT551Czaa1dlAnDDubJr173MQ_ORFVi4';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// Elements
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const mainContent = document.getElementById('main-content');

// Check Auth State
supabase.auth.onAuthStateChange((event, session) => {
    if (session && session.user) {
        loginBtn.classList.add('d-none');
        logoutBtn.classList.remove('d-none');
        loadContent(session.user);
    } else {
        loginBtn.classList.remove('d-none');
        logoutBtn.classList.add('d-none');
        mainContent.innerHTML = '<h1>Welcome to Zoya\'s World</h1>';
    }
});

// Login Function
loginBtn.addEventListener('click', () => {
    supabase.auth.signInWithOAuth({
        provider: 'google',
    });
});

// Logout Function
logoutBtn.addEventListener('click', () => {
    supabase.auth.signOut();
});

// Load Content Based on User
function loadContent(user) {
    const adminEmails = ['zoyasalman497@gmail.com', 'salmanaziz497@gmail.com'];
    if (adminEmails.includes(user.email)) {
        loadAdminContent();
    } else {
        loadFriendContent();
    }
}

// Admin Content
function loadAdminContent() {
    mainContent.innerHTML = `
        <h1>Welcome, Zoya!</h1>
        <button class="btn btn-primary" id="add-blog-btn">Add New Blog</button>
        <div id="blogs-section"></div>
    `;

    document.getElementById('add-blog-btn').addEventListener('click', showBlogEditor);
    loadBlogs(true);
}

// Friend Content
function loadFriendContent() {
    mainContent.innerHTML = `
        <h1>Welcome, Friend!</h1>
        <div id="game-section">
            <h2>Let's Play Tic-Tac-Toe!</h2>
            <div class="game-board" id="game-board"></div>
            <button class="btn btn-secondary" id="reset-game-btn">Reset Game</button>
        </div>
        <div id="blogs-section"></div>
    `;

    initGame();
    loadBlogs(false);
}

// Initialize Game
function initGame() {
    const gameBoard = document.getElementById('game-board');
    const resetGameBtn = document.getElementById('reset-game-btn');
    let board = ['', '', '', '', '', '', '', '', ''];
    let currentPlayer = 'X';
    let gameActive = true;

    function handleCellClick(e) {
        const cellIndex = Array.from(gameBoard.children).indexOf(e.target);
        if (board[cellIndex] !== '' || !gameActive) return;
        board[cellIndex] = currentPlayer;
        e.target.textContent = currentPlayer;
        checkResult();
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    }

    function checkResult() {
        const winConditions = [
            [0,1,2], [3,4,5], [6,7,8],
            [0,3,6], [1,4,7], [2,5,8],
            [0,4,8], [2,4,6],
        ];
        let roundWon = false;
        for (let condition of winConditions) {
            const [a, b, c] = condition;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                roundWon = true;
                break;
            }
        }
        if (roundWon) {
            alert(`Player ${currentPlayer} Wins!`);
            gameActive = false;
        } else if (!board.includes('')) {
            alert('Game Draw!');
            gameActive = false;
        }
    }

    function resetGame() {
        board = ['', '', '', '', '', '', '', '', ''];
        currentPlayer = 'X';
        gameActive = true;
        Array.from(gameBoard.children).forEach(cell => cell.textContent = '');
    }

    // Render Game Board
    gameBoard.innerHTML = '';
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.classList.add('game-cell');
        cell.addEventListener('click', handleCellClick);
        gameBoard.appendChild(cell);
    }
    resetGameBtn.addEventListener('click', resetGame);
}

// Load Blogs
async function loadBlogs(isAdmin) {
    let { data: blogs, error } = await supabase.from('blogs').select('*');
    if (error) {
        console.error(error);
        return;
    }
    const blogsSection = document.getElementById('blogs-section');
    blogsSection.innerHTML = '<h2>Blogs</h2>';
    blogs.forEach(blog => {
        const blogDiv = document.createElement('div');
        blogDiv.classList.add('card', 'mb-3');
        blogDiv.innerHTML = `
            <div class="card-body">
                <h5 class="card-title">${blog.title}</h5>
                <p class="card-text">${blog.content}</p>
            </div>
        `;
        if (isAdmin) {
            const deleteBtn = document.createElement('button');
            deleteBtn.classList.add('btn', 'btn-danger');
            deleteBtn.textContent = 'Delete';
            deleteBtn.addEventListener('click', () => deleteBlog(blog.id));
            blogDiv.querySelector('.card-body').appendChild(deleteBtn);
        }
        blogsSection.appendChild(blogDiv);
    });
}

// Show Blog Editor
function showBlogEditor() {
    mainContent.innerHTML += `
        <div id="blog-editor">
            <h2>Add New Blog</h2>
            <input type="text" id="blog-title" class="form-control" placeholder="Blog Title">
            <textarea id="blog-content" class="form-control mt-2" placeholder="Blog Content"></textarea>
            <button class="btn btn-success mt-2" id="save-blog-btn">Save Blog</button>
        </div>
    `;
    document.getElementById('save-blog-btn').addEventListener('click', saveBlog);
}

// Save Blog
async function saveBlog() {
    const title = document.getElementById('blog-title').value;
    const content = document.getElementById('blog-content').value;
    const { error } = await supabase.from('blogs').insert([{ title, content }]);
    if (error) {
        console.error(error);
        return;
    }
    alert('Blog Saved!');
    loadAdminContent();
}

// Delete Blog
async function deleteBlog(id) {
    const { error } = await supabase.from('blogs').delete().eq('id', id);
    if (error) {
        console.error(error);
        return;
    }
    alert('Blog Deleted!');
    loadAdminContent();
}