document.querySelectorAll('.upload-item input[type="file"]').forEach(function(input) {
    input.addEventListener('change', function() {
        var item = this.closest('.upload-item');
        if (this.files && this.files.length > 0) {
            item.classList.add('has-file');
        } else {
            item.classList.remove('has-file');
        }
    });
});

document.getElementById('ficaForm').addEventListener('submit', function(e) {
    e.preventDefault();
    var form = this;
    var submitBtn = form.querySelector('button[type="submit"]');
    var originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'SENDING...';

    var formData = new FormData(form);

    fetch('/api/send-fica.php', {
        method: 'POST',
        body: formData
    })
    .then(function(response) {
        return response.json().then(function(payload) {
            return { ok: response.ok, payload: payload };
        });
    })
    .then(function(result) {
        if (result.ok && result.payload.success) {
            alert('Thank you. Your FICA form has been sent to vicki@matlaw.africa. We will contact you shortly.');
            form.reset();
            document.querySelectorAll('.upload-item').forEach(function(item) {
                item.classList.remove('has-file');
            });
        } else {
            alert(result.payload.error || 'Could not send the form. Please try again later.');
        }
    })
    .catch(function() {
        alert('Could not send the form. Please try again later.');
    })
    .finally(function() {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    });
});
