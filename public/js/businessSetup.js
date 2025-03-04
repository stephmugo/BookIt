document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('.setup-form');
    const steps = document.querySelectorAll('.setup-step');
    const progressSteps = document.querySelectorAll('.progress-step');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    const submitBtn = document.querySelector('.submit-btn');
    let currentStep = 1;

    // Handle step navigation
    function showStep(step) {
        steps.forEach(s => s.classList.remove('active'));
        progressSteps.forEach(p => p.classList.remove('active'));
        
        document.querySelector(`[data-step="${step}"]`).classList.add('active');
        progressSteps[step - 1].classList.add('active');

        prevBtn.disabled = step === 1;
        if (step === steps.length) {
            nextBtn.style.display = 'none';
            submitBtn.style.display = 'block';
        } else {
            nextBtn.style.display = 'block';
            submitBtn.style.display = 'none';
        }
    }

    nextBtn.addEventListener('click', () => {
        if (currentStep < steps.length) {
            currentStep++;
            showStep(currentStep);
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentStep > 1) {
            currentStep--;
            showStep(currentStep);
        }
    });

    // Image preview handling
    function handleImagePreview(input, previewId) {
        const preview = document.getElementById(previewId);
        input.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    preview.querySelector('img').src = e.target.result;
                }
                reader.readAsDataURL(file);
            }
        });
    }

    handleImagePreview(document.getElementById('businessLogo'), 'logoPreview');
    handleImagePreview(document.getElementById('backgroundImage'), 'bgPreview');

    // Character count for description
    const description = document.getElementById('description');
    const charCount = document.querySelector('.character-count');
    
    description.addEventListener('input', function() {
        const count = this.value.length;
        charCount.textContent = `${count}/500`;
        if (count > 500) {
            charCount.style.color = 'red';
        } else {
            charCount.style.color = 'inherit';
        }
    });

    // Form validation
    form.addEventListener('submit', function(e) {
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!field.value) {
                isValid = false;
                field.classList.add('error');
            } else {
                field.classList.remove('error');
            }
        });

        if (!isValid) {
            e.preventDefault();
            alert('Please fill in all required fields');
        }
    });
});