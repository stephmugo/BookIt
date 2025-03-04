document.addEventListener('DOMContentLoaded', function() {
    const bookButtons = document.querySelectorAll('.book-btn');
    const modal = document.getElementById('bookingModal');
    const closeModal = document.querySelector('.close-modal');
    const bookingForm = document.getElementById('bookingForm');

    // Handle booking button clicks
    bookButtons.forEach(button => {
        button.addEventListener('click', () => {
            const serviceId = button.dataset.serviceId;
            const serviceName = button.dataset.serviceName;
            const duration = button.dataset.serviceDuration;
            const price = button.dataset.servicePrice;

            // Populate modal
            document.getElementById('serviceId').value = serviceId;
            document.getElementById('serviceName').value = serviceName;
            document.getElementById('serviceDuration').textContent = `${duration} minutes`;
            document.getElementById('servicePrice').textContent = `$${parseFloat(price).toFixed(2)}`;

            // Show modal
            modal.style.display = 'block';
            populateTimeSlots();
        });
    });

    // Close modal
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Handle form submission
    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(bookingForm);
        try {
            const response = await fetch('/api/book-appointment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(Object.fromEntries(formData))
            });

            const data = await response.json();
            if (data.success) {
                alert('Appointment booked successfully!');
                modal.style.display = 'none';
            } else {
                alert(data.error || 'Failed to book appointment');
            }
        } catch (error) {
            console.error('Error booking appointment:', error);
            alert('Failed to book appointment');
        }
    });

    // Populate time slots based on service duration
    function populateTimeSlots() {
        const timeSelect = document.getElementById('time');
        timeSelect.innerHTML = '';
        
        // Add time slots from 9 AM to 5 PM
        for (let hour = 9; hour < 17; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                const option = document.createElement('option');
                option.value = time;
                option.textContent = time;
                timeSelect.appendChild(option);
            }
        }
    }

    // Handle image loading errors
    const businessLogo = document.querySelector('.business-logo img');
    const heroSection = document.querySelector('.hero-section');
    
    businessLogo?.addEventListener('error', function(e) {
        console.log('Logo failed to load, using default');
        e.target.src = '/img/default-logo.jpg';
        e.target.classList.add('error');
    });

    // Ensure hero section has a background
    if (heroSection && !heroSection.style.backgroundImage) {
        heroSection.style.backgroundImage = 'url("/img/default-business.jpg")';
    }

    // Bookmark functionality
    const bookmarkBtn = document.querySelector('.bookmark-btn');
    if (bookmarkBtn) {
        bookmarkBtn.addEventListener('click', async function() {
            const businessId = this.dataset.id;
            try {
                const response = await fetch('/api/toggle-bookmark', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ businessId: businessId })
                });

                const data = await response.json();
                
                if (data.success) {
                    // Toggle the bookmark icon
                    const icon = this.querySelector('i');
                    if (data.bookmarked) {
                        icon.classList.remove('bi-bookmark');
                        icon.classList.add('bi-bookmark-fill');
                    } else {
                        icon.classList.remove('bi-bookmark-fill');
                        icon.classList.add('bi-bookmark');
                    }
                } else {
                    console.error('Failed to toggle bookmark');
                }
            } catch (error) {
                console.error('Error toggling bookmark:', error);
            }
        });
    }
}); 