document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const adminPanel = document.getElementById('adminPanel');
    const adminLoginForm = document.getElementById('adminLoginForm');
    const notesContainer = document.getElementById('notesContainer');
    const refreshBtn = document.getElementById('refreshBtn');
    const exportBtn = document.getElementById('exportBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    const getAdminPassword = () => {
        if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_ADMIN_PASSWORD) {
            return import.meta.env.VITE_ADMIN_PASSWORD;
        }
        if (typeof ENV_CONFIG !== 'undefined' && ENV_CONFIG.ADMIN_PASSWORD) {
            return ENV_CONFIG.ADMIN_PASSWORD;
        }
        return '1koza16';
    };
    const ADMIN_PASSWORD = getAdminPassword();

    if (localStorage.getItem('adminLoggedIn') === 'true') {
        showAdminPanel();
    }

    adminLoginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const password = document.getElementById('adminPassword').value;
        
        if (password === ADMIN_PASSWORD) {
            localStorage.setItem('adminLoggedIn', 'true');
            showAdminPanel();
        } else {
            showNotification('Hatalı şifre!', 'error');
        }
    });

    function showAdminPanel() {
        loginForm.style.display = 'none';
        adminPanel.style.display = 'block';
        loadNotes();
        updateStats();
    }

    async function loadNotes() {
        try {
            notesContainer.innerHTML = '<div class="loading"><div class="loading-spinner"></div></div>';
            
            const notes = await getNotesFromFirebase();
            
            if (notes.length === 0) {
                showEmptyState();
                return;
            }

            notesContainer.innerHTML = '';
            
            notes.forEach(note => {
                const noteCard = createNoteCard(note);
                notesContainer.appendChild(noteCard);
            });
        } catch (error) {
            console.error('Notlar yüklenirken hata:', error);
            notesContainer.innerHTML = '<div class="empty-state"><div class="empty-state-icon">❌</div><h3>Notlar yüklenemedi</h3><p>Bir hata oluştu. Lütfen sayfayı yenileyin.</p></div>';
            showNotification('Notlar yüklenirken hata oluştu!', 'error');
        }
    }

    function createNoteCard(note) {
        const card = document.createElement('div');
        card.className = 'note-card';
        const walletDisplay = note.walletAddress 
            ? `<div class="note-wallet">💰 Cüzdan: <span class="wallet-address">${escapeHtml(note.walletAddress)}</span></div>`
            : '';
        
        card.innerHTML = `
            <div class="note-header">
                <div class="note-author">
                    👤 ${escapeHtml(note.name)}
                </div>
                <div class="note-date">
                    📅 ${note.date}
                </div>
            </div>
            <div class="note-content">
                ${escapeHtml(note.note).replace(/\n/g, '<br>')}
            </div>
            ${walletDisplay}
            <div class="note-actions">
                <button class="note-action-btn" onclick="copyNote('${note.id}')">
                    📋 Kopyala
                </button>
                <button class="note-action-btn delete" onclick="deleteNote('${note.id}')">
                    🗑️ Sil
                </button>
            </div>
        `;
        return card;
    }

    function showEmptyState() {
        notesContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📝</div>
                <h3>Henüz hiç not yok</h3>
                <p>Kullanıcılar notlarını paylaştığında burada görünecek.</p>
            </div>
        `;
    }

    async function updateStats() {
        try {
            const notes = await getNotesFromFirebase();
            document.getElementById('totalNotes').textContent = notes.length;
            const uniqueUsers = new Set(notes.map(note => note.name)).size;
            document.getElementById('uniqueUsers').textContent = uniqueUsers;
            const today = new Date().toDateString();
            const todayNotes = notes.filter(note => 
                new Date(note.timestamp).toDateString() === today
            ).length;
            document.getElementById('todayNotes').textContent = todayNotes;
        } catch (error) {
            console.error('İstatistikler güncellenirken hata:', error);
            document.getElementById('totalNotes').textContent = '0';
            document.getElementById('uniqueUsers').textContent = '0';
            document.getElementById('todayNotes').textContent = '0';
        }
    }

    window.copyNote = async function(noteId) {
        try {
            const notes = await getNotesFromFirebase();
            const note = notes.find(n => n.id === noteId);
            
            if (note) {
                const textToCopy = `Yazar: ${note.name}\nTarih: ${note.date}\n\nNot:\n${note.note}`;
                
                navigator.clipboard.writeText(textToCopy).then(() => {
                    showNotification('Not panoya kopyalandı!', 'success');
                }).catch(() => {
                    showNotification('Kopyalama başarısız!', 'error');
                });
            }
        } catch (error) {
            console.error('Not kopyalanırken hata:', error);
            showNotification('Not kopyalanırken hata oluştu!', 'error');
        }
    };

    window.deleteNote = async function(noteId) {
        if (confirm('Bu notu silmek istediğinizden emin misiniz?')) {
            try {
                await deleteNoteFromFirebase(noteId);
                loadNotes();
                updateStats();
                showNotification('Not silindi!', 'success');
            } catch (error) {
                console.error('Not silinirken hata:', error);
                showNotification('Not silinirken hata oluştu!', 'error');
            }
        }
    };

    refreshBtn.addEventListener('click', function() {
        loadNotes();
        updateStats();
        showNotification('Sayfa yenilendi!', 'success');
    });

    exportBtn.addEventListener('click', async function() {
        try {
            const notes = await getNotesFromFirebase();
            
            if (notes.length === 0) {
                showNotification('Dışa aktarılacak not bulunamadı!', 'error');
                return;
            }

            const exportData = {
                exportDate: new Date().toLocaleString('tr-TR'),
                totalNotes: notes.length,
                notes: notes.map(note => ({
                    id: note.id,
                    author: note.name,
                    content: note.note,
                    walletAddress: note.walletAddress || null,
                    date: note.date,
                    timestamp: note.timestamp
                }))
            };

            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `notlar_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            showNotification('Notlar başarıyla dışa aktarıldı!', 'success');
        } catch (error) {
            console.error('Dışa aktarma hatası:', error);
            showNotification('Dışa aktarma sırasında hata oluştu!', 'error');
        }
    });

    clearAllBtn.addEventListener('click', async function() {
        if (confirm('TÜM NOTLARI SİLMEK İSTEDİĞİNİZDEN EMİN MİSİNİZ?\n\nBu işlem geri alınamaz!')) {
            if (confirm('Son bir kez daha onaylıyor musunuz?')) {
                try {
                    await clearAllNotesFromFirebase();
                    loadNotes();
                    updateStats();
                    showNotification('Tüm notlar silindi!', 'success');
                } catch (error) {
                    console.error('Tüm notlar silinirken hata:', error);
                    showNotification('Notlar silinirken hata oluştu!', 'error');
                }
            }
        }
    });

    logoutBtn.addEventListener('click', function() {
        localStorage.removeItem('adminLoggedIn');
        location.reload();
    });

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#e17055' : type === 'success' ? '#00b894' : '#74b9ff'};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 1000;
            animation: slideInRight 0.3s ease-out;
            font-weight: 500;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    setTimeout(() => {
        if (adminPanel.style.display !== 'none') {
            adminPanel.style.animation = 'fadeInUp 0.6s ease-out';
        }
    }, 100);
});
