export function initForms() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;

    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('name');
        const email = document.getElementById('email');
        const message = document.getElementById('message');
        let isValid = true;

        [name, email, message].forEach(field => {
            const error = field.parentElement.querySelector('.form-error');
            if (error) error.remove();
            field.style.borderColor = '';
        });

        if (!name.value.trim()) {
            showError(name, 'Name is required');
            isValid = false;
        }

        if (!email.value.trim()) {
            showError(email, 'Email is required');
            isValid = false;
        } else if (!isValidEmail(email.value)) {
            showError(email, 'Please enter a valid email');
            isValid = false;
        }

        if (!message.value.trim()) {
            showError(message, 'Message is required');
            isValid = false;
        }

        if (isValid) {
            const submitBtn = contactForm.querySelector('.btn');
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;

            setTimeout(() => {
                submitBtn.textContent = 'Message Sent';
                submitBtn.style.background = '#22c55e';
                contactForm.reset();
                setTimeout(() => {
                    submitBtn.textContent = 'Send Message';
                    submitBtn.disabled = false;
                    submitBtn.style.background = '';
                }, 3000);
            }, 1000);
        }
    });
}

function showError(field, message) {
    field.style.borderColor = '#ff3366';
    const error = document.createElement('p');
    error.className = 'form-error';
    error.textContent = message;
    error.style.color = '#ff3366';
    error.style.fontSize = '0.85rem';
    error.style.marginTop = '4px';
    field.parentElement.appendChild(error);
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
