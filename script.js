// ==================== CONFIGURATION FIREBASE ====================
const firebaseConfig = {
  apiKey: "AIzaSyDMgt6uOkaE9o9aXedKcpAkFOH4qeXromk",
  authDomain: "e-learning-pro-b435d.firebaseapp.com",
  projectId: "e-learning-pro-b435d",
  storageBucket: "e-learning-pro-b435d.firebasestorage.app",
  messagingSenderId: "1012778875341",
  appId: "1:1012778875341:web:4fb1d0490b7b306fcb2c84",
  measurementId: "G-W7R15JBYW0"
};

// Initialiser Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ==================== STRUCTURES DE DONNÉES ====================
let learners = [];
let courses = [];
let quizzes = [];
let progress = {};
let messages = [];
let currentUser = null;

// Compte admin prédéfini
const ADMIN_USERNAME = "Steph";
const ADMIN_PASSWORD = "Steffmilli00";

// ==================== CHARGEMENT DEPUIS FIREBASE ====================
async function loadAllData() {
    try {
        // Charger les apprenants
        const learnersSnap = await db.collection('learners').get();
        learners = [];
        learnersSnap.forEach(doc => {
            learners.push({ id: parseInt(doc.id), ...doc.data() });
        });
        
        // Charger les cours
        const coursesSnap = await db.collection('courses').get();
        courses = [];
        coursesSnap.forEach(doc => {
            courses.push({ id: parseInt(doc.id), ...doc.data() });
        });
        
        // Charger les quiz
        const quizzesSnap = await db.collection('quizzes').get();
        quizzes = [];
        quizzesSnap.forEach(doc => {
            quizzes.push({ id: parseInt(doc.id), ...doc.data() });
        });
        
        // Charger les progrès
        const progressSnap = await db.collection('progress').get();
        progress = {};
        progressSnap.forEach(doc => {
            progress[doc.id] = doc.data();
        });
        
        // Charger les messages
        const messagesSnap = await db.collection('messages').get();
        messages = [];
        messagesSnap.forEach(doc => {
            messages.push({ id: parseInt(doc.id), ...doc.data() });
        });
        
        console.log('Données chargées depuis Firebase');
    } catch (error) {
        console.error('Erreur chargement:', error);
        showAlert('Erreur de chargement des données', 'error');
    }
}

// ==================== SAUVEGARDE DANS FIREBASE ====================
async function saveLearner(learner) {
    await db.collection('learners').doc(learner.id.toString()).set(learner);
}

async function deleteLearnerFromFirebase(id) {
    await db.collection('learners').doc(id.toString()).delete();
}

async function saveCourse(course) {
    await db.collection('courses').doc(course.id.toString()).set(course);
}

async function deleteCourseFromFirebase(id) {
    await db.collection('courses').doc(id.toString()).delete();
}

async function saveQuiz(quiz) {
    await db.collection('quizzes').doc(quiz.id.toString()).set(quiz);
}

async function deleteQuizFromFirebase(id) {
    await db.collection('quizzes').doc(id.toString()).delete();
}

async function saveProgressForLearner(learnerId) {
    if (progress[learnerId]) {
        await db.collection('progress').doc(learnerId.toString()).set(progress[learnerId]);
    }
}

async function saveMessage(message) {
    await db.collection('messages').doc(message.id.toString()).set(message);
}

async function deleteMessageFromFirebase(id) {
    await db.collection('messages').doc(id.toString()).delete();
}

// ==================== ÉCOUTEURS TEMPS RÉEL ====================
function setupRealtimeListeners() {
    // Écouter les changements sur les apprenants
    db.collection('learners').onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
            const data = { id: parseInt(change.doc.id), ...change.doc.data() };
            if (change.type === 'added') {
                if (!learners.find(l => l.id === data.id)) learners.push(data);
            } else if (change.type === 'modified') {
                const index = learners.findIndex(l => l.id === data.id);
                if (index !== -1) learners[index] = data;
            } else if (change.type === 'removed') {
                learners = learners.filter(l => l.id !== data.id);
            }
        });
        if (currentUser) refreshUI();
    });
    
    // Écouter les changements sur les cours
    db.collection('courses').onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
            const data = { id: parseInt(change.doc.id), ...change.doc.data() };
            if (change.type === 'added') {
                if (!courses.find(c => c.id === data.id)) courses.push(data);
            } else if (change.type === 'modified') {
                const index = courses.findIndex(c => c.id === data.id);
                if (index !== -1) courses[index] = data;
            } else if (change.type === 'removed') {
                courses = courses.filter(c => c.id !== data.id);
            }
        });
        if (currentUser) refreshUI();
    });
    
    // Écouter les changements sur les quiz
    db.collection('quizzes').onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
            const data = { id: parseInt(change.doc.id), ...change.doc.data() };
            if (change.type === 'added') {
                if (!quizzes.find(q => q.id === data.id)) quizzes.push(data);
            } else if (change.type === 'modified') {
                const index = quizzes.findIndex(q => q.id === data.id);
                if (index !== -1) quizzes[index] = data;
            } else if (change.type === 'removed') {
                quizzes = quizzes.filter(q => q.id !== data.id);
            }
        });
        if (currentUser) refreshUI();
    });
    
    // Écouter les changements sur les progrès
    db.collection('progress').onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'modified' || change.type === 'added') {
                progress[change.doc.id] = change.doc.data();
            }
        });
        if (currentUser) refreshUI();
    });
    
    // Écouter les changements sur les messages
    db.collection('messages').onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
            const data = { id: parseInt(change.doc.id), ...change.doc.data() };
            if (change.type === 'added') {
                messages.push(data);
            } else if (change.type === 'modified') {
                const index = messages.findIndex(m => m.id === data.id);
                if (index !== -1) messages[index] = data;
            } else if (change.type === 'removed') {
                messages = messages.filter(m => m.id !== data.id);
            }
        });
        if (currentUser && document.getElementById('messages-tab').classList.contains('active')) {
            loadMessages();
        }
    });
}

// ==================== INITIALISATION ====================
async function init() {
    // Charger les données depuis Firebase
    await loadAllData();
    
    // Ajouter un cours de démonstration si vide
    const coursesSnap = await db.collection('courses').get();
    if (coursesSnap.empty) {
        const demoCourse = {
            id: Date.now(),
            title: "Introduction à JavaScript",
            description: "Apprenez les bases de JavaScript, le langage de programmation du web moderne.",
            videoUrl: "https://www.youtube.com/watch?v=hdI2bqOjy3c",
            level: "Débutant"
        };
        await db.collection('courses').doc(demoCourse.id.toString()).set(demoCourse);
        courses.push(demoCourse);
    }
    
    // Configurer les écouteurs temps réel
    setupRealtimeListeners();
    
    // Vérifier session
    const savedSession = localStorage.getItem('currentUser');
    if (savedSession) {
        try {
            currentUser = JSON.parse(savedSession);
            if (currentUser.role === 'admin' || learners.find(l => l.id === currentUser.id)) {
                loginSuccess(currentUser);
            } else {
                localStorage.removeItem('currentUser');
                showLoginScreen();
            }
        } catch(e) {
            localStorage.removeItem('currentUser');
            showLoginScreen();
        }
    } else {
        showLoginScreen();
    }
    
    setupEventListeners();
}

function refreshUI() {
    if (currentUser) {
        renderLearners();
        renderCourses();
        renderQuizzes();
        updateCourseSelects();
        loadLearnerDashboard();
        updateTrackingSelect();
        updateCertificateSelect();
        loadMessages();
        updateMessageRecipients();
    }
}

// ==================== AUTHENTIFICATION ====================
function showLoginScreen() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('main-app').style.display = 'none';
}

function loginSuccess(user) {
    currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('main-app').style.display = 'block';
    
    document.getElementById('user-name-display').textContent = user.name;
    const roleBadge = document.getElementById('user-role-badge');
    if (user.role === 'admin') {
        roleBadge.textContent = 'Administrateur';
        roleBadge.className = 'role-badge admin';
    } else {
        roleBadge.textContent = 'Apprenant';
        roleBadge.className = 'role-badge learner';
    }
    
    const adminTabs = document.querySelectorAll('.admin-only');
    if (user.role === 'admin') {
        adminTabs.forEach(tab => tab.classList.remove('hidden'));
    } else {
        adminTabs.forEach(tab => tab.classList.add('hidden'));
        switchTab('dashboard');
    }
    
    refreshUI();
}

function setupEventListeners() {
    document.querySelectorAll('.login-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchLoginTab(btn.dataset.loginTab));
    });
    
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    document.getElementById('logout-btn').addEventListener('click', logout);
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    document.getElementById('learner-form').addEventListener('submit', addLearner);
    document.getElementById('course-form').addEventListener('submit', addCourse);
    document.getElementById('quiz-form').addEventListener('submit', addQuiz);
    document.getElementById('add-question').addEventListener('click', addQuestion);
    
    document.getElementById('learner-search').addEventListener('input', (e) => renderLearners(e.target.value));
    document.getElementById('course-search').addEventListener('input', (e) => renderCourses(e.target.value));
    
    document.getElementById('tracking-learner').addEventListener('change', (e) => showTracking(e.target.value));
    
    document.getElementById('message-form').addEventListener('submit', sendMessage);
    
    document.querySelector('.close').addEventListener('click', () => closeModal());
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('quiz-modal');
        if (e.target === modal) closeModal();
    });
    
    document.getElementById('certificate-learner').addEventListener('change', () => {
        const learnerId = document.getElementById('certificate-learner').value;
        if (learnerId) previewCertificate(learnerId);
    });
}

function switchLoginTab(tab) {
    document.querySelectorAll('.login-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.loginTab === tab);
    });
    document.querySelectorAll('.login-tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `${tab}-tab`);
    });
}

function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('login-error');
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        loginSuccess({
            id: 'admin',
            name: 'MILLOGO S. Yves Stéphane',
            username: ADMIN_USERNAME,
            role: 'admin'
        });
        errorDiv.textContent = '';
        return;
    }
    
    const learner = learners.find(l => l.username === username && l.password === password);
    if (learner) {
        loginSuccess({
            id: learner.id,
            name: learner.name,
            username: learner.username,
            role: 'learner'
        });
        errorDiv.textContent = '';
        return;
    }
    
    errorDiv.textContent = 'Nom d\'utilisateur ou mot de passe incorrect';
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const username = document.getElementById('reg-username').value.trim();
    const password = document.getElementById('reg-password').value;
    const email = document.getElementById('reg-email').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const errorDiv = document.getElementById('register-error');
    
    if (!name || !username || !password || !email) {
        errorDiv.textContent = 'Tous les champs obligatoires doivent être remplis';
        return;
    }
    
    if (password.length < 4) {
        errorDiv.textContent = 'Le mot de passe doit contenir au moins 4 caractères';
        return;
    }
    
    if (learners.find(l => l.username === username)) {
        errorDiv.textContent = 'Ce nom d\'utilisateur existe déjà';
        return;
    }
    
    if (username === ADMIN_USERNAME) {
        errorDiv.textContent = 'Ce nom d\'utilisateur est réservé';
        return;
    }
    
    const learner = {
        id: Date.now(),
        name,
        username,
        password,
        email,
        phone: phone || '',
        enrolledCourses: []
    };
    
    learners.push(learner);
    await saveLearner(learner);
    
    progress[learner.id] = { completedCourses: [], quizAttempts: {}, certificateDelivered: false };
    await saveProgressForLearner(learner.id);
    
    sendEmailConfirmation(email, name);
    
    errorDiv.textContent = '';
    errorDiv.className = 'success-message';
    errorDiv.innerHTML = '✅ Compte créé avec succès ! Un email de confirmation a été envoyé.';
    
    document.getElementById('register-form').reset();
    
    setTimeout(() => {
        switchLoginTab('login');
        errorDiv.textContent = '';
        errorDiv.className = 'error-message';
    }, 3000);
}

function sendEmailConfirmation(email, name) {
    console.log(`Email envoyé à ${email}: Bienvenue ${name} sur E-Learning Pro !`);
    showAlert(`📧 Un email de confirmation a été envoyé à ${email}`, 'success');
}

function showForgotPassword() {
    document.getElementById('forgot-password-modal').style.display = 'block';
    document.getElementById('forgot-password-form').onsubmit = resetPassword;
}

function closeForgotPasswordModal() {
    document.getElementById('forgot-password-modal').style.display = 'none';
}

async function resetPassword(e) {
    e.preventDefault();
    const username = document.getElementById('forgot-username').value.trim();
    const email = document.getElementById('forgot-email').value.trim();
    const newPassword = document.getElementById('new-password').value;
    const errorDiv = document.getElementById('forgot-error');
    
    if (newPassword.length < 4) {
        errorDiv.textContent = 'Le mot de passe doit contenir au moins 4 caractères';
        return;
    }
    
    const learner = learners.find(l => l.username === username && l.email === email);
    if (learner) {
        learner.password = newPassword;
        await saveLearner(learner);
        errorDiv.className = 'success-message';
        errorDiv.innerHTML = '✅ Mot de passe réinitialisé avec succès !';
        setTimeout(() => {
            closeForgotPasswordModal();
            errorDiv.textContent = '';
        }, 2000);
    } else {
        errorDiv.textContent = 'Nom d\'utilisateur ou email incorrect';
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    showLoginScreen();
}

function checkAdmin() {
    if (!currentUser || currentUser.role !== 'admin') {
        showAlert('Accès réservé à l\'administrateur', 'error');
        return false;
    }
    return true;
}

function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert-message ${type}`;
    alertDiv.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${message}`;
    alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#28a745' : '#dc3545'};
        color: white;
        border-radius: 10px;
        z-index: 2000;
        animation: slideIn 0.3s;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 4000);
}

// ==================== GESTION APPRENANTS ====================
async function addLearner(e) {
    e.preventDefault();
    if (!checkAdmin()) return;
    
    const name = document.getElementById('learner-name').value.trim();
    const username = document.getElementById('learner-username').value.trim();
    const password = document.getElementById('learner-password').value;
    const email = document.getElementById('learner-email').value.trim();
    const phone = document.getElementById('learner-phone').value.trim();
    
    if (!name || !username || !password || !email) {
        alert('Tous les champs obligatoires doivent être remplis');
        return;
    }
    
    if (password.length < 4) {
        alert('Le mot de passe doit contenir au moins 4 caractères');
        return;
    }
    
    if (learners.find(l => l.username === username)) {
        alert('Ce nom d\'utilisateur existe déjà');
        return;
    }
    
    const learner = {
        id: Date.now(),
        name,
        username,
        password,
        email,
        phone,
        enrolledCourses: []
    };
    
    learners.push(learner);
    await saveLearner(learner);
    
    progress[learner.id] = { completedCourses: [], quizAttempts: {}, certificateDelivered: false };
    await saveProgressForLearner(learner.id);
    
    renderLearners();
    document.getElementById('learner-form').reset();
    updateTrackingSelect();
    updateCertificateSelect();
    updateMessageRecipients();
    showAlert('Apprenant ajouté avec succès', 'success');
}

function renderLearners(searchTerm = '') {
    const container = document.getElementById('learners-list');
    if (!container) return;
    
    const term = searchTerm || document.getElementById('learner-search')?.value.toLowerCase() || '';
    const filtered = learners.filter(l => 
        l.name.toLowerCase().includes(term) || 
        l.email.toLowerCase().includes(term)
    );
    
    if (filtered.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#999;">Aucun apprenant trouvé</p>';
        return;
    }
    
    container.innerHTML = filtered.map(learner => `
        <div class="card">
            <h3><i class="fas fa-user-graduate"></i> ${escapeHtml(learner.name)}</h3>
            <p><i class="fas fa-at"></i> ${escapeHtml(learner.username)}</p>
            <p><i class="fas fa-envelope"></i> ${escapeHtml(learner.email)}</p>
            <p><i class="fas fa-phone"></i> ${escapeHtml(learner.phone) || 'Non renseigné'}</p>
            <div class="card-actions">
                <button class="edit-btn" onclick="editLearner(${learner.id})"><i class="fas fa-edit"></i> Modifier</button>
                <button class="delete-btn" onclick="deleteLearner(${learner.id})"><i class="fas fa-trash"></i> Supprimer</button>
            </div>
        </div>
    `).join('');
}

window.editLearner = async function(id) {
    if (!checkAdmin()) return;
    const learner = learners.find(l => l.id === id);
    if (!learner) return;
    
    const newName = prompt('Nouveau nom :', learner.name);
    const newUsername = prompt('Nouveau nom d\'utilisateur :', learner.username);
    const newPassword = prompt('Nouveau mot de passe (min. 4) :', learner.password);
    const newEmail = prompt('Nouvel email :', learner.email);
    const newPhone = prompt('Nouveau téléphone :', learner.phone);
    
    if (newName && newUsername && newPassword && newEmail) {
        if (newPassword.length < 4) {
            alert('Le mot de passe doit contenir au moins 4 caractères');
            return;
        }
        if (newUsername !== learner.username && learners.find(l => l.username === newUsername)) {
            alert('Ce nom d\'utilisateur existe déjà');
            return;
        }
        learner.name = newName;
        learner.username = newUsername;
        learner.password = newPassword;
        learner.email = newEmail;
        learner.phone = newPhone;
        await saveLearner(learner);
        renderLearners();
        updateTrackingSelect();
        updateCertificateSelect();
        updateMessageRecipients();
        showAlert('Apprenant modifié avec succès', 'success');
    }
};

window.deleteLearner = async function(id) {
    if (!checkAdmin()) return;
    if (confirm('Supprimer cet apprenant ?')) {
        learners = learners.filter(l => l.id !== id);
        delete progress[id];
        await deleteLearnerFromFirebase(id);
        await saveProgressForLearner(id); // pour supprimer aussi
        renderLearners();
        updateTrackingSelect();
        updateCertificateSelect();
        updateMessageRecipients();
        showAlert('Apprenant supprimé', 'success');
    }
};

// ==================== GESTION COURS ====================
async function addCourse(e) {
    e.preventDefault();
    if (!checkAdmin()) return;
    
    const title = document.getElementById('course-title').value.trim();
    const description = document.getElementById('course-desc').value.trim();
    const videoUrl = document.getElementById('course-video').value.trim();
    const level = document.getElementById('course-level').value;
    
    if (!title || !description || !videoUrl || !level) {
        alert('Tous les champs sont obligatoires');
        return;
    }
    
    const course = {
        id: Date.now(),
        title,
        description,
        videoUrl,
        level
    };
    
    courses.push(course);
    await saveCourse(course);
    renderCourses();
    updateCourseSelects();
    loadLearnerDashboard();
    showAlert('Cours ajouté avec succès', 'success');
}

function renderCourses(searchTerm = '') {
    const container = document.getElementById('courses-list');
    if (!container) return;
    
    const term = searchTerm || document.getElementById('course-search')?.value.toLowerCase() || '';
    const filtered = courses.filter(c => 
        c.title.toLowerCase().includes(term) || 
        c.description.toLowerCase().includes(term)
    );
    
    if (filtered.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#999;">Aucun cours trouvé</p>';
        return;
    }
    
    container.innerHTML = filtered.map(course => `
        <div class="card">
            <h3><i class="fas fa-book"></i> ${escapeHtml(course.title)}</h3>
            <p>${escapeHtml(course.description.substring(0, 100))}...</p>
            <p><strong>Niveau :</strong> ${course.level}</p>
            <a href="${course.videoUrl}" target="_blank" class="video-link"><i class="fas fa-play"></i> Voir la vidéo</a>
            <div class="card-actions">
                <button class="edit-btn" onclick="editCourse(${course.id})"><i class="fas fa-edit"></i> Modifier</button>
                <button class="delete-btn" onclick="deleteCourse(${course.id})"><i class="fas fa-trash"></i> Supprimer</button>
            </div>
        </div>
    `).join('');
}

window.editCourse = async function(id) {
    if (!checkAdmin()) return;
    const course = courses.find(c => c.id === id);
    if (!course) return;
    
    const newTitle = prompt('Nouveau titre :', course.title);
    const newDesc = prompt('Nouvelle description :', course.description);
    const newVideo = prompt('Nouvelle URL vidéo :', course.videoUrl);
    const newLevel = prompt('Nouveau niveau (Débutant/Intermédiaire/Avancé) :', course.level);
    
    if (newTitle && newDesc && newVideo && newLevel) {
        course.title = newTitle;
        course.description = newDesc;
        course.videoUrl = newVideo;
        course.level = newLevel;
        await saveCourse(course);
        renderCourses();
        updateCourseSelects();
        loadLearnerDashboard();
        showAlert('Cours modifié', 'success');
    }
};

window.deleteCourse = async function(id) {
    if (!checkAdmin()) return;
    if (confirm('Supprimer ce cours ?')) {
        courses = courses.filter(c => c.id !== id);
        await deleteCourseFromFirebase(id);
        renderCourses();
        updateCourseSelects();
        loadLearnerDashboard();
        showAlert('Cours supprimé', 'success');
    }
};

// ==================== GESTION QUIZ ====================
function addQuestion() {
    const container = document.getElementById('questions-container');
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-item';
    questionDiv.innerHTML = `
        <input type="text" placeholder="Question" class="question-text" required>
        <div class="options-container">
            <input type="text" placeholder="Option 1" class="option-input" required>
            <input type="text" placeholder="Option 2" class="option-input" required>
            <input type="text" placeholder="Option 3" class="option-input" required>
        </div>
        <select class="correct-answer" required>
            <option value="">Bonne réponse</option>
            <option value="0">Option 1</option>
            <option value="1">Option 2</option>
            <option value="2">Option 3</option>
        </select>
        <button type="button" class="remove-question"><i class="fas fa-trash"></i> Supprimer</button>
    `;
    container.appendChild(questionDiv);
    questionDiv.querySelector('.remove-question').addEventListener('click', () => questionDiv.remove());
}

async function addQuiz(e) {
    e.preventDefault();
    if (!checkAdmin()) return;
    
    const courseId = parseInt(document.getElementById('quiz-course').value);
    const title = document.getElementById('quiz-title').value.trim();
    const questionItems = document.querySelectorAll('.question-item');
    
    if (!courseId || !title || questionItems.length === 0) {
        alert('Veuillez remplir tous les champs');
        return;
    }
    
    const questions = [];
    questionItems.forEach(item => {
        const text = item.querySelector('.question-text').value;
        const options = [
            item.querySelectorAll('.option-input')[0]?.value,
            item.querySelectorAll('.option-input')[1]?.value,
            item.querySelectorAll('.option-input')[2]?.value
        ];
        const correct = parseInt(item.querySelector('.correct-answer').value);
        
        if (text && options.every(opt => opt) && !isNaN(correct)) {
            questions.push({ text, options, correct });
        }
    });
    
    if (questions.length === 0) {
        alert('Veuillez ajouter au moins une question valide');
        return;
    }
    
    const quiz = {
        id: Date.now(),
        courseId,
        title,
        questions
    };
    
    quizzes.push(quiz);
    await saveQuiz(quiz);
    renderQuizzes();
    document.getElementById('quiz-form').reset();
    document.getElementById('questions-container').innerHTML = `
        <div class="question-item">
            <input type="text" placeholder="Question" class="question-text" required>
            <div class="options-container">
                <input type="text" placeholder="Option 1" class="option-input" required>
                <input type="text" placeholder="Option 2" class="option-input" required>
                <input type="text" placeholder="Option 3" class="option-input" required>
            </div>
            <select class="correct-answer" required>
                <option value="">Bonne réponse</option>
                <option value="0">Option 1</option>
                <option value="1">Option 2</option>
                <option value="2">Option 3</option>
            </select>
        </div>
    `;
    showAlert('Quiz créé avec succès', 'success');
}

function renderQuizzes() {
    const container = document.getElementById('quizzes-list');
    if (!container) return;
    
    if (quizzes.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#999;">Aucun quiz créé</p>';
        return;
    }
    
    container.innerHTML = quizzes.map(quiz => {
        const course = courses.find(c => c.id === quiz.courseId);
        return `
            <div class="card">
                <h3><i class="fas fa-question-circle"></i> ${escapeHtml(quiz.title)}</h3>
                <p><strong>Cours :</strong> ${course ? course.title : 'Cours supprimé'}</p>
                <p><strong>Questions :</strong> ${quiz.questions.length}</p>
                <div class="card-actions">
                    <button class="edit-btn" onclick="editQuiz(${quiz.id})"><i class="fas fa-edit"></i>Modifier</button>
                    <button class="delete-btn" onclick="deleteQuiz(${quiz.id})"><i class="fas fa-trash"></i> Supprimer</button>
                </div>
            </div>
        `;
    }).join('');
}

window.editQuiz = async function(quizId) {
    if (!checkAdmin()) return;
    const quiz = quizzes.find(q => q.id === quizId);
    if (!quiz) return;
    
    const modal = document.createElement('div');
    modal.id = 'edit-quiz-modal';
    modal.className = 'modal';
    modal.style.display = 'block';
    
    let questionsHtml = '';
    quiz.questions.forEach((q, idx) => {
        questionsHtml += `
            <div class="question-item" data-question-index="${idx}">
                <input type="text" placeholder="Question" class="question-text" value="${escapeHtml(q.text)}" required>
                <div class="options-container">
                    <input type="text" placeholder="Option 1" class="option-input" value="${escapeHtml(q.options[0])}" required>
                    <input type="text" placeholder="Option 2" class="option-input" value="${escapeHtml(q.options[1])}" required>
                    <input type="text" placeholder="Option 3" class="option-input" value="${escapeHtml(q.options[2])}" required>
                </div>
                <select class="correct-answer" required>
                    <option value="">Bonne réponse</option>
                    <option value="0" ${q.correct === 0 ? 'selected' : ''}>Option 1</option>
                    <option value="1" ${q.correct === 1 ? 'selected' : ''}>Option 2</option>
                    <option value="2" ${q.correct === 2 ? 'selected' : ''}>Option 3</option>
                </select>
                <button type="button" class="remove-question"><i class="fas fa-trash"></i> Supprimer</button>
            </div>
        `;
    });
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 700px;">
            <span class="close">&times;</span>
            <h3><i class="fas fa-edit"></i> Modifier le quiz : ${escapeHtml(quiz.title)}</h3>
            <form id="edit-quiz-form">
                <select id="edit-quiz-course" required>
                    <option value="">Sélectionner un cours</option>
                    ${courses.map(c => `<option value="${c.id}" ${c.id === quiz.courseId ? 'selected' : ''}>${escapeHtml(c.title)}</option>`).join('')}
                </select>
                <input type="text" id="edit-quiz-title" placeholder="Titre du quiz" value="${escapeHtml(quiz.title)}" required>
                <div id="edit-questions-container">
                    ${questionsHtml}
                </div>
                <button type="button" id="edit-add-question"><i class="fas fa-plus"></i> Ajouter une question</button>
                <button type="submit" style="margin-top: 15px;"><i class="fas fa-save"></i> Mettre à jour</button>
                <button type="button" id="cancel-edit-quiz" style="margin-top: 15px; background: #6c757d;"><i class="fas fa-times"></i> Annuler</button>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const addBtn = document.getElementById('edit-add-question');
    addBtn.addEventListener('click', () => {
        const container = document.getElementById('edit-questions-container');
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-item';
        questionDiv.innerHTML = `
            <input type="text" placeholder="Question" class="question-text" required>
            <div class="options-container">
                <input type="text" placeholder="Option 1" class="option-input" required>
                <input type="text" placeholder="Option 2" class="option-input" required>
                <input type="text" placeholder="Option 3" class="option-input" required>
            </div>
            <select class="correct-answer" required>
                <option value="">Bonne réponse</option>
                <option value="0">Option 1</option>
                <option value="1">Option 2</option>
                <option value="2">Option 3</option>
            </select>
            <button type="button" class="remove-question"><i class="fas fa-trash"></i> Supprimer</button>
        `;
        container.appendChild(questionDiv);
        questionDiv.querySelector('.remove-question').addEventListener('click', () => questionDiv.remove());
    });
    
    modal.querySelector('.close').addEventListener('click', () => modal.remove());
    document.getElementById('cancel-edit-quiz').addEventListener('click', () => modal.remove());
    
    document.querySelectorAll('#edit-questions-container .remove-question').forEach(btn => {
        btn.addEventListener('click', () => btn.closest('.question-item').remove());
    });
    
    document.getElementById('edit-quiz-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const courseId = parseInt(document.getElementById('edit-quiz-course').value);
        const title = document.getElementById('edit-quiz-title').value.trim();
        const questionItems = document.querySelectorAll('#edit-questions-container .question-item');
        
        if (!courseId || !title || questionItems.length === 0) {
            alert('Veuillez remplir tous les champs');
            return;
        }
        
        const updatedQuestions = [];
        questionItems.forEach(item => {
            const text = item.querySelector('.question-text').value;
            const options = [
                item.querySelectorAll('.option-input')[0]?.value,
                item.querySelectorAll('.option-input')[1]?.value,
                item.querySelectorAll('.option-input')[2]?.value
            ];
            const correct = parseInt(item.querySelector('.correct-answer').value);
            
            if (text && options.every(opt => opt) && !isNaN(correct)) {
                updatedQuestions.push({ text, options, correct });
            }
        });
        
        if (updatedQuestions.length === 0) {
            alert('Veuillez ajouter au moins une question valide');
            return;
        }
        
        quiz.courseId = courseId;
        quiz.title = title;
        quiz.questions = updatedQuestions;
        await saveQuiz(quiz);
        
        for (let learnerId in progress) {
            if (progress[learnerId].quizAttempts && progress[learnerId].quizAttempts[quizId]) {
                delete progress[learnerId].quizAttempts[quizId];
                await saveProgressForLearner(learnerId);
            }
        }
        
        renderQuizzes();
        loadLearnerDashboard();
        modal.remove();
        showAlert('Quiz modifié avec succès !', 'success');
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
};

window.deleteQuiz = async function(id) {
    if (!checkAdmin()) return;
    if (confirm('Supprimer ce quiz ?')) {
        quizzes = quizzes.filter(q => q.id !== id);
        await deleteQuizFromFirebase(id);
        renderQuizzes();
        loadLearnerDashboard();
        showAlert('Quiz supprimé', 'success');
    }
};

// ==================== TABLEAU DE BORD APPRENANT ====================
function loadLearnerDashboard() {
    const myCoursesDiv = document.getElementById('my-courses');
    const myQuizzesDiv = document.getElementById('my-quizzes');
    
    if (!currentUser || currentUser.role !== 'learner') {
        if (myCoursesDiv) myCoursesDiv.innerHTML = '<p style="text-align:center; color:#999;">Connectez-vous en tant qu\'apprenant</p>';
        return;
    }
    
    const learner = learners.find(l => l.id === currentUser.id);
    if (!learner) return;
    
    if (!progress[currentUser.id]) {
        progress[currentUser.id] = { completedCourses: [], quizAttempts: {}, certificateDelivered: false };
        saveProgressForLearner(currentUser.id);
    }
    
    checkAndShowCertificateAlert(currentUser.id);
    
    const totalCourses = learner.enrolledCourses.length;
    const completedCount = progress[currentUser.id]?.completedCourses.length || 0;
    const globalProgress = totalCourses > 0 ? (completedCount / totalCourses) * 100 : 0;
    
    const availableCourses = courses.filter(c => !learner.enrolledCourses.includes(c.id));
    const enrolledCourses = courses.filter(c => learner.enrolledCourses.includes(c.id));
    
    let coursesHtml = '';
    
    if (totalCourses > 0) {
        coursesHtml += `
            <div class="global-progress-card">
                <h3><i class="fas fa-chart-line"></i> Ma progression globale</h3>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${globalProgress}%">${Math.floor(globalProgress)}%</div>
                </div>
                <p>${completedCount}/${totalCourses} cours complétés</p>
                ${globalProgress >= 70 ? '<p style="color: #28a745; font-weight: bold;"><i class="fas fa-certificate"></i> Félicitations ! Vous êtes éligible au certificat !</p>' : ''}
            </div>
        `;
    }
    
    if (availableCourses.length > 0) {
        coursesHtml += '<h3><i class="fas fa-book-open"></i> Cours disponibles</h3><div class="cards-grid">';
        availableCourses.forEach(course => {
            coursesHtml += `
                <div class="card">
                    <h3>${escapeHtml(course.title)}</h3>
                    <p>${escapeHtml(course.description.substring(0, 100))}...</p>
                    <p><strong>Niveau :</strong> ${course.level}</p>
                    <a href="${course.videoUrl}" target="_blank" class="video-link"><i class="fas fa-play"></i> Voir la vidéo</a>
                    <button class="enroll-btn" onclick="enrollCourse(${currentUser.id}, ${course.id})"><i class="fas fa-sign-in-alt"></i> S'inscrire</button>
                </div>
            `;
        });
        coursesHtml += '</div>';
    }
    
    if (enrolledCourses.length > 0) {
        coursesHtml += '<h3><i class="fas fa-check-circle"></i> Mes cours suivis</h3><div class="cards-grid">';
        enrolledCourses.forEach(course => {
            const isCompleted = progress[currentUser.id]?.completedCourses.includes(course.id);
            coursesHtml += `
                <div class="card">
                    <h3>${escapeHtml(course.title)}</h3>
                    <p>${escapeHtml(course.description.substring(0, 100))}...</p>
                    <p><strong>Niveau :</strong> ${course.level}</p>
                    <a href="${course.videoUrl}" target="_blank" class="video-link"><i class="fas fa-play"></i> Voir la vidéo</a>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${isCompleted ? 100 : 0}%"></div>
                    </div>
                    <p>Statut: ${isCompleted ? '✅ Complété' : '🟡 En cours'}</p>
                    ${!isCompleted ? `<button class="complete-btn" onclick="markCourseCompleted(${currentUser.id}, ${course.id})"><i class="fas fa-check"></i> Marquer comme complété</button>` : ''}
                </div>
            `;
        });
        coursesHtml += '</div>';
    } else if (availableCourses.length > 0) {
        coursesHtml += '<p style="text-align:center; color:#999;">Vous n\'êtes inscrit à aucun cours. Inscrivez-vous ci-dessus !</p>';
    }
    
    myCoursesDiv.innerHTML = coursesHtml;
    
    const quizzesForLearner = quizzes.filter(q => learner.enrolledCourses.includes(q.courseId));
    let quizzesHtml = '<h3><i class="fas fa-puzzle-piece"></i> Mes quiz</h3>';
    
    if (quizzesForLearner.length === 0) {
        quizzesHtml += '<p style="text-align:center; color:#999;">Aucun quiz disponible pour vos cours.</p>';
    } else {
        quizzesHtml += '<div class="cards-grid">';
        quizzesForLearner.forEach(quiz => {
            const score = progress[currentUser.id]?.quizAttempts[quiz.id];
            const percentage = score ? (score.score / quiz.questions.length) * 100 : 0;
            const course = courses.find(c => c.id === quiz.courseId);
            quizzesHtml += `
                <div class="card">
                    <h3>${escapeHtml(quiz.title)}</h3>
                    <p><strong>Cours :</strong> ${course ? course.title : 'Cours'}</p>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percentage}%"></div>
                    </div>
                    <p>Meilleur score: ${score ? `${score.score}/${quiz.questions.length} (${Math.floor(percentage)}%)` : 'Non tenté'}</p>
                    <button class="quiz-btn" onclick="startQuiz(${currentUser.id}, ${quiz.id})"><i class="fas fa-play"></i> ${score ? 'Repasser' : 'Commencer'}</button>
                </div>
            `;
        });
        quizzesHtml += '</div>';
    }
    
    myQuizzesDiv.innerHTML = quizzesHtml;
}

window.enrollCourse = async function(learnerId, courseId) {
    if (!currentUser || currentUser.role !== 'learner') return;
    const learner = learners.find(l => l.id === learnerId);
    if (learner && !learner.enrolledCourses.includes(courseId)) {
        learner.enrolledCourses.push(courseId);
        await saveLearner(learner);
        if (!progress[learnerId]) {
            progress[learnerId] = { completedCourses: [], quizAttempts: {}, certificateDelivered: false };
            await saveProgressForLearner(learnerId);
        }
        showAlert('✅ Inscription au cours réussie !', 'success');
        loadLearnerDashboard();
    }
};

window.markCourseCompleted = async function(learnerId, courseId) {
    if (!currentUser || currentUser.role !== 'learner') return;
    if (!progress[learnerId]) {
        progress[learnerId] = { completedCourses: [], quizAttempts: {}, certificateDelivered: false };
    }
    if (!progress[learnerId].completedCourses.includes(courseId)) {
        progress[learnerId].completedCourses.push(courseId);
        await saveProgressForLearner(learnerId);
        showAlert('✅ Cours marqué comme complété !', 'success');
        loadLearnerDashboard();
    }
};

function checkAndShowCertificateAlert(learnerId) {
    const learner = learners.find(l => l.id == learnerId);
    if (!learner) return;
    
    const learnerProgress = progress[learnerId];
    if (!learnerProgress) return;
    
    const totalCourses = learner.enrolledCourses.length;
    const completedCount = learnerProgress.completedCourses.length;
    const globalProgress = totalCourses > 0 ? (completedCount / totalCourses) * 100 : 0;
    
    if (globalProgress >= 70 && totalCourses > 0 && !learnerProgress.certificateDelivered) {
        learnerProgress.certificateDelivered = true;
        learnerProgress.certificateDate = new Date().toISOString();
        saveProgressForLearner(learnerId);
        
        sendCertificateEmail(learner.email, learner.name);
        
        const alertDiv = document.getElementById('certificate-alert');
        alertDiv.innerHTML = `
            <div class="certificate-badge">
                <div class="badge-icon"><i class="fas fa-trophy"></i></div>
                <div class="badge-content">
                    <h3><i class="fas fa-certificate"></i> Félicitations !</h3>
                    <p>Vous avez obtenu votre certificat de réussite !</p>
                    <button onclick="generateCertificate(${learnerId})" class="certificate-download-btn"><i class="fas fa-download"></i> Télécharger mon certificat</button>
                    <button onclick="viewCertificate(${learnerId})" class="certificate-view-btn"><i class="fas fa-eye"></i> Voir mon certificat</button>
                </div>
            </div>
        `;
    } else if (globalProgress >= 70) {
        const alertDiv = document.getElementById('certificate-alert');
        if (!alertDiv.innerHTML.includes('certificate-badge')) {
            alertDiv.innerHTML = `
                <div class="certificate-badge">
                    <div class="badge-icon"><i class="fas fa-certificate"></i></div>
                    <div class="badge-content">
                        <h3>Mon certificat</h3>
                        <button onclick="generateCertificate(${learnerId})" class="certificate-download-btn"><i class="fas fa-download"></i> Télécharger mon certificat</button>
                        <button onclick="viewCertificate(${learnerId})" class="certificate-view-btn"><i class="fas fa-eye"></i> Voir mon certificat</button>
                    </div>
                </div>
            `;
        }
    }
}

function sendCertificateEmail(email, name) {
    console.log(`Email de certificat envoyé à ${email}: Félicitations ${name} !`);
    showAlert(`📧 Un email de félicitations a été envoyé à ${email} avec votre certificat`, 'success');
}

// ==================== QUIZ ====================
window.startQuiz = function(learnerId, quizId) {
    const quiz = quizzes.find(q => q.id === quizId);
    if (!quiz) return;
    
    const modal = document.getElementById('quiz-modal');
    document.getElementById('modal-quiz-title').innerHTML = `<i class="fas fa-question-circle"></i> ${quiz.title}`;
    
    let questionsHtml = '';
    quiz.questions.forEach((q, index) => {
        questionsHtml += `
            <div class="question-item">
                <p><strong>Question ${index + 1}:</strong> ${escapeHtml(q.text)}</p>
                ${q.options.map((opt, optIndex) => `
                    <label style="display: block; margin: 10px 0;">
                        <input type="radio" name="q${index}" value="${optIndex}">
                        ${escapeHtml(opt)}
                    </label>
                `).join('')}
            </div>
        `;
    });
    
    document.getElementById('modal-questions').innerHTML = questionsHtml;
    document.getElementById('modal-result').innerHTML = '';
    modal.style.display = 'block';
    
    document.getElementById('submit-quiz-modal').onclick = () => evaluateQuiz(learnerId, quizId);
};

async function evaluateQuiz(learnerId, quizId) {
    const quiz = quizzes.find(q => q.id === quizId);
    if (!quiz) return;
    
    let score = 0;
    quiz.questions.forEach((q, index) => {
        const selected = document.querySelector(`input[name="q${index}"]:checked`);
        if (selected && parseInt(selected.value) === q.correct) {
            score++;
        }
    });
    
    const percentage = (score / quiz.questions.length) * 100;
    const resultDiv = document.getElementById('modal-result');
    resultDiv.innerHTML = `<p style="font-weight:bold;">Score: ${score}/${quiz.questions.length} (${Math.floor(percentage)}%)</p>`;
    
    if (!progress[learnerId]) {
        progress[learnerId] = { completedCourses: [], quizAttempts: {}, certificateDelivered: false };
    }
    
    progress[learnerId].quizAttempts[quizId] = { score, percentage };
    await saveProgressForLearner(learnerId);
    
    if (percentage >= 70) {
        resultDiv.innerHTML += `<p style="color:green;"><i class="fas fa-check-circle"></i> Félicitations ! Quiz réussi !</p>`;
    } else {
        resultDiv.innerHTML += `<p style="color:orange;"><i class="fas fa-exclamation-triangle"></i> Score minimum requis : 70%</p>`;
    }
    
    setTimeout(() => {
        closeModal();
        if (currentUser && currentUser.id === learnerId) {
            loadLearnerDashboard();
        }
    }, 3000);
}

function closeModal() {
    document.getElementById('quiz-modal').style.display = 'none';
}

// ==================== CERTIFICAT ====================
function generateCertificate(learnerId) {
    const learner = learners.find(l => l.id == learnerId);
    if (!learner) return;
    
    const learnerProgress = progress[learnerId];
    if (!learnerProgress) return;
    
    const totalCourses = learner.enrolledCourses.length;
    const completedCoursesList = learnerProgress.completedCourses.map(courseId => {
        const course = courses.find(c => c.id === courseId);
        return course ? course.title : "Cours inconnu";
    });
    
    const globalProgress = totalCourses > 0 ? (completedCoursesList.length / totalCourses) * 100 : 0;
    
    if (globalProgress < 70) {
        alert(`⚠️ Progression insuffisante : ${globalProgress.toFixed(1)}% (minimum 70% requis)`);
        return;
    }
    
    const quizScores = [];
    quizzes.forEach(quiz => {
        if (learner.enrolledCourses.includes(quiz.courseId)) {
            const attempt = learnerProgress.quizAttempts[quiz.id];
            if (attempt) {
                const course = courses.find(c => c.id === quiz.courseId);
                quizScores.push({
                    quizTitle: quiz.title,
                    courseTitle: course ? course.title : "Cours",
                    score: attempt.score,
                    total: quiz.questions.length,
                    percentage: attempt.percentage
                });
            }
        }
    });
    
    const certHtml = generateCertificateHtml(learner, completedCoursesList, quizScores, globalProgress, learnerProgress);
    
    const certWindow = window.open('', '_blank');
    certWindow.document.write(certHtml);
    certWindow.document.close();
}

function generateCertificateHtml(learner, completedCourses, quizScores, globalProgress, learnerProgress) {
    return `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Certificat - ${learner.name}</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: 'Georgia', 'Times New Roman', serif;
                    background: #f0f0f0;
                    min-height: 100vh;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 40px;
                }
                .certificate {
                    max-width: 900px;
                    width: 100%;
                    background: white;
                    border-radius: 20px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.2);
                    overflow: hidden;
                }
                .certificate-header {
                    background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
                    color: white;
                    padding: 40px;
                    text-align: center;
                }
                .certificate-header h1 { font-size: 42px; margin-bottom: 10px; letter-spacing: 2px; }
                .certificate-header p { font-size: 18px; opacity: 0.9; }
                .certificate-body { padding: 50px; text-align: center; }
                .recipient-name {
                    font-size: 48px;
                    color: #1e3c72;
                    margin: 30px 0;
                    font-weight: bold;
                    border-bottom: 3px solid #1e3c72;
                    display: inline-block;
                    padding-bottom: 10px;
                }
                .congrats { font-size: 24px; color: #333; margin: 20px 0; }
                .completion-text { font-size: 18px; color: #666; line-height: 1.6; margin: 30px 0; }
                .course-list {
                    background: #f8f9fa;
                    border-radius: 15px;
                    padding: 25px;
                    margin: 30px 0;
                    text-align: left;
                }
                .course-list h3 { color: #1e3c72; margin-bottom: 15px; }
                .course-list ul { list-style: none; padding-left: 0; }
                .course-list li { padding: 8px 0; border-bottom: 1px solid #e0e0e0; }
                .course-list li:before { content: "✓ "; color: #28a745; font-weight: bold; margin-right: 10px; }
                .quiz-scores { margin: 30px 0; text-align: left; }
                .quiz-scores h3 { color: #1e3c72; margin-bottom: 15px; }
                .score-item {
                    margin-bottom: 15px;
                    padding: 12px;
                    background: #f8f9fa;
                    border-radius: 10px;
                }
                .progress-indicator { margin: 30px 0; text-align: center; }
                .progress-circle {
                    width: 120px;
                    height: 120px;
                    border-radius: 50%;
                    background: conic-gradient(#1e3c72 0% ${globalProgress}%, #e0e0e0 ${globalProgress}% 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto;
                }
                .progress-circle span {
                    background: white;
                    width: 100px;
                    height: 100px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    font-weight: bold;
                    color: #1e3c72;
                }
                .certificate-footer {
                    background: #f8f9fa;
                    padding: 30px;
                    text-align: center;
                    border-top: 1px solid #e0e0e0;
                }
                .signature { margin-top: 20px; }
                .signature-line { 
                    width: 200px; 
                    height: 2px; 
                    background: #333; 
                    margin: 10px auto; 
                }
                .date { color: #999; margin-top: 20px; }
                @media print {
                    body { background: white; padding: 0; }
                    .certificate { box-shadow: none; border-radius: 0; }
                    button { display: none; }
                }
                button {
                    background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
                    color: white;
                    border: none;
                    padding: 12px 30px;
                    border-radius: 30px;
                    font-size: 16px;
                    cursor: pointer;
                    margin: 10px;
                }
                button:hover { transform: translateY(-2px); }
            </style>
        </head>
        <body>
            <div class="certificate">
                <div class="certificate-header">
                    <h1>🎓 CERTIFICAT DE RÉUSSITE</h1>
                    <p>E-Learning Pro - Formation en ligne</p>
                </div>
                <div class="certificate-body">
                    <p class="congrats">Ce certificat est décerné à</p>
                    <div class="recipient-name">${escapeHtml(learner.name)}</div>
                    <div class="completion-text">
                        Pour avoir complété avec succès sa formation sur la plateforme E-Learning Pro,
                        démontrant ainsi son engagement et sa maîtrise des compétences acquises.
                    </div>
                    <div class="progress-indicator">
                        <div class="progress-circle">
                            <span>${Math.floor(globalProgress)}%</span>
                        </div>
                        <p style="margin-top: 10px;">Taux de complétion de la formation</p>
                    </div>
                    <div class="course-list">
                        <h3>📚 Cours complétés (${completedCourses.length}/${learner.enrolledCourses.length})</h3>
                        <ul>
                            ${completedCourses.map(title => `<li>${escapeHtml(title)}</li>`).join('')}
                        </ul>
                    </div>
                    ${quizScores.length > 0 ? `
                    <div class="quiz-scores">
                        <h3>📝 Résultats des quiz</h3>
                        ${quizScores.map(qs => `
                            <div class="score-item">
                                <strong>${escapeHtml(qs.quizTitle)}</strong> (${escapeHtml(qs.courseTitle)})<br>
                                Score: ${qs.score}/${qs.total} (${Math.floor(qs.percentage)}%)
                                <div style="width: 100%; height: 6px; background: #e0e0e0; border-radius: 3px; margin-top: 5px;">
                                    <div style="width: ${qs.percentage}%; height: 100%; background: #28a745; border-radius: 3px;"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    ` : ''}
                </div>
                <div class="certificate-footer">
                    <div class="signature">
                        <div>MILLOGO S. Yves Stéphane</div>
                        <div class="signature-line"></div>
                        <div>Directeur Pédagogique</div>
                    </div>
                    <div class="date">
                        Délivré le ${new Date(learnerProgress.certificateDate || new Date()).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                        })}
                    </div>
                    <div>
                        <button onclick="window.print()"><i class="fas fa-print"></i> Imprimer / PDF</button>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;
}

window.viewCertificate = function(learnerId) {
    generateCertificate(learnerId);
};

function viewAdminCertificate() {
    const learnerId = document.getElementById('certificate-learner').value;
    if (learnerId) {
        generateCertificate(learnerId);
    } else {
        alert('Veuillez sélectionner un apprenant');
    }
}

function downloadAdminCertificate() {
    const learnerId = document.getElementById('certificate-learner').value;
    if (learnerId) {
        generateCertificate(learnerId);
    } else {
        alert('Veuillez sélectionner un apprenant');
    }
}

function previewCertificate(learnerId) {
    const learner = learners.find(l => l.id == learnerId);
    if (!learner) return;
    
    const learnerProgress = progress[learnerId];
    if (!learnerProgress) return;
    
    const totalCourses = learner.enrolledCourses.length;
    const completedCount = learnerProgress.completedCourses.length;
    const globalProgress = totalCourses > 0 ? (completedCount / totalCourses) * 100 : 0;
    
    const previewDiv = document.getElementById('certificate-preview');
    if (globalProgress >= 70) {
        previewDiv.innerHTML = `
            <div class="global-progress-card" style="margin-top: 20px;">
                <h3><i class="fas fa-certificate"></i> Éligible au certificat</h3>
                <p>Progression: ${Math.floor(globalProgress)}%</p>
                <p>${completedCount}/${totalCourses} cours complétés</p>
                <button onclick="generateCertificate(${learnerId})" class="btn-primary"><i class="fas fa-download"></i> Télécharger le certificat</button>
                <button onclick="viewCertificate(${learnerId})" class="btn-secondary"><i class="fas fa-eye"></i> Voir le certificat</button>
            </div>
        `;
    } else {
        previewDiv.innerHTML = `
            <div class="global-progress-card" style="margin-top: 20px;">
                <h3><i class="fas fa-clock"></i> Non éligible au certificat</h3>
                <p>Progression: ${Math.floor(globalProgress)}% (70% requis)</p>
                <p>${completedCount}/${totalCourses} cours complétés</p>
                <p>Encore ${Math.ceil((70 - globalProgress) / 100 * totalCourses)} cours à compléter</p>
            </div>
        `;
    }
}

// ==================== MESSAGES ====================
function updateMessageRecipients() {
    const select = document.getElementById('message-recipient');
    if (!select) return;
    
    if (currentUser.role === 'admin') {
        select.innerHTML = '<option value="">Sélectionner un destinataire</option>' + 
            learners.map(l => `<option value="${l.id}">${escapeHtml(l.name)} (${escapeHtml(l.email)})</option>`).join('');
    } else {
        select.innerHTML = '<option value="admin">Administrateur</option>';
    }
}

async function sendMessage(e) {
    e.preventDefault();
    
    const recipientId = document.getElementById('message-recipient').value;
    const subject = document.getElementById('message-subject').value.trim();
    const content = document.getElementById('message-content').value.trim();
    
    if (!recipientId || !subject || !content) {
        alert('Veuillez remplir tous les champs');
        return;
    }
    
    const message = {
        id: Date.now(),
        fromId: currentUser.id,
        fromName: currentUser.name,
        toId: recipientId,
        subject,
        content,
        date: new Date().toISOString(),
        read: false
    };
    
    messages.push(message);
    await saveMessage(message);
    
    document.getElementById('message-form').reset();
    loadMessages();
    showAlert('Message envoyé avec succès', 'success');
}

function loadMessages() {
    const container = document.getElementById('messages-list');
    if (!container) return;
    
    let userMessages;
    if (currentUser.role === 'admin') {
        userMessages = messages.filter(m => m.toId === 'admin' || m.fromId === 'admin');
    } else {
        userMessages = messages.filter(m => m.toId == currentUser.id || m.fromId == currentUser.id);
    }
    
    userMessages.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (userMessages.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#999;">Aucun message</p>';
        return;
    }
    
    container.innerHTML = userMessages.map(msg => {
        const isFromMe = msg.fromId == currentUser.id;
        const recipientName = isFromMe ? 
            (msg.toId === 'admin' ? 'Administrateur' : (learners.find(l => l.id == msg.toId)?.name || 'Inconnu')) :
            msg.fromName;
        
        return `
            <div class="message-item" onclick="viewMessage(${msg.id})">
                <h4><i class="fas fa-envelope"></i> ${escapeHtml(msg.subject)}</h4>
                <p><strong>${isFromMe ? 'À' : 'De'}:</strong> ${escapeHtml(recipientName)}</p>
                <p>${escapeHtml(msg.content.substring(0, 100))}${msg.content.length > 100 ? '...' : ''}</p>
                <div class="message-date"><i class="fas fa-clock"></i> ${new Date(msg.date).toLocaleString('fr-FR')}</div>
                <span class="message-status ${msg.read ? 'read' : 'unread'}">${msg.read ? 'Lu' : 'Non lu'}</span>
            </div>
        `;
    }).join('');
}

window.viewMessage = async function(messageId) {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;
    
    if (!message.read && message.toId == currentUser.id) {
        message.read = true;
        await saveMessage(message);
        loadMessages();
    }
    
    alert(`Sujet: ${message.subject}\n\nDe: ${message.fromName}\n\nMessage:\n${message.content}`);
};

// ==================== SUIVI GLOBAL ====================
function updateTrackingSelect() {
    const select = document.getElementById('tracking-learner');
    if (!select) return;
    select.innerHTML = '<option value="">Sélectionner un apprenant</option>' + 
        learners.map(l => `<option value="${l.id}">${escapeHtml(l.name)}</option>`).join('');
}

function updateCertificateSelect() {
    const select = document.getElementById('certificate-learner');
    if (!select) return;
    select.innerHTML = '<option value="">Sélectionner un apprenant</option>' + 
        learners.map(l => `<option value="${l.id}">${escapeHtml(l.name)}</option>`).join('');
}

function showTracking(learnerId) {
    if (!checkAdmin()) return;
    if (!learnerId) {
        document.getElementById('tracking-info').innerHTML = '';
        return;
    }
    
    const learner = learners.find(l => l.id == learnerId);
    if (!learner) return;
    
    if (!progress[learnerId]) {
        progress[learnerId] = { completedCourses: [], quizAttempts: {}, certificateDelivered: false };
    }
    
    const learnerProgress = progress[learnerId];
    const totalCourses = learner.enrolledCourses.length;
    const completedCount = learnerProgress.completedCourses.length;
    const globalProgress = totalCourses > 0 ? (completedCount / totalCourses) * 100 : 0;
    
    let html = `<h2>${escapeHtml(learner.name)}</h2>`;
    html += `<div class="global-progress-card"><h4>Progression globale</h4>`;
    html += `<div class="progress-bar"><div class="progress-fill" style="width: ${globalProgress}%">${Math.floor(globalProgress)}%</div></div>`;
    html += `<p>${completedCount}/${totalCourses} cours complétés</p>`;
    if (globalProgress >= 70) {
        html += `<p style="color: #28a745;"><i class="fas fa-certificate"></i> Certificat éligible</p>`;
    }
    html += `</div>`;
    
    html += `<h3>📚 Cours suivis</h3>`;
    if (learner.enrolledCourses.length === 0) {
        html += `<p>Aucun cours suivi.</p>`;
    } else {
        html += `<div class="cards-grid">`;
        learner.enrolledCourses.forEach(courseId => {
            const course = courses.find(c => c.id === courseId);
            if (course) {
                const isCompleted = learnerProgress.completedCourses.includes(courseId);
                html += `
                    <div class="card">
                        <h5>${escapeHtml(course.title)}</h5>
                        <p>Niveau: ${course.level}</p>
                        <div class="progress-bar"><div class="progress-fill" style="width: ${isCompleted ? 100 : 0}%"></div></div>
                        <p>Statut: ${isCompleted ? '✅ Complété' : '🟡 En cours'}</p>
                    </div>
                `;
            }
        });
        html += `</div>`;
    }
    
    html += `<h3>📝 Scores des quiz</h3>`;
    const quizzesForLearner = quizzes.filter(q => learner.enrolledCourses.includes(q.courseId));
    if (quizzesForLearner.length === 0) {
        html += `<p>Aucun quiz disponible.</p>`;
    } else {
        html += `<div class="cards-grid">`;
        quizzesForLearner.forEach(quiz => {
            const score = learnerProgress.quizAttempts[quiz.id];
            const percentage = score ? (score.score / quiz.questions.length) * 100 : 0;
            const course = courses.find(c => c.id === quiz.courseId);
            html += `
                <div class="card">
                    <h5>${escapeHtml(quiz.title)}</h5>
                    <p><strong>Cours :</strong> ${course ? course.title : 'Cours'}</p>
                    <div class="progress-bar"><div class="progress-fill" style="width: ${percentage}%"></div></div>
                    <p>Score: ${score ? `${score.score}/${quiz.questions.length} (${Math.floor(percentage)}%)` : 'Non tenté'}</p>
                </div>
            `;
        });
        html += `</div>`;
    }
    
    document.getElementById('tracking-info').innerHTML = html;
}

// ==================== UTILITAIRES ====================
function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `${tab}-tab`);
    });
    
    if (tab === 'tracking' && currentUser && currentUser.role === 'admin') {
        updateTrackingSelect();
    }
    if (tab === 'certificates' && currentUser && currentUser.role === 'admin') {
        updateCertificateSelect();
    }
    if (tab === 'messages') {
        loadMessages();
        updateMessageRecipients();
    }
}

function updateCourseSelects() {
    const quizCourseSelect = document.getElementById('quiz-course');
    if (quizCourseSelect) {
        quizCourseSelect.innerHTML = '<option value="">Sélectionner un cours</option>' + 
            courses.map(c => `<option value="${c.id}">${escapeHtml(c.title)}</option>`).join('');
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Démarrer l'application
init();
