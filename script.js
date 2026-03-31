// ==================== STRUCTURES DE DONNÉES ====================
let learners = JSON.parse(localStorage.getItem('learners')) || [];
let courses = JSON.parse(localStorage.getItem('courses')) || [];
let quizzes = JSON.parse(localStorage.getItem('quizzes')) || [];
let progress = JSON.parse(localStorage.getItem('progress')) || {};
let currentUser = null;

// Compte admin prédéfini
const ADMIN_USERNAME = "54128536";
const ADMIN_PASSWORD = "Steffmilli00";

// ==================== INITIALISATION ====================
function init() {
    // Charger les données
    learners = JSON.parse(localStorage.getItem('learners')) || [];
    courses = JSON.parse(localStorage.getItem('courses')) || [];
    quizzes = JSON.parse(localStorage.getItem('quizzes')) || [];
    progress = JSON.parse(localStorage.getItem('progress')) || {};
    
    // Ajouter un cours de démonstration si aucun cours n'existe
    if (courses.length === 0) {
        courses.push({
            id: Date.now(),
            title: "Introduction à JavaScript",
            description: "Apprenez les bases de JavaScript, le langage de programmation du web.",
            videoUrl: "https://www.youtube.com/watch?v=hdI2bqOjy3c",
            level: "Débutant"
        });
        localStorage.setItem('courses', JSON.stringify(courses));
    }
    
    // Vérifier si l'utilisateur est déjà connecté
    const savedSession = localStorage.getItem('currentUser');
    if (savedSession) {
        try {
            currentUser = JSON.parse(savedSession);
            if (currentUser.role === 'admin') {
                loginSuccess(currentUser);
            } else {
                const learnerExists = learners.find(l => l.id === currentUser.id);
                if (learnerExists) {
                    loginSuccess(currentUser);
                } else {
                    localStorage.removeItem('currentUser');
                    showLoginScreen();
                }
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
    
    // Afficher les infos utilisateur
    document.getElementById('user-name-display').textContent = user.name;
    const roleBadge = document.getElementById('user-role-badge');
    if (user.role === 'admin') {
        roleBadge.textContent = 'MILLOGO Sèko Yves Stéphane';
        roleBadge.className = 'role-badge admin';
    } else {
        roleBadge.textContent ='Apprenant';
        roleBadge.className = 'role-badge learner';
    }
    
    // Masquer/afficher les onglets admin
    const adminTabs = document.querySelectorAll('.admin-only');
    if (user.role === 'admin') {
        adminTabs.forEach(tab => tab.classList.remove('hidden'));
    } else {
        adminTabs.forEach(tab => tab.classList.add('hidden'));
        // Rediriger vers le dashboard si l'apprenant essaie d'aller ailleurs
        switchTab('dashboard');
    }
    
    // Charger les données
    renderLearners();
    renderCourses();
    renderQuizzes();
    updateCourseSelects();
    loadLearnerDashboard();
    updateTrackingSelect();
}

function setupEventListeners() {
    // Onglets de connexion/inscription
    document.querySelectorAll('.login-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchLoginTab(btn.dataset.loginTab));
    });
    
    // Formulaire de connexion
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Formulaire d'inscription
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Déconnexion
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Onglets principaux
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Formulaires admin
    const learnerForm = document.getElementById('learner-form');
    if (learnerForm) learnerForm.addEventListener('submit', addLearner);
    
    const courseForm = document.getElementById('course-form');
    if (courseForm) courseForm.addEventListener('submit', addCourse);
    
    const quizForm = document.getElementById('quiz-form');
    if (quizForm) quizForm.addEventListener('submit', addQuiz);
    
    const addQuestionBtn = document.getElementById('add-question');
    if (addQuestionBtn) addQuestionBtn.addEventListener('click', addQuestion);
    
    // Recherches
    const learnerSearch = document.getElementById('learner-search');
    if (learnerSearch) learnerSearch.addEventListener('input', (e) => renderLearners(e.target.value));
    
    const courseSearch = document.getElementById('course-search');
    if (courseSearch) courseSearch.addEventListener('input', (e) => renderCourses(e.target.value));
    
    // Suivi
    const trackingLearner = document.getElementById('tracking-learner');
    if (trackingLearner) trackingLearner.addEventListener('change', (e) => showTracking(e.target.value));
    
    // Modal
    const closeBtn = document.querySelector('.close');
    if (closeBtn) closeBtn.addEventListener('click', () => closeModal());
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('quiz-modal');
        if (e.target === modal) closeModal();
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
    
    // Vérifier admin
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        loginSuccess({
            id: 'admin',
            name: 'Administrateur',
            username: ADMIN_USERNAME,
            role: 'admin'
        });
        errorDiv.textContent = '';
        return;
    }
    
    // Vérifier apprenant
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

function handleRegister(e) {
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
    
    // Vérifier si le nom d'utilisateur existe déjà
    if (learners.find(l => l.username === username)) {
        errorDiv.textContent = 'Ce nom d\'utilisateur existe déjà';
        return;
    }
    
    // Vérifier si c'est le compte admin
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
    localStorage.setItem('learners', JSON.stringify(learners));
    
    // Initialiser la progression
    progress[learner.id] = { completedCourses: [], quizAttempts: {} };
    localStorage.setItem('progress', JSON.stringify(progress));
    
    errorDiv.textContent = '';
    errorDiv.className = 'success-message';
    errorDiv.textContent = '✅ Compte créé avec succès ! Vous pouvez maintenant vous connecter.';
    
    // Réinitialiser le formulaire
    document.getElementById('register-form').reset();
    
    // Basculer vers l'onglet de connexion après 2 secondes
    setTimeout(() => {
        switchLoginTab('login');
        errorDiv.textContent = '';
        errorDiv.className = 'error-message';
    }, 2000);
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    showLoginScreen();
    document.getElementById('login-form').reset();
    document.getElementById('register-form').reset();
}

// ==================== VÉRIFICATION DES DROITS ====================
function checkAdmin() {
    if (!currentUser || currentUser.role !== 'admin') {
        showAlert('Accès refusé. Seul l\'administrateur peut effectuer cette action.', 'error');
        return false;
    }
    return true;
}

function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert-message ${type}`;
    alertDiv.textContent = message;
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}

// ==================== GESTION DES APPRENANTS (Admin uniquement) ====================
function addLearner(e) {
    e.preventDefault();
    if (!checkAdmin()) return;
    
    const name = document.getElementById('learner-name').value.trim();
    const username = document.getElementById('learner-username').value.trim();
    const password = document.getElementById('learner-password').value;
    const email = document.getElementById('learner-email').value.trim();
    const phone = document.getElementById('learner-phone').value.trim();
    
    if (!name || !username || !password || !email) {
        alert('Les champs nom, nom d\'utilisateur, mot de passe et email sont obligatoires');
        return;
    }
    
    // Vérifier si le nom d'utilisateur existe déjà
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
    localStorage.setItem('learners', JSON.stringify(learners));
    
    // Initialiser la progression
    progress[learner.id] = { completedCourses: [], quizAttempts: {} };
    localStorage.setItem('progress', JSON.stringify(progress));
    
    renderLearners();
    document.getElementById('learner-form').reset();
    updateTrackingSelect();
    showAlert('Apprenant ajouté avec succès', 'success');
}

function renderLearners(searchTerm = '') {
    const container = document.getElementById('learners-list');
    if (!container) return;
    
    const searchInput = document.getElementById('learner-search');
    const term = searchTerm || (searchInput ? searchInput.value.toLowerCase() : '');
    
    const filtered = learners.filter(l => 
        l.name.toLowerCase().includes(term) || 
        l.email.toLowerCase().includes(term) ||
        l.username.toLowerCase().includes(term)
    );
    
    if (filtered.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#999;">Aucun apprenant trouvé</p>';
        return;
    }
    
    // Seul l'admin peut voir les boutons de modification/suppression
    const isAdmin = currentUser && currentUser.role === 'admin';
    
    container.innerHTML = filtered.map(learner => `
        <div class="card">
            <h3>${escapeHtml(learner.name)}</h3>
            <p>👤 ${escapeHtml(learner.username)}</p>
            <p>📧 ${escapeHtml(learner.email)}</p>
            <p>📞 ${escapeHtml(learner.phone) || 'Non renseigné'}</p>
            ${isAdmin ? `
            <div class="card-actions">
                <button class="edit-btn" onclick="editLearner(${learner.id})">✏️ Modifier</button>
                <button class="delete-btn" onclick="deleteLearner(${learner.id})">🗑️ Supprimer</button>
            </div>
            ` : ''}
        </div>
    `).join('');
}

window.editLearner = function(id) {
    if (!checkAdmin()) return;
    
    const learner = learners.find(l => l.id === id);
    if (!learner) return;
    
    const newName = prompt('Nouveau nom :', learner.name);
    const newUsername = prompt('Nouveau nom d\'utilisateur :', learner.username);
    const newPassword = prompt('Nouveau mot de passe :', learner.password);
    const newEmail = prompt('Nouvel email :', learner.email);
    const newPhone = prompt('Nouveau téléphone :', learner.phone);
    
    if (newName && newUsername && newPassword && newEmail) {
        if (newUsername !== learner.username && learners.find(l => l.username === newUsername)) {
            alert('Ce nom d\'utilisateur est déjà utilisé');
            return;
        }
        learner.name = newName;
        learner.username = newUsername;
        learner.password = newPassword;
        learner.email = newEmail;
        learner.phone = newPhone;
        localStorage.setItem('learners', JSON.stringify(learners));
        renderLearners();
        updateTrackingSelect();
        showAlert('Apprenant modifié avec succès', 'success');
    }
};

window.deleteLearner = function(id) {
    if (!checkAdmin()) return;
    
    if (confirm('Supprimer cet apprenant ? Cette action est irréversible.')) {
        learners = learners.filter(l => l.id !== id);
        delete progress[id];
        localStorage.setItem('learners', JSON.stringify(learners));
        localStorage.setItem('progress', JSON.stringify(progress));
        renderLearners();
        updateTrackingSelect();
        showAlert('Apprenant supprimé avec succès', 'success');
    }
};

// ==================== GESTION DES COURS (Admin uniquement) ====================
function addCourse(e) {
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
    localStorage.setItem('courses', JSON.stringify(courses));
    renderCourses();
    updateCourseSelects();
    document.getElementById('course-form').reset();
    loadLearnerDashboard();
    showAlert('Cours ajouté avec succès', 'success');
}

function renderCourses(searchTerm = '') {
    const container = document.getElementById('courses-list');
    if (!container) return;
    
    const searchInput = document.getElementById('course-search');
    const term = searchTerm || (searchInput ? searchInput.value.toLowerCase() : '');
    
    const filtered = courses.filter(c => 
        c.title.toLowerCase().includes(term) || 
        c.description.toLowerCase().includes(term)
    );
    
    if (filtered.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#999;">Aucun cours trouvé</p>';
        return;
    }
    
    const isAdmin = currentUser && currentUser.role === 'admin';
    
    container.innerHTML = filtered.map(course => `
        <div class="card">
            <h3>${escapeHtml(course.title)}</h3>
            <p>${escapeHtml(course.description.substring(0, 100))}...</p>
            <p><strong>Niveau :</strong> ${course.level}</p>
            <p><strong>Vidéo :</strong> <a href="${course.videoUrl}" target="_blank">Lien</a></p>
            ${isAdmin ? `
            <div class="card-actions">
                <button class="edit-btn" onclick="editCourse(${course.id})">✏️ Modifier</button>
                <button class="delete-btn" onclick="deleteCourse(${course.id})">🗑️ Supprimer</button>
            </div>
            ` : ''}
        </div>
    `).join('');
}

window.editCourse = function(id) {
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
        localStorage.setItem('courses', JSON.stringify(courses));
        renderCourses();
        updateCourseSelects();
        loadLearnerDashboard();
        showAlert('Cours modifié avec succès', 'success');
    }
};

window.deleteCourse = function(id) {
    if (!checkAdmin()) return;
    
    if (confirm('Supprimer ce cours ?')) {
        courses = courses.filter(c => c.id !== id);
        localStorage.setItem('courses', JSON.stringify(courses));
        renderCourses();
        updateCourseSelects();
        loadLearnerDashboard();
        showAlert('Cours supprimé avec succès', 'success');
    }
};

// ==================== GESTION DES QUIZ (Admin uniquement) ====================
function addQuestion() {
    if (!checkAdmin()) return;
    
    const container = document.getElementById('questions-container');
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-item';
    questionDiv.innerHTML = `
        <input type="text" placeholder="Question" class="question-text" required>
        <input type="text" placeholder="Option 1" class="option-input" required>
        <input type="text" placeholder="Option 2" class="option-input" required>
        <input type="text" placeholder="Option 3" class="option-input" required>
        <select class="correct-answer" required>
            <option value="">Bonne réponse</option>
            <option value="0">Option 1</option>
            <option value="1">Option 2</option>
            <option value="2">Option 3</option>
        </select>
        <button type="button" class="remove-question">❌ Supprimer</button>
    `;
    container.appendChild(questionDiv);
    
    questionDiv.querySelector('.remove-question').addEventListener('click', () => {
        questionDiv.remove();
    });
}

function addQuiz(e) {
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
            item.querySelectorAll('.option-input')[0].value,
            item.querySelectorAll('.option-input')[1].value,
            item.querySelectorAll('.option-input')[2].value
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
    localStorage.setItem('quizzes', JSON.stringify(quizzes));
    renderQuizzes();
    document.getElementById('quiz-form').reset();
    document.getElementById('questions-container').innerHTML = `
        <div class="question-item">
            <input type="text" placeholder="Question 1" class="question-text" required>
            <input type="text" placeholder="Option 1" class="option-input" required>
            <input type="text" placeholder="Option 2" class="option-input" required>
            <input type="text" placeholder="Option 3" class="option-input" required>
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
    
    const isAdmin = currentUser && currentUser.role === 'admin';
    
    container.innerHTML = quizzes.map(quiz => {
        const course = courses.find(c => c.id === quiz.courseId);
        return `
            <div class="card">
                <h3>${escapeHtml(quiz.title)}</h3>
                <p><strong>Cours :</strong> ${course ? course.title : 'Cours supprimé'}</p>
                <p><strong>Questions :</strong> ${quiz.questions.length}</p>
                ${isAdmin ? `
                <div class="card-actions">
                    <button class="delete-btn" onclick="deleteQuiz(${quiz.id})">🗑️ Supprimer</button>
                </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

window.deleteQuiz = function(id) {
    if (!checkAdmin()) return;
    
    if (confirm('Supprimer ce quiz ?')) {
        quizzes = quizzes.filter(q => q.id !== id);
        localStorage.setItem('quizzes', JSON.stringify(quizzes));
        renderQuizzes();
        loadLearnerDashboard();
        showAlert('Quiz supprimé avec succès', 'success');
    }
};

// ==================== TABLEAU DE BORD APPRENANT ====================
function loadLearnerDashboard() {
    const myCoursesDiv = document.getElementById('my-courses');
    const myQuizzesDiv = document.getElementById('my-quizzes');
    
    if (!currentUser || currentUser.role !== 'learner') {
        if (myCoursesDiv) myCoursesDiv.innerHTML = '<p style="text-align:center; color:#999;">Connectez-vous en tant qu\'apprenant pour voir votre tableau de bord</p>';
        if (myQuizzesDiv) myQuizzesDiv.innerHTML = '';
        return;
    }
    
    const learner = learners.find(l => l.id === currentUser.id);
    if (!learner) return;
    
    // Initialiser progress si nécessaire
    if (!progress[currentUser.id]) {
        progress[currentUser.id] = { completedCourses: [], quizAttempts: {} };
        localStorage.setItem('progress', JSON.stringify(progress));
    }
    
    // Vérifier le certificat
    checkAndShowCertificate(currentUser.id);
    
    const totalCourses = learner.enrolledCourses.length;
    const completedCount = progress[currentUser.id]?.completedCourses.length || 0;
    const globalProgress = totalCourses > 0 ? (completedCount / totalCourses) * 100 : 0;
    
    // Cours disponibles et suivis
    const availableCourses = courses.filter(c => !learner.enrolledCourses.includes(c.id));
    const enrolledCourses = courses.filter(c => learner.enrolledCourses.includes(c.id));
    
    let coursesHtml = '';
    
    // Barre de progression globale
    if (totalCourses > 0) {
        coursesHtml += `
            <div class="global-progress-card">
                <h3>📊 Ma progression globale</h3>
                <div class="progress-bar" style="height: 20px;">
                    <div class="progress-fill" style="width: ${globalProgress}%; height: 100%; line-height: 20px; text-align: center; color: white; font-size: 12px;">
                        ${Math.floor(globalProgress)}%
                    </div>
                </div>
                <p>${completedCount}/${totalCourses} cours complétés</p>
                ${globalProgress >= 70 ? '<p style="color: #28a745; font-weight: bold;">🎓 Félicitations ! Vous êtes éligible au certificat !</p>' : `<p>Encore ${Math.ceil((70 - globalProgress) / 100 * totalCourses)} cours à compléter pour obtenir le certificat</p>`}
            </div>
        `;
    }
    
    // Cours disponibles à l'inscription
    if (availableCourses.length > 0) {
        coursesHtml += '<h3>📖 Cours disponibles</h3><div class="cards-grid">';
        availableCourses.forEach(course => {
            coursesHtml += `
                <div class="card">
                    <h3>${escapeHtml(course.title)}</h3>
                    <p>${escapeHtml(course.description.substring(0, 100))}...</p>
                    <p><strong>Niveau :</strong> ${course.level}</p>
                    <a href="${course.videoUrl}" target="_blank" class="video-link">▶️ Voir la vidéo</a>
                    <button class="enroll-btn" onclick="enrollCourse(${currentUser.id}, ${course.id})">📚 S'inscrire à ce cours</button>
                </div>
            `;
        });
        coursesHtml += '</div>';
    }
    
    // Cours suivis
    if (enrolledCourses.length > 0) {
        coursesHtml += '<h3>✅ Mes cours suivis</h3><div class="cards-grid">';
        enrolledCourses.forEach(course => {
            const isCompleted = progress[currentUser.id]?.completedCourses.includes(course.id);
            coursesHtml += `
                <div class="card">
                    <h3>${escapeHtml(course.title)}</h3>
                    <p>${escapeHtml(course.description.substring(0, 100))}...</p>
                    <p><strong>Niveau :</strong> ${course.level}</p>
                    <a href="${course.videoUrl}" target="_blank" class="video-link">▶️ Voir la vidéo</a>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${isCompleted ? 100 : 0}%"></div>
                    </div>
                    <p>Statut: ${isCompleted ? '✅ Complété' : '🟡 En cours'}</p>
                    ${!isCompleted ? `<button class="complete-btn" onclick="markCourseCompleted(${currentUser.id}, ${course.id})">✅ Marquer comme complété</button>` : ''}
                </div>
            `;
        });
        coursesHtml += '</div>';
    } else if (totalCourses === 0 && availableCourses.length > 0) {
        coursesHtml += '<p style="text-align:center; color:#999;">Vous n\'êtes inscrit à aucun cours. Inscrivez-vous ci-dessus !</p>';
    }
    
    if (myCoursesDiv) myCoursesDiv.innerHTML = coursesHtml;
    
    // Quiz
    const quizzesForLearner = quizzes.filter(q => learner.enrolledCourses.includes(q.courseId));
    let quizzesHtml = '<h3>📝 Mes quiz</h3>';
    
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
                    <button class="quiz-btn" onclick="startQuiz(${currentUser.id}, ${quiz.id})">${score ? '🔄 Repasser le quiz' : '🎯 Commencer le quiz'}</button>
                </div>
            `;
        });
        quizzesHtml += '</div>';
    }
    
    if (myQuizzesDiv) myQuizzesDiv.innerHTML = quizzesHtml;
}

// ==================== ACTIONS APPRENANT ====================
window.enrollCourse = function(learnerId, courseId) {
    if (!currentUser || currentUser.role !== 'learner') return;
    
    const learner = learners.find(l => l.id === learnerId);
    if (learner && !learner.enrolledCourses.includes(courseId)) {
        learner.enrolledCourses.push(courseId);
        localStorage.setItem('learners', JSON.stringify(learners));
        
        if (!progress[learnerId]) {
            progress[learnerId] = { completedCourses: [], quizAttempts: {} };
            localStorage.setItem('progress', JSON.stringify(progress));
        }
        
        showAlert('✅ Inscription au cours réussie !', 'success');
        loadLearnerDashboard();
        if (currentUser.role === 'admin' && document.getElementById('tracking-learner')?.value == learnerId) {
            showTracking(learnerId);
        }
    }
};

window.markCourseCompleted = function(learnerId, courseId) {
    if (!currentUser || currentUser.role !== 'learner') return;
    
    if (!progress[learnerId]) {
        progress[learnerId] = { completedCourses: [], quizAttempts: {} };
    }
    
    if (!progress[learnerId].completedCourses.includes(courseId)) {
        progress[learnerId].completedCourses.push(courseId);
        localStorage.setItem('progress', JSON.stringify(progress));
        showAlert('✅ Cours marqué comme complété !', 'success');
        loadLearnerDashboard();
        
        if (currentUser.role === 'admin' && document.getElementById('tracking-learner')?.value == learnerId) {
            showTracking(learnerId);
        }
    }
};

// ==================== QUIZ ====================
window.startQuiz = function(learnerId, quizId) {
    const quiz = quizzes.find(q => q.id === quizId);
    if (!quiz) return;
    
    const modal = document.getElementById('quiz-modal');
    document.getElementById('modal-quiz-title').textContent = quiz.title;
    
    let questionsHtml = '';
    quiz.questions.forEach((q, index) => {
        questionsHtml += `
            <div class="question-item">
                <p><strong>Question ${index + 1}:</strong> ${escapeHtml(q.text)}</p>
                ${q.options.map((opt, optIndex) => `
                    <label>
                        <input type="radio" name="q${index}" value="${optIndex}">
                        ${escapeHtml(opt)}
                    </label><br>
                `).join('')}
            </div>
        `;
    });
    
    document.getElementById('modal-questions').innerHTML = questionsHtml;
    document.getElementById('modal-result').innerHTML = '';
    modal.style.display = 'block';
    
    const submitBtn = document.getElementById('submit-quiz-modal');
    submitBtn.onclick = () => evaluateQuiz(learnerId, quizId);
};

function evaluateQuiz(learnerId, quizId) {
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
        progress[learnerId] = { completedCourses: [], quizAttempts: {} };
    }
    
    progress[learnerId].quizAttempts[quizId] = { score, percentage };
    localStorage.setItem('progress', JSON.stringify(progress));
    
    if (percentage >= 70) {
        resultDiv.innerHTML += `<p style="color:green;">✅ Félicitations ! Vous avez réussi ce quiz !</p>`;
    } else {
        resultDiv.innerHTML += `<p style="color:orange;">⚠️ Vous n'avez pas atteint 70%. Réessayez pour valider !</p>`;
    }
    
    setTimeout(() => {
        closeModal();
        if (currentUser && currentUser.id === learnerId) {
            loadLearnerDashboard();
        }
        if (currentUser && currentUser.role === 'admin' && document.getElementById('tracking-learner')?.value == learnerId) {
            showTracking(learnerId);
        }
    }, 3000);
}

function closeModal() {
    document.getElementById('quiz-modal').style.display = 'none';
}

// ==================== CERTIFICAT ====================
function checkAndShowCertificate(learnerId) {
    const learner = learners.find(l => l.id == learnerId);
    if (!learner) return false;
    
    const learnerProgress = progress[learnerId];
    if (!learnerProgress) return false;
    
    const totalCourses = learner.enrolledCourses.length;
    const completedCount = learnerProgress.completedCourses.length;
    const globalProgress = totalCourses > 0 ? (completedCount / totalCourses) * 100 : 0;
    
    const certificateDelivered = learnerProgress.certificateDelivered || false;
    
    if (globalProgress >= 70 && totalCourses > 0 && !certificateDelivered) {
        learnerProgress.certificateDelivered = true;
        learnerProgress.certificateDate = new Date().toISOString();
        localStorage.setItem('progress', JSON.stringify(progress));
        
        showCertificateNotification(learner);
        addCertificateBadge(learner, globalProgress);
        return true;
    }
    
    // Vérifier si le badge doit être affiché (même si déjà délivré, on le montre)
    if (globalProgress >= 70 && !document.getElementById('certificate-badge')) {
        addCertificateBadge(learner, globalProgress);
    }
    
    return globalProgress >= 70;
}

function showCertificateNotification(learner) {
    const notification = document.createElement('div');
    notification.className = 'certificate-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">🎓</span>
            <div>
                <h4>Félicitations ${escapeHtml(learner.name)} !</h4>
                <p>Vous avez atteint ${Math.floor(progress[learner.id]?.completedCourses.length / learner.enrolledCourses.length * 100)}% de progression.</p>
                <p>Votre certificat est prêt à être téléchargé !</p>
            </div>
            <button onclick="generateCertificate(${learner.id})" class="notification-btn">📥 Télécharger mon certificat</button>
            <button class="close-notification">✖</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    notification.querySelector('.close-notification').addEventListener('click', () => {
        notification.remove();
    });
    
    setTimeout(() => {
        if (notification.parentNode) notification.remove();
    }, 10000);
}

function addCertificateBadge(learner, globalProgress) {
    const myCoursesDiv = document.getElementById('my-courses');
    if (!myCoursesDiv) return;
    
    if (document.getElementById('certificate-badge')) return;
    
    const badgeHtml = `
        <div id="certificate-badge" class="certificate-badge">
            <div class="badge-icon">🏆</div>
            <div class="badge-content">
                <h3>Certificat disponible !</h3>
                <p>Félicitations ! Vous avez complété ${Math.floor(globalProgress)}% de votre formation.</p>
                <button onclick="generateCertificate(${learner.id})" class="certificate-download-btn">
                    🎓 Télécharger mon certificat
                </button>
                <button onclick="viewCertificate(${learner.id})" class="certificate-view-btn">
                    👁️ Voir mon certificat
                </button>
            </div>
        </div>
    `;
    
    myCoursesDiv.insertAdjacentHTML('afterbegin', badgeHtml);
}

window.generateCertificate = function(learnerId) {
    const learner = learners.find(l => l.id == learnerId);
    if (!learner) {
        alert("Apprenant non trouvé");
        return;
    }
    
    const learnerProgress = progress[learnerId];
    if (!learnerProgress) {
        alert("Aucune progression enregistrée");
        return;
    }
    
    const totalCourses = learner.enrolledCourses.length;
    const completedCourses = learnerProgress.completedCourses.map(courseId => {
        const course = courses.find(c => c.id === courseId);
        return course ? course.title : "Cours inconnu";
    });
    
    const globalProgress = totalCourses > 0 ? (completedCourses.length / totalCourses) * 100 : 0;
    
    if (globalProgress < 70) {
        alert(`⚠️ Progression insuffisante : ${globalProgress.toFixed(1)}% (minimum 70% requis pour obtenir le certificat)`);
        return;
    }
    
    // Récupérer les scores des quiz
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
    
    const certHtml = `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Certificat de réussite - ${learner.name}</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: 'Georgia', 'Times New Roman', serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 40px;
                }
                .certificate {
                    max-width: 600px;
                    width: 90%;
                    background: white;
                    border-radius: 15px;
                    box-shadow: 0 15px 30px rgba(0,0,0,0.2);
                    overflow: hidden;
                }
                .certificate-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 40px;
                    text-align: center;
                }
                .certificate-header h1 { font-size: 48px; margin-bottom: 10px; letter-spacing: 2px; }
                .certificate-header p { font-size: 18px; opacity: 0.9; }
                .certificate-body { padding: 50px; text-align: center; }
                .recipient-name {
                    font-size: 42px;
                    color: #667eea;
                    margin: 30px 0;
                    font-weight: bold;
                    border-bottom: 3px solid #667eea;
                    display: inline-block;
                    padding-bottom: 10px;
                }
                .congrats { font-size: 24px; color: #333; margin: 20px 0; }
                .completion-text { font-size: 18px; color: #666; line-height: 1.6; margin: 30px 0; }
                .course-list {
                    background: #f5f5f5;
                    border-radius: 10px;
                    padding: 20px;
                    margin: 30px 0;
                    text-align: left;
                }
                .course-list h3 { color: #667eea; margin-bottom: 15px; }
                .course-list ul { list-style: none; padding-left: 0; }
                .course-list li { padding: 8px 0; border-bottom: 1px solid #ddd; }
                .course-list li:last-child { border-bottom: none; }
                .course-list li:before { content: "✓ "; color: #28a745; font-weight: bold; margin-right: 10px; }
                .quiz-scores { margin: 30px 0; text-align: left; }
                .quiz-scores h3 { color: #667eea; margin-bottom: 15px; }
                .score-item {
                    margin-bottom: 15px;
                    padding: 10px;
                    background: #f9f9f9;
                    border-radius: 8px;
                }
                .progress-indicator { margin: 30px 0; text-align: center; }
                .progress-circle {
                    width: 120px;
                    height: 120px;
                    border-radius: 50%;
                    background: conic-gradient(#667eea 0% ${globalProgress}%, #e0e0e0 ${globalProgress}% 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto;
                    position: relative;
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
                    color: #667eea;
                }
                .certificate-footer {
                    background: #f5f5f5;
                    padding: 30px;
                    text-align: center;
                    border-top: 1px solid #e0e0e0;
                }
                .signature { margin-top: 20px; font-style: italic; color: #666; }
                .date { color: #999; margin-top: 20px; }
                @media print {
                    body { background: white; padding: 0; }
                    .certificate { box-shadow: none; border-radius: 0; }
                    button { display: none; }
                }
                button {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    padding: 12px 30px;
                    border-radius: 25px;
                    font-size: 16px;
                    cursor: pointer;
                    margin: 10px;
                    transition: transform 0.2s;
                }
                button:hover { transform: translateY(-2px); }
                .print-btn { background: #28a745; }
            </style>
        </head>
        <body>
            <div class="certificate">
                <div class="certificate-header">
                    <h1>🎓 CERTIFICAT DE RÉUSSITE</h1>
                    <p>Plateforme E-Learning</p>
                </div>
                <div class="certificate-body">
                    <p class="congrats">Ce certificat est décerné à</p>
                    <div class="recipient-name">${escapeHtml(learner.name)}</div>
                    <div class="completion-text">
                        Pour avoir complété avec succès sa formation sur la plateforme E-Learning,
                        démontrant ainsi son engagement et sa maîtrise des compétences acquises.
                    </div>
                    <div class="progress-indicator">
                        <div class="progress-circle">
                            <span>${Math.floor(globalProgress)}%</span>
                        </div>
                        <p style="margin-top: 10px; color: #666;">Taux de complétion</p>
                    </div>
                    <div class="course-list">
                        <h3>📚 Cours complétés (${completedCourses.length}/${totalCourses})</h3>
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
                         MILLOGO S. Yves Stéphane 
                       <br> _________________________<br>
                        Le Directeur Pédagogique
                    </div>
                    <div class="date">
                        Délivré le ${new Date(learnerProgress.certificateDate || new Date()).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                        })}
                    </div>
                    <div style="margin-top: 20px;">
                        <button onclick="window.print()" class="print-btn">🖨️ Imprimer / Enregistrer en PDF</button>
                    </div>
                </div>
            </div>
            <script>
                window.onafterprint = function() { setTimeout(() => window.close(), 500); };
            <\/script>
        </body>
        </html>
    `;
    
    const certWindow = window.open('', '_blank');
    certWindow.document.write(certHtml);
    certWindow.document.close();
};

window.viewCertificate = function(learnerId) {
    generateCertificate(learnerId);
};

// ==================== SUIVI GLOBAL (ADMIN) ====================
function updateTrackingSelect() {
    const select = document.getElementById('tracking-learner');
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
        progress[learnerId] = { completedCourses: [], quizAttempts: {} };
    }
    
    const learnerProgress = progress[learnerId];
    const totalCourses = learner.enrolledCourses.length;
    const completedCount = learnerProgress.completedCourses.length;
    const globalProgress = totalCourses > 0 ? (completedCount / totalCourses) * 100 : 0;
    
    let html = `<h3>${escapeHtml(learner.name)}</h3>`;
    html += `<div class="global-progress-card"><h4>Progression globale</h4>`;
    html += `<div class="progress-bar" style="height: 20px;"><div class="progress-fill" style="width: ${globalProgress}%; height: 100%; line-height: 20px; text-align: center; color: white;">${Math.floor(globalProgress)}%</div></div>`;
    html += `<p>${completedCount}/${totalCourses} cours complétés</p>`;
    if (globalProgress >= 70) {
        html += `<p style="color: #28a745; font-weight: bold;">🎓 Certificat éligible</p>`;
    }
    html += `</div>`;
    
    html += `<h4>📚 Cours suivis</h4>`;
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
    
    html += `<h4>📝 Scores des quiz</h4>`;
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
