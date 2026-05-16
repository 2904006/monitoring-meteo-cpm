// ==================== VARIABLES GLOBALES ====================
let currentUser = null;
let currentRole = null;
let chartDaily = null;
let chartRepartition = null;

// ==================== INITIALISATION ====================
document.addEventListener('DOMContentLoaded', async () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        window.location.href = '/login.html';
        return;
    }
    
    currentUser = JSON.parse(userStr);
    currentRole = currentUser.role;
    
    // Appliquer le thème selon le rôle
    const root = document.documentElement;
    if (currentRole === 'chef') {
        root.style.setProperty('--active-role', '#8b5cf6');
        root.style.setProperty('--badge-color', '#8b5cf6');
        document.getElementById('appTitle').innerHTML = '👑 CPM Essaouira';
        document.getElementById('roleBadge').innerHTML = 'Chef de centre';
        document.getElementById('roleBadge').style.background = '#8b5cf6';
        document.getElementById('adminMenu').style.display = 'block';
        document.getElementById('statsMenu').style.display = 'block';
        document.getElementById('exportPDFBtn').style.display = 'block';
        document.getElementById('submitBtn')?.classList.add('btn-chef');
    } else {
        root.style.setProperty('--active-role', '#3b82f6');
        root.style.setProperty('--badge-color', '#3b82f6');
        document.getElementById('appTitle').innerHTML = '👥 CPM Essaouira';
        document.getElementById('roleBadge').innerHTML = 'Employé';
        document.getElementById('roleBadge').style.background = '#3b82f6';
        document.getElementById('adminMenu').style.display = 'none';
        document.getElementById('statsMenu').style.display = 'block';
        document.getElementById('exportPDFBtn').style.display = 'none';
        document.getElementById('submitBtn')?.classList.add('btn-employe');
    }
    
    document.getElementById('userWelcome').innerHTML = `<i class="fas fa-user-circle me-1"></i>${currentUser.username} · ${currentRole === 'chef' ? 'Chef de centre' : 'Employé'}`;
    
    // Navigation
    document.querySelectorAll('.nav-link[data-page]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            showPage(page);
        });
    });
    
    // Déconnexion
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('user');
        window.location.href = '/login.html';
    });
    
    // Chargement initial
    await loadTypesMessage();
    await loadCauses5M();
    await loadOperateurs();
    await loadOperateursFilter();
    await loadDashboard();
    
    // Formulaire transmission
    document.getElementById('transmissionForm')?.addEventListener('submit', submitTransmission);
    document.getElementById('etat')?.addEventListener('change', toggleCauseField);
    
    // Formulaire ajout opérateur
    document.getElementById('addOperateurForm')?.addEventListener('submit', submitOperateur);
});

// ==================== NAVIGATION ====================
function showPage(pageName) {
    document.querySelectorAll('.page-content').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(`page-${pageName}`).classList.add('active');
    
    document.querySelectorAll('.nav-link[data-page]').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === pageName) link.classList.add('active');
    });
    
    const titles = {
        dashboard: 'Tableau de bord',
        saisie: 'Nouvelle transmission',
        consultation: 'Consultation',
        statistiques: 'Statistiques',
        administration: 'Administration'
    };
    document.getElementById('pageTitle').innerText = titles[pageName] || pageName;
    
    if (pageName === 'dashboard') loadDashboard();
    if (pageName === 'consultation') loadTransmissions();
    if (pageName === 'statistiques') loadStatistiques();
    if (pageName === 'administration' && currentRole === 'chef') loadOperateurs();
}
// ==================== API AUTHENTIFICATION ====================
const USERS = {
    'admin': { password: 'admin123', role: 'chef', name: 'BOULAL Redouane' },
    'employe': { password: 'meteo2026', role: 'employe', name: 'KASSIMI Amine' },
    'employe2': { password: 'meteo2026', role: 'employe', name: 'SOUBAI Mohamed' },
    'employe3': { password: 'meteo2026', role: 'employe', name: 'KHABIRI Abdejalile' }
};

app.post('/api/auth/login', (req, res) => {
    const { username, password, role } = req.body;
    
    if (USERS[username] && USERS[username].password === password) {
        if (USERS[username].role !== role) {
            return res.status(401).json({ success: false, error: 'Rôle invalide pour cet utilisateur' });
        }
        logAction(username, 'LOGIN_SUCCESS');
        res.json({ 
            success: true, 
            role: USERS[username].role, 
            name: USERS[username].name,
            message: `Bienvenue ${USERS[username].name}`
        });
    } else {
        logAction(username || 'inconnu', 'LOGIN_FAILED');
        res.status(401).json({ success: false, error: 'Identifiants incorrects' });
    }
});
// ==================== DASHBOARD ====================
async function loadDashboard() {
    try {
        const response = await fetch('/api/dashboard');
        const data = await response.json();
        
        if (data.total7Jours) {
            document.getElementById('totalMessages').innerText = data.total7Jours.total || 0;
            document.getElementById('totalHeure').innerText = data.total7Jours.a_leure || 0;
            document.getElementById('totalRetard').innerText = data.total7Jours.retard || 0;
            document.getElementById('totalNonTransmis').innerText = data.total7Jours.non_transmis || 0;
            
            const total = data.total7Jours.total || 1;
            const score = Math.round((data.total7Jours.a_leure / total) * 100);
            document.getElementById('qualityScore').innerText = `${score}%`;
            document.getElementById('qualityFill').style.width = `${score}%`;
            
            if (score >= 90) document.getElementById('qualityLabel').innerHTML = '<i class="fas fa-star text-warning"></i> Qualité excellente';
            else if (score >= 75) document.getElementById('qualityLabel').innerHTML = '<i class="fas fa-thumbs-up text-success"></i> Bonne qualité';
            else if (score >= 60) document.getElementById('qualityLabel').innerHTML = '<i class="fas fa-chart-line text-warning"></i> Qualité moyenne';
            else document.getElementById('qualityLabel').innerHTML = '<i class="fas fa-exclamation-triangle text-danger"></i> Qualité insuffisante';
        }
        
        // Performance opérateurs
        if (data.performanceOperateurs) {
            const tbody = document.querySelector('#performanceTable tbody');
            tbody.innerHTML = '';
            data.performanceOperateurs.forEach(op => {
                tbody.innerHTML += `
                    <tr>
                        <td><i class="fas fa-user-circle me-1"></i>${op.nom} ${op.prenom}</td>
                        <td>${op.total}</td>
                        <td class="text-success">${op.a_leure}</td>
                        <td><span class="badge ${op.taux >= 80 ? 'bg-success' : op.taux >= 60 ? 'bg-warning' : 'bg-danger'}">${op.taux || 0}%</span></td>
                    </tr>
                `;
            });
        }
        
        // Graphiques
        if (data.historiqueQuotidien) {
            const labels = data.historiqueQuotidien.map(d => d.date).reverse();
            const aLeure = data.historiqueQuotidien.map(d => d.a_leure).reverse();
            const retards = data.historiqueQuotidien.map(d => d.retard).reverse();
            
            if (chartDaily) chartDaily.destroy();
            const ctx = document.getElementById('dailyChart').getContext('2d');
            chartDaily = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        { label: 'À l\'heure', data: aLeure, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', fill: true, tension: 0.3 },
                        { label: 'Retards', data: retards, borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)', fill: true, tension: 0.3 }
                    ]
                },
                options: { responsive: true, maintainAspectRatio: true }
            });
            
            const total = data.total7Jours?.total || 1;
            const aLeureTotal = data.total7Jours?.a_leure || 0;
            const retardTotal = data.total7Jours?.retard || 0;
            const nonTransmisTotal = data.total7Jours?.non_transmis || 0;
            
            if (chartRepartition) chartRepartition.destroy();
            const ctxPie = document.getElementById('repartitionChart').getContext('2d');
            chartRepartition = new Chart(ctxPie, {
                type: 'doughnut',
                data: {
                    labels: ['À l\'heure', 'Retards', 'Non transmis'],
                    datasets: [{ data: [aLeureTotal, retardTotal, nonTransmisTotal], backgroundColor: ['#10b981', '#f59e0b', '#ef4444'] }]
                },
                options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
            });
        }
    } catch (error) {
        console.error('Erreur dashboard:', error);
    }
}

// ==================== TRANSMISSIONS ====================
async function loadTransmissions() {
    const debut = document.getElementById('filterDebut')?.value || '';
    const fin = document.getElementById('filterFin')?.value || '';
    const operateur_id = document.getElementById('filterOperateur')?.value || '';
    
    let url = '/api/transmissions?';
    if (debut) url += `debut=${debut}&`;
    if (fin) url += `fin=${fin}&`;
    if (operateur_id && currentRole === 'chef') url += `operateur_id=${operateur_id}&`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        const tbody = document.getElementById('consultationBody');
        tbody.innerHTML = '';
        
        data.forEach(t => {
            let etatHtml = '';
            if (t.etat === 'A_LEURE') etatHtml = '<span class="badge bg-success"><i class="fas fa-check me-1"></i>À l\'heure</span>';
            else if (t.etat === 'RETARD') etatHtml = '<span class="badge bg-warning"><i class="fas fa-clock me-1"></i>Retard</span>';
            else etatHtml = '<span class="badge bg-danger"><i class="fas fa-circle-exclamation me-1"></i>Non transmis</span>';
            
            tbody.innerHTML += `
                <tr>
                    <td>${t.date_transmission}</td>
                    <td>${t.heure_prevue}</td>
                    <td>${t.heure_reelle || '-'}</td>
                    <td><span class="badge bg-secondary">${t.type_code}</span></td>
                    <td><i class="fas fa-user-circle me-1"></i>${t.operateur_nom || ''} ${t.operateur_prenom || ''}</td>
                    <td>${etatHtml}</td>
                    <td>${t.cause_libelle || '-'}</td>
                </tr>
            `;
        });
    } catch (error) {
        console.error('Erreur:', error);
    }
}

async function submitTransmission(e) {
    e.preventDefault();
    
    const data = {
        date_transmission: document.getElementById('date_transmission').value,
        heure_prevue: document.getElementById('heure_prevue').value,
        heure_reelle: document.getElementById('heure_reelle').value || null,
        type_message_id: parseInt(document.getElementById('type_message_id').value),
        operateur_id: currentRole === 'chef' ? parseInt(document.getElementById('operateur_id').value) : (await getCurrentOperatorId()),
        etat: document.getElementById('etat').value,
        cause_5m_id: document.getElementById('cause_5m_id').value ? parseInt(document.getElementById('cause_5m_id').value) : null,
        commentaire: document.getElementById('commentaire').value || null
    };
    
    try {
        const response = await fetch('/api/transmissions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        const msgDiv = document.getElementById('saisieMessage');
        
        if (response.ok) {
            msgDiv.innerHTML = '<div class="alert alert-success"><i class="fas fa-check-circle me-2"></i>Transmission enregistrée</div>';
            document.getElementById('transmissionForm').reset();
            document.getElementById('date_transmission').valueAsDate = new Date();
            setTimeout(() => msgDiv.innerHTML = '', 3000);
        } else {
            msgDiv.innerHTML = `<div class="alert alert-danger"><i class="fas fa-exclamation-triangle me-2"></i>${result.error}</div>`;
        }
    } catch (error) {
        console.error('Erreur:', error);
    }
}

async function getCurrentOperatorId() {
    const response = await fetch('/api/operateurs');
    const operateurs = await response.json();
    const current = operateurs.find(op => op.nom.toLowerCase() === currentUser.username.toLowerCase());
    return current ? current.id : 1;
}

function toggleCauseField() {
    const etat = document.getElementById('etat').value;
    const causeGroup = document.getElementById('causeGroup');
    causeGroup.style.display = (etat !== 'A_LEURE') ? 'block' : 'none';
}

// ==================== STATISTIQUES ====================
async function loadStatistiques() {
    const annee = document.getElementById('statAnnee').value;
    const mois = document.getElementById('statMois').value;
    
    try {
        const response = await fetch(`/api/stats/mensuel/${annee}/${mois}`);
        const data = await response.json();
        
        const tbody = document.getElementById('statBody');
        tbody.innerHTML = '';
        
        data.forEach(stat => {
            tbody.innerHTML += `
                <tr>
                    <td><i class="fas fa-user-circle me-1"></i>${stat.nom} ${stat.prenom}</td>
                    <td>${stat.total}</td>
                    <td class="text-success">${stat.bien_transmis || 0}</td>
                    <td class="text-warning">${stat.transmis_retard || 0}</td>
                    <td class="text-danger">${stat.non_transmis || 0}</td>
                    <td><span class="badge ${(stat.taux_conformite || 0) >= 80 ? 'bg-success' : (stat.taux_conformite || 0) >= 60 ? 'bg-warning' : 'bg-danger'}">${stat.taux_conformite || 0}%</span></td>
                </tr>
            `;
        });
    } catch (error) {
        console.error('Erreur:', error);
    }
}

// ==================== ADMINISTRATION ====================
async function loadOperateurs() {
    try {
        const response = await fetch('/api/operateurs');
        const data = await response.json();
        
        const tbody = document.getElementById('operateursBody');
        tbody.innerHTML = '';
        
        data.forEach(op => {
            tbody.innerHTML += `
                <tr>
                    <td>${op.id}</td>
                    <td>${op.nom}</td>
                    <td>${op.prenom || '-'}</td>
                    <td>${op.matricule || '-'}</td>
                    <td><button class="btn btn-sm btn-danger" onclick="deleteOperateur(${op.id})"><i class="fas fa-trash-can"></i></button></td>
                </tr>
            `;
        });
    } catch (error) {
        console.error('Erreur:', error);
    }
}

async function submitOperateur(e) {
    e.preventDefault();
    
    const data = {
        nom: document.getElementById('newNom').value,
        prenom: document.getElementById('newPrenom').value,
        matricule: document.getElementById('newMatricule').value
    };
    
    try {
        await fetch('/api/operateurs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        loadOperateurs();
        loadOperateursFilter();
        document.getElementById('addOperateurForm').reset();
    } catch (error) {
        console.error('Erreur:', error);
    }
}

async function deleteOperateur(id) {
    if (confirm('Supprimer cet opérateur ?')) {
        await fetch(`/api/operateurs/${id}`, { method: 'DELETE' });
        loadOperateurs();
        loadOperateursFilter();
    }
}

// ==================== CHARGEMENT DES LISTES ====================
async function loadTypesMessage() {
    const response = await fetch('/api/types-message');
    const data = await response.json();
    const select = document.getElementById('type_message_id');
    if (select) {
        select.innerHTML = '';
        data.forEach(type => {
            select.innerHTML += `<option value="${type.id}">${type.code} - ${type.libelle}</option>`;
        });
    }
}

async function loadCauses5M() {
    const response = await fetch('/api/causes-5m');
    const data = await response.json();
    const select = document.getElementById('cause_5m_id');
    if (select) {
        select.innerHTML = '<option value="">Sélectionner une cause</option>';
        data.forEach(cause => {
            select.innerHTML += `<option value="${cause.id}">${cause.code} - ${cause.libelle}</option>`;
        });
    }
}

async function loadOperateursFilter() {
    const response = await fetch('/api/operateurs');
    const data = await response.json();
    
    const selectForm = document.getElementById('operateur_id');
    if (selectForm) {
        selectForm.innerHTML = '';
        data.forEach(op => {
            selectForm.innerHTML += `<option value="${op.id}">${op.nom} ${op.prenom}</option>`;
        });
    }
    
    const filterSelect = document.getElementById('filterOperateur');
    if (filterSelect && currentRole === 'chef') {
        filterSelect.innerHTML = '<option value="">Tous les opérateurs</option>';
        data.forEach(op => {
            filterSelect.innerHTML += `<option value="${op.id}">${op.nom} ${op.prenom}</option>`;
        });
    }
}

// ==================== EXPORT PDF ====================
async function exportDashboardToPDF() {
    const { jsPDF } = window.jspdf;
    const btn = document.getElementById('exportPDFBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Génération...';
    btn.disabled = true;
    
    try {
        const element = document.getElementById('page-dashboard');
        const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        pdf.save(`rapport_cpm_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.pdf`);
    } catch (error) {
        console.error('Erreur PDF:', error);
        alert('Erreur lors de la génération du PDF');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// Initialisation des dates
document.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('date_transmission');
    if (dateInput) dateInput.valueAsDate = new Date();
});