export function initHeroSlider() {
    const slides = document.querySelectorAll('.hero-slide');
    if (!slides.length) return;

    let current = 0;
    const total = slides.length;
    let interval = setInterval(nextSlide, 5000);

    function goToSlide(index) {
        slides.forEach(s => s.classList.remove('active'));
        slides[index].classList.add('active');
        current = index;
    }

    function nextSlide() {
        goToSlide((current + 1) % total);
    }
}

export function initLightbox() {
    const lightbox = document.querySelector('.lightbox');
    const lightboxImg = lightbox.querySelector('.lightbox-image');
    const lightboxName = lightbox.querySelector('.lightbox-name');
    const lightboxRole = lightbox.querySelector('.lightbox-role');
    const lightboxBio = lightbox.querySelector('.lightbox-bio');
    const closeBtn = lightbox.querySelector('.lightbox-close');

    function openLightbox(src, alt, name, role, bio, isRound) {
        lightboxImg.src = src;
        lightboxImg.alt = alt;
        lightboxName.textContent = name;
        lightboxRole.textContent = role || '';
        if (lightboxBio) lightboxBio.innerHTML = bio || '';
        lightboxImg.classList.toggle('lightbox-image--round', isRound);
        lightbox.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    document.querySelectorAll('.team-photo-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            openLightbox(btn.dataset.image, btn.dataset.name, btn.dataset.name, btn.dataset.role, btn.dataset.bio, true);
        });
    });

    document.querySelectorAll('.koerant-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            openLightbox(btn.dataset.image, btn.dataset.name || '', btn.dataset.name || '', '', '', false);
        });
    });

    function closeLightbox() {
        lightbox.classList.remove('open');
        document.body.style.overflow = '';
    }

    closeBtn.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeLightbox();
    });
}

export function initNavigation() {
    const yearEl = document.getElementById('year');
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }

    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.nav');

    if (menuToggle && nav) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('open');
            nav.classList.toggle('open');
            const isOpen = nav.classList.contains('open');
            menuToggle.setAttribute('aria-expanded', isOpen);
        });

        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                const dropdown = link.closest('.nav-dropdown');
                if (dropdown && window.innerWidth <= 767) {
                    const isTrigger = dropdown.querySelector(':scope > .nav-link') === link;
                    if (isTrigger) {
                        e.preventDefault();
                        dropdown.classList.toggle('open');
                        return;
                    }
                }
                menuToggle.classList.remove('open');
                nav.classList.remove('open');
                menuToggle.setAttribute('aria-expanded', 'false');
            });
        });

        document.querySelectorAll('.dropdown-menu .nav-link').forEach(link => {
            link.addEventListener('click', () => {
                menuToggle.classList.remove('open');
                nav.classList.remove('open');
                menuToggle.setAttribute('aria-expanded', 'false');
            });
        });
    }

    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath) {
            link.classList.add('active');
        }
    });
}
