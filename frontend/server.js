const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const XLSX = require('xlsx');

const app = express();
const port = 3000;

// ==================== INITIALISATION BASE DE DONNÉES ====================

const dbDir = path.join(__dirname, 'database');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir);

const db = new sqlite3.Database(path.join(dbDir, 'monitoring_meteo.db'));

// Création des tables
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS operateurs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom TEXT NOT NULL,
        prenom TEXT,
        matricule TEXT UNIQUE,
        date_creation DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS types_message (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        libelle TEXT NOT NULL,
        delai_max_minutes INTEGER DEFAULT 10
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS causes_5m (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        libelle TEXT NOT NULL,
        description TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS transmissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date_transmission DATE NOT NULL,
        heure_prevue TIME NOT NULL,
        heure_reelle TIME,
        type_message_id INTEGER NOT NULL,
        operateur_id INTEGER NOT NULL,
        etat TEXT NOT NULL CHECK (etat IN ('A_LEURE', 'RETARD', 'NON_TRANSMIS')),
        cause_5m_id INTEGER,
        commentaire TEXT,
        date_saisie DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (type_message_id) REFERENCES types_message(id),
        FOREIGN KEY (operateur_id) REFERENCES operateurs(id),
        FOREIGN KEY (cause_5m_id) REFERENCES causes_5m(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS logs_utilisateurs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        utilisateur TEXT,
        action TEXT,
        details TEXT,
        date_action DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Insertion des données de base
    const typesMessage = [
        ['SYNOP', 'Message synoptique de surface', 10],
        ['METAR', 'Message aéronautique routine', 5],
        ['TAF', 'Prévision aérodrome', 15],
        ['SPECI', 'Message aéronautique spécial', 5]
    ];
    typesMessage.forEach(t => {
        db.run(`INSERT OR IGNORE INTO types_message (code, libelle, delai_max_minutes) VALUES (?, ?, ?)`, t);
    });

    const causes5M = [
        ['M1', 'Main d\'œuvre', 'Absence, erreur humaine, manque de formation'],
        ['M2', 'Matériel', 'Panne capteur, panne serveur, coupure réseau'],
        ['M3', 'Méthode', 'Procédure non adaptée, logiciel mal configuré'],
        ['M4', 'Milieu', 'Conditions météo extrêmes, accès difficile'],
        ['M5', 'Matière', 'Fichiers corrompus, données manquantes']
    ];
    causes5M.forEach(c => {
        db.run(`INSERT OR IGNORE INTO causes_5m (code, libelle, description) VALUES (?, ?, ?)`, c);
    });

    const operateurs = [
        ['BOULAL', 'Redouane', 'CPM001'],
        ['KASSIMI', 'Amine', 'CPM002'],
        ['SOUBAI', 'Mohamed', 'CPM003'],
        ['KHABIRI', 'Abdejalile', 'CPM004'],
        ['AYOUB', 'Sami', 'CPM005']
    ];
    operateurs.forEach(o => {
        db.run(`INSERT OR IGNORE INTO operateurs (nom, prenom, matricule) VALUES (?, ?, ?)`, o);
    });
});

// ==================== MIDDLEWARE ====================

app.use(express.json());
app.use(express.static('public'));

const exportDir = path.join(__dirname, 'exports');
if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir);
app.use('/exports', express.static(exportDir));

// ==================== API AUTHENTIFICATION SIMPLIFIÉE ====================
// Base d'utilisateurs - SIMPLE et CLAIRE
const USERS = {
    // Chef
    'admin': { 
        password: 'admin123', 
        role: 'chef', 
        name: 'BOULAL Redouane' 
    },
    // Employés
    'kassimi': { 
        password: 'meteo2026', 
        role: 'employe', 
        name: 'KASSIMI Amine' 
    },
    'soubai': { 
        password: 'meteo2026', 
        role: 'employe', 
        name: 'SOUBAI Mohamed' 
    },
    'khabiri': { 
        password: 'meteo2026', 
        role: 'employe', 
        name: 'KHABIRI Abdejalile' 
    },
    'ayoub': { 
        password: 'meteo2026', 
        role: 'employe', 
        name: 'AYOUB Sami' 
    }
};

app.post('/api/auth/login', (req, res) => {
    const { username, password, role } = req.body;
    
    console.log('========================================');
    console.log('Tentative de connexion:');
    console.log('  - Username:', username);
    console.log('  - Role demandé:', role);
    console.log('  - Password reçu:', password);
    
    // Vérifier si l'utilisateur existe
    const user = USERS[username];
    
    if (!user) {
        console.log('  ❌ Utilisateur non trouvé dans USERS');
        console.log('  📋 Utilisateurs disponibles:', Object.keys(USERS));
        return res.status(401).json({ 
            success: false, 
            error: 'Identifiant ou mot de passe incorrect' 
        });
    }
    
    console.log('  ✅ Utilisateur trouvé:', user);
    
    if (user.password !== password) {
        console.log('  ❌ Mot de passe incorrect');
        console.log('     Attendu:', user.password);
        console.log('     Reçu:', password);
        return res.status(401).json({ 
            success: false, 
            error: 'Identifiant ou mot de passe incorrect' 
        });
    }
    
    console.log('  ✅ Mot de passe correct');
    
    if (user.role !== role) {
        console.log('  ❌ Rôle incorrect');
        console.log('     Attendu:', user.role);
        console.log('     Reçu:', role);
        return res.status(401).json({ 
            success: false, 
            error: `Ce compte n'a pas le rôle ${role}` 
        });
    }
    
    console.log('  ✅ Rôle correct');
    console.log('  ✅ Connexion réussie !');
    console.log('========================================');
    
    res.json({ 
        success: true, 
        role: user.role, 
        name: user.name,
        message: `Bienvenue ${user.name}`
    });
});

// ==================== API OPÉRATEURS ====================

app.get('/api/operateurs', (req, res) => {
    db.all('SELECT * FROM operateurs ORDER BY nom', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/operateurs', (req, res) => {
    const { nom, prenom, matricule } = req.body;
    db.run(`INSERT INTO operateurs (nom, prenom, matricule) VALUES (?, ?, ?)`, [nom, prenom, matricule], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, message: 'Opérateur ajouté' });
    });
});

app.put('/api/operateurs/:id', (req, res) => {
    const { id } = req.params;
    const { nom, prenom, matricule } = req.body;
    db.run(`UPDATE operateurs SET nom = ?, prenom = ?, matricule = ? WHERE id = ?`, [nom, prenom, matricule, id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Opérateur modifié' });
    });
});

app.delete('/api/operateurs/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM operateurs WHERE id = ?', [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Opérateur supprimé' });
    });
});

// ==================== API TYPES DE MESSAGES ====================

app.get('/api/types-message', (req, res) => {
    db.all('SELECT * FROM types_message', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// ==================== API CAUSES 5M ====================

app.get('/api/causes-5m', (req, res) => {
    db.all('SELECT * FROM causes_5m', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// ==================== API TRANSMISSIONS ====================

app.get('/api/transmissions', (req, res) => {
    const { debut, fin, operateur_id, etat } = req.query;
    
    let query = `
        SELECT 
            t.*,
            o.nom as operateur_nom,
            o.prenom as operateur_prenom,
            tm.code as type_code,
            tm.libelle as type_libelle,
            c5m.code as cause_code,
            c5m.libelle as cause_libelle
        FROM transmissions t
        LEFT JOIN operateurs o ON t.operateur_id = o.id
        LEFT JOIN types_message tm ON t.type_message_id = tm.id
        LEFT JOIN causes_5m c5m ON t.cause_5m_id = c5m.id
        WHERE 1=1
    `;
    
    const params = [];
    
    if (debut) { query += ` AND t.date_transmission >= ?`; params.push(debut); }
    if (fin) { query += ` AND t.date_transmission <= ?`; params.push(fin); }
    if (operateur_id) { query += ` AND t.operateur_id = ?`; params.push(operateur_id); }
    if (etat) { query += ` AND t.etat = ?`; params.push(etat); }
    
    query += ` ORDER BY t.date_transmission DESC, t.heure_prevue DESC`;
    
    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/transmissions', (req, res) => {
    const { date_transmission, heure_prevue, heure_reelle, type_message_id, operateur_id, etat, cause_5m_id, commentaire } = req.body;
    
    if (!date_transmission || !heure_prevue || !type_message_id || !operateur_id || !etat) {
        return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }
    
    if ((etat === 'RETARD' || etat === 'NON_TRANSMIS') && !cause_5m_id) {
        return res.status(400).json({ error: 'Une cause 5M est obligatoire pour un retard ou une non-transmission' });
    }
    
    db.run(`INSERT INTO transmissions (date_transmission, heure_prevue, heure_reelle, type_message_id, operateur_id, etat, cause_5m_id, commentaire) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
        [date_transmission, heure_prevue, heure_reelle || null, type_message_id, operateur_id, etat, cause_5m_id || null, commentaire || null], 
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, message: 'Transmission enregistrée' });
        });
});

// ==================== API STATISTIQUES ====================

app.get('/api/stats/jour/:date', (req, res) => {
    const { date } = req.params;
    db.get(`SELECT COUNT(*) as total, SUM(CASE WHEN etat = 'A_LEURE' THEN 1 ELSE 0 END) as a_leure, SUM(CASE WHEN etat = 'RETARD' THEN 1 ELSE 0 END) as retard, SUM(CASE WHEN etat = 'NON_TRANSMIS' THEN 1 ELSE 0 END) as non_transmis FROM transmissions WHERE date_transmission = ?`, [date], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row || { total: 0, a_leure: 0, retard: 0, non_transmis: 0 });
    });
});

app.get('/api/stats/mensuel/:annee/:mois', (req, res) => {
    const { annee, mois } = req.params;
    const dateDebut = `${annee}-${mois.padStart(2, '0')}-01`;
    const dernierJour = new Date(parseInt(annee), parseInt(mois), 0).getDate();
    const dateFin = `${annee}-${mois.padStart(2, '0')}-${dernierJour}`;
    
    db.all(`SELECT o.id as operateur_id, o.nom, o.prenom, COUNT(t.id) as total, SUM(CASE WHEN t.etat = 'A_LEURE' THEN 1 ELSE 0 END) as bien_transmis, SUM(CASE WHEN t.etat = 'RETARD' THEN 1 ELSE 0 END) as transmis_retard, SUM(CASE WHEN t.etat = 'NON_TRANSMIS' THEN 1 ELSE 0 END) as non_transmis, ROUND(100.0 * SUM(CASE WHEN t.etat = 'A_LEURE' THEN 1 ELSE 0 END) / COUNT(t.id), 2) as taux_conformite FROM transmissions t JOIN operateurs o ON t.operateur_id = o.id WHERE t.date_transmission BETWEEN ? AND ? GROUP BY o.id ORDER BY taux_conformite DESC`, [dateDebut, dateFin], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/dashboard', (req, res) => {
    db.get(`SELECT COUNT(*) as total, SUM(CASE WHEN etat = 'A_LEURE' THEN 1 ELSE 0 END) as a_leure, SUM(CASE WHEN etat = 'RETARD' THEN 1 ELSE 0 END) as retard, SUM(CASE WHEN etat = 'NON_TRANSMIS' THEN 1 ELSE 0 END) as non_transmis FROM transmissions WHERE date_transmission >= date('now', '-7 days')`, [], (err, totalRow) => {
        if (err) return res.status(500).json({ error: err.message });
        
        db.all(`SELECT o.nom, o.prenom, COUNT(*) as total, SUM(CASE WHEN t.etat = 'A_LEURE' THEN 1 ELSE 0 END) as a_leure, ROUND(100.0 * SUM(CASE WHEN t.etat = 'A_LEURE' THEN 1 ELSE 0 END) / COUNT(*), 2) as taux FROM transmissions t JOIN operateurs o ON t.operateur_id = o.id WHERE t.date_transmission >= date('now', '-7 days') GROUP BY o.id ORDER BY taux DESC`, [], (err, perfRows) => {
            if (err) return res.status(500).json({ error: err.message });
            
            db.all(`SELECT date_transmission as date, COUNT(*) as total, SUM(CASE WHEN etat = 'A_LEURE' THEN 1 ELSE 0 END) as a_leure, SUM(CASE WHEN etat = 'RETARD' THEN 1 ELSE 0 END) as retard FROM transmissions WHERE date_transmission >= date('now', '-7 days') GROUP BY date_transmission ORDER BY date_transmission`, [], (err, histRows) => {
                if (err) return res.status(500).json({ error: err.message });
                
                res.json({
                    total7Jours: totalRow || { total: 0, a_leure: 0, retard: 0, non_transmis: 0 },
                    performanceOperateurs: perfRows,
                    historiqueQuotidien: histRows
                });
            });
        });
    });
});

// ==================== API EXPORTS ====================

app.get('/api/export/excel', (req, res) => {
    const { debut, fin, operateur_id } = req.query;
    
    let query = `SELECT t.date_transmission as 'Date', t.heure_prevue as 'Heure prévue', t.heure_reelle as 'Heure réelle', tm.code as 'Type message', o.nom || ' ' || o.prenom as 'Opérateur', CASE t.etat WHEN 'A_LEURE' THEN 'À l''heure' WHEN 'RETARD' THEN 'Retard' WHEN 'NON_TRANSMIS' THEN 'Non transmis' END as 'État', c5m.libelle as 'Cause 5M', t.commentaire as 'Commentaire' FROM transmissions t LEFT JOIN operateurs o ON t.operateur_id = o.id LEFT JOIN types_message tm ON t.type_message_id = tm.id LEFT JOIN causes_5m c5m ON t.cause_5m_id = c5m.id WHERE 1=1`;
    const params = [];
    
    if (debut) { query += ` AND t.date_transmission >= ?`; params.push(debut); }
    if (fin) { query += ` AND t.date_transmission <= ?`; params.push(fin); }
    if (operateur_id) { query += ` AND t.operateur_id = ?`; params.push(operateur_id); }
    query += ` ORDER BY t.date_transmission DESC`;
    
    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        if (rows.length === 0) return res.status(404).json({ error: 'Aucune donnée à exporter' });
        
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Transmissions');
        
        const fileName = `export_transmissions_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.xlsx`;
        const filePath = path.join(exportDir, fileName);
        XLSX.writeFile(wb, filePath);
        
        res.json({ message: 'Export généré', fichier: fileName, url: `/exports/${fileName}` });
    });
});

// ==================== DÉMARRAGE ====================

app.listen(port, () => {
    console.log(`
    ╔════════════════════════════════════════════════════════════════╗
    ║         🌤️  Monitoring Météo - Application démarrée            ║
    ╠════════════════════════════════════════════════════════════════╣
    ║   📍 Accès : http://localhost:${port}                           ║
    ║   📍 Login : http://localhost:${port}/login.html                ║
    ║                                                                ║
    ║   👑 CHEF :                                                     ║
    ║      - admin / admin123                                        ║
    ║                                                                ║
    ║   👥 EMPLOYÉS :                                                ║
    ║      - kassimi / meteo2026                                     ║
    ║      - soubai / meteo2026                                      ║
    ║      - khabiri / meteo2026                                     ║
    ║      - ayoub / meteo2026                                       ║
    ║                                                                ║
    ╚════════════════════════════════════════════════════════════════╝
    `);
});