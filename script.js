document.addEventListener('DOMContentLoaded', function() {
    const noteForm = document.getElementById('noteForm');
    const noteTextarea = document.getElementById('note');
    const charCount = document.getElementById('charCount');
    const submitBtn = document.querySelector('.submit-btn');
    const successMessage = document.getElementById('successMessage');
    const btnText = document.querySelector('.btn-text');
    const btnLoading = document.querySelector('.btn-loading');
    const poapModal = document.getElementById('poapModal');
    const poapForm = document.getElementById('poapForm');
    const modalClose = document.getElementById('modalClose');
    const skipPoap = document.getElementById('skipPoap');

    let currentNoteData = null;

    noteTextarea.addEventListener('input', function() {
        const currentLength = this.value.length;
        charCount.textContent = currentLength;
        if (currentLength > 450) {
            charCount.style.color = '#e17055';
        } else if (currentLength > 400) {
            charCount.style.color = '#fdcb6e';
        } else {
            charCount.style.color = '#636e72';
        }
    });

    noteForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const name = document.getElementById('name').value.trim();
        const note = noteTextarea.value.trim();
        
        if (!name || !note) {
            showNotification('Lütfen tüm alanları doldurun!', 'error');
            return;
        }
        
        btnText.style.display = 'none';
        btnLoading.style.display = 'block';
        submitBtn.disabled = true;
        
        try {
            currentNoteData = { name, note };
            await saveNoteToFirebase(name, note, null);
            showSuccessMessage();
            
            setTimeout(() => {
                showPoapModal();
            }, 1500);
            
            noteForm.reset();
            charCount.textContent = '0';
            charCount.style.color = '#636e72';
            
        } catch (error) {
            console.error('Not kaydedilirken hata:', error);
            showNotification('Not kaydedilirken bir hata oluştu!', 'error');
        } finally {
            btnText.style.display = 'block';
            btnLoading.style.display = 'none';
            submitBtn.disabled = false;
        }
    });

    poapForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const walletAddress = document.getElementById('walletAddress').value.trim() || null;
        const poapBtnText = this.querySelector('.btn-text');
        const poapBtnLoading = this.querySelector('.btn-loading');
        const poapSubmitBtn = this.querySelector('.btn-primary');
        
        if (walletAddress && !isValidEVMAddress(walletAddress)) {
            showNotification('Geçersiz EVM cüzdan adresi formatı. 0x ile başlayan geçerli bir adres girin.', 'error');
            return;
        }
        
        poapBtnText.style.display = 'none';
        poapBtnLoading.style.display = 'block';
        poapSubmitBtn.disabled = true;
        
        try {
            if (currentNoteData) {
                await saveNoteToFirebase(currentNoteData.name, currentNoteData.note, walletAddress);
            }
            
            closePoapModal();
            showNotification(walletAddress 
                ? 'POAP başarıyla kaydedildi! Yakında cüzdanınıza gönderilecek.' 
                : 'Teşekkürler! Notunuz kaydedildi.', 'success');
            
        } catch (error) {
            console.error('POAP kaydedilirken hata:', error);
            showNotification('İşlem gerçekleştirilirken bir hata oluştu!', 'error');
        } finally {
            poapBtnText.style.display = 'block';
            poapBtnLoading.style.display = 'none';
            poapSubmitBtn.disabled = false;
        }
    });

    modalClose.addEventListener('click', closePoapModal);
    skipPoap.addEventListener('click', function(e) {
        e.preventDefault();
        closePoapModal();
    });

    poapModal.addEventListener('click', function(e) {
        if (e.target === poapModal) {
            closePoapModal();
        }
    });

    function showPoapModal() {
        poapModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    function closePoapModal() {
        poapModal.style.display = 'none';
        document.body.style.overflow = 'auto';
        poapForm.reset();
    }

    function isValidEVMAddress(address) {
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    }

    function showSuccessMessage() {
        successMessage.style.display = 'block';
        
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 3000);
    }

    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#e17055' : '#00b894'};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 1000;
            animation: slideInRight 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                document.body.removeChild(notification);
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

    const formInputs = document.querySelectorAll('.form-input, .form-textarea');
    formInputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.style.transform = 'scale(1.02)';
            this.parentElement.style.transition = 'transform 0.2s ease';
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.style.transform = 'scale(1)';
        });
    });

    setTimeout(() => {
        document.querySelector('.header').style.animation = 'fadeInUp 0.8s ease-out';
    }, 100);
});
