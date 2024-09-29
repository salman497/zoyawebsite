// Initialize Supabase

const supabaseUrl = 'https://wwcfdhwkgsjvxqanogek.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3Y2ZkaHdrZ3NqdnhxYW5vZ2VrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjc1ODg2MTIsImV4cCI6MjA0MzE2NDYxMn0.scgCd02DWyfGT551Czaa1dlAnDDubJr173MQ_ORFVi4';
const instanceSupabase = supabase.createClient(supabaseUrl, supabaseKey);

// Elements
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const mainContent = document.getElementById('banner');

// Check Auth State
instanceSupabase.auth.onAuthStateChange((event, session) => {
    if (session && session.user) {
        loginBtn.classList.add('d-none');
        logoutBtn.classList.remove('d-none');
        loadContent(session.user);
    } else {
        loginBtn.classList.remove('d-none');
        logoutBtn.classList.add('d-none');
        //mainContent.innerHTML = '<h1>Welcome to Zoya\'s World</h1>';
    }
});

// Login Function
loginBtn.addEventListener('click', () => {
    instanceSupabase.auth.signInWithOAuth({
        provider: 'google',
    });
});

// Logout Function
logoutBtn.addEventListener('click', () => {
    instanceSupabase.auth.signOut();
});

// Load Content Based on User
function loadContent(user) {
    const adminEmails = ['zoyasalman497@gmail.com', 'salmanaziz497@gmail.com'];
    if (adminEmails.includes(user.email)) {
        loadAdminContent();
        loadFriendContent();
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
       <div class="content"> 
        <header>
            <h2>Welcome, Friend!</h2>
            <div id="game-section">
                <h2>Let's Play Tic-Tac-Toe!</h2>
                <div class="game-board" id="game-board"></div>
                <button class="btn btn-secondary" id="reset-game-btn">Reset Game</button>
            </div>
        </header>
       </div>
    `;


    // <div class="content">
	// 					<header>
	// 						<h2>Welcome to Zoya's World</h2>
	// 						<p>I'm a 10-year-old who loves art, Roblox, and music by Alan Walker!<br />
	// 						Join me in exploring my world of creativity and fun!</p>
	// 					</header>
	// 					<span class="image"><img src="images/zoyapic.jpeg" alt="Zoya's World" /></span>
	// 				</div>
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
    let { data: blogs, error } = await instanceSupabase.from('blogs').select('*');
    if (error) {
        console.error(error);
        return;
    }
    const blogsSection = document.getElementById('blogs-section');
    blogsSection.innerHTML = '<h2>Blogs</h2>';
    for (let blog of blogs) {
        const blogDiv = document.createElement('div');
        blogDiv.classList.add('card', 'mb-3');
        blogDiv.innerHTML = `
            <div class="card-body">
                <h5 class="card-title">${blog.title}</h5>
                <div class="card-text">${blog.content}</div>
                <div id="comments-${blog.id}"></div>
            </div>
        `;
        if (!isAdmin) {
            const commentBox = document.createElement('textarea');
            commentBox.classList.add('form-control', 'mt-2');
            commentBox.placeholder = 'Add a comment...';
            const submitBtn = document.createElement('button');
            submitBtn.classList.add('btn', 'btn-primary', 'mt-2');
            submitBtn.textContent = 'Submit';
            submitBtn.addEventListener('click', () => submitComment(blog.id, commentBox.value));
            blogDiv.querySelector('.card-body').appendChild(commentBox);
            blogDiv.querySelector('.card-body').appendChild(submitBtn);
        }
        blogsSection.appendChild(blogDiv);
        loadComments(blog.id);
    }
}

// Load Comments
async function loadComments(blogId) {
    let { data: comments, error } = await instanceSupabase
        .from('comments')
        .select('content, created_at')
        .eq('blog_id', blogId);
    if (error) {
        console.error(error);
        return;
    }
    const commentsDiv = document.getElementById(`comments-${blogId}`);
    commentsDiv.innerHTML = '<h6>Comments:</h6>';
    comments.forEach(comment => {
        const commentP = document.createElement('p');
        commentP.textContent = `${comment.content} - ${new Date(comment.created_at).toLocaleString()}`;
        commentsDiv.appendChild(commentP);
    });
}

// Submit Comment
async function submitComment(blogId, content) {
    const user = instanceSupabase.auth.user();
    if (!user) return;
    const { error } = await instanceSupabase.from('comments').insert([{ blog_id: blogId, user_id: user.id, content }]);
    if (error) {
        console.error(error);
        return;
    }
    loadComments(blogId);
}

// Show Blog Editor
function showBlogEditor() {
    mainContent.innerHTML += `
        <div id="blog-editor">
            <h2>Add New Blog</h2>
            <input type="text" id="blog-title" class="form-control" placeholder="Blog Title">
            <div id="editor" class="form-control mt-2" style="height: 200px;"></div>
            <button class="btn btn-success mt-2" id="save-blog-btn">Save Blog</button>
        </div>
        <!-- Quill JS -->
        <script src="https://cdn.quilljs.com/1.3.6/quill.js"></script>
    `;

    const quill = new Quill('#editor', {
        theme: 'snow'
    });

    document.getElementById('save-blog-btn').addEventListener('click', () => saveBlog(quill));
}

// Save Blog
async function saveBlog(quill) {
    const title = document.getElementById('blog-title').value;
    const content = quill.root.innerHTML;
    const { error } = await instanceSupabase.from('blogs').insert([{ title, content }]);
    if (error) {
        console.error(error);
        return;
    }
    alert('Blog Saved!');
    loadAdminContent();
}

// Delete Blog
async function deleteBlog(id) {
    const { error } = await instanceSupabase.from('blogs').delete().eq('id', id);
    if (error) {
        console.error(error);
        return;
    }
    alert('Blog Deleted!');
    loadAdminContent();
}