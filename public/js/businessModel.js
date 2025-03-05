document.addEventListener('DOMContentLoaded', function() {
    // Toggle mobile options visibility based on service type
    const serviceTypeSelect = document.querySelector('select[name="serviceType"]');
    const mobileOptions = document.getElementById('mobileOptions');

    const staffSelect = document.querySelector('select[name="staffIds"]');
        staffSelect.setAttribute('multiple', true);
        staffSelect.classList.add('multiple-select');

    if (serviceTypeSelect && mobileOptions) {
        function toggleMobileOptions() {
            const selectedValue = serviceTypeSelect.value;
            mobileOptions.style.display = 
                (selectedValue === 'mobile' || selectedValue === 'both') ? 'block' : 'none';
        }

        serviceTypeSelect.addEventListener('change', toggleMobileOptions);
        toggleMobileOptions(); // Initial state
    }

    // Image preview functionality
    const imageInput = document.querySelector('input[name="serviceImages"]');
    if (imageInput) {
        imageInput.addEventListener('change', function(e) {
            const files = Array.from(e.target.files);
            const previewContainer = document.createElement('div');
            previewContainer.className = 'image-preview';
            
            files.forEach(file => {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.style.maxWidth = '100px';
                    img.style.maxHeight = '100px';
                    previewContainer.appendChild(img);
                }
                reader.readAsDataURL(file);
            });

            // Replace existing preview if any
            const existingPreview = imageInput.parentElement.querySelector('.image-preview');
            if (existingPreview) {
                existingPreview.remove();
            }
            imageInput.parentElement.appendChild(previewContainer);
        });
    }

    // Form submission handling with validation
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            try {
                const formData = new FormData(form);
                const response = await fetch(form.action, {
                    method: form.method,
                    body: formData
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const result = await response.json();
                if (result.success) {
                    // Show success message
                    showNotification('Success!', 'success');
                    // Optionally refresh the page or update the UI
                    setTimeout(() => location.reload(), 1500);
                } else {
                    throw new Error(result.message || 'Something went wrong');
                }
            } catch (error) {
                showNotification(error.message, 'error');
            }
        });
    });

    // Update the form submission handling
    document.getElementById('categoryForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        try {
            const formData = new FormData(this);
            const data = {
                categoryName: formData.get('categoryName'),
                categoryDescription: formData.get('categoryDescription')
            };

            const response = await fetch('/admin/add-category', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const result = await response.json();
            if (result.success) {
                // Show success message
                showNotification('Category added successfully!', 'success');
                // Optionally refresh the page or update the UI
                setTimeout(() => location.reload(), 1500);
                } else {
                throw new Error(result.message || 'Something went wrong');
            }
        } catch (error) {
            showNotification(error.message, 'error');
        }
    });

    document.getElementById('scheduleForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        try {
            const formData = new FormData(this);
            const data = {};
            
            // Convert FormData to regular object
            for (let i = 0; i < 7; i++) {
                data[`openTime_${i}`] = formData.get(`openTime_${i}`);
                data[`closeTime_${i}`] = formData.get(`closeTime_${i}`);
                data[`isOpen_${i}`] = formData.get(`isOpen_${i}`) === 'on' ? 'on' : 'off';
            }

            const response = await fetch('/admin/save-schedule', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams(data)
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            // Redirect after successful submission
            window.location.href = '/admin/business-model';
        } catch (error) {
            console.error('Error:', error);
            showNotification('Error saving schedule', 'error');
        }
    });

    document.getElementById('branchForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        try {
            const formData = new FormData(this);
            const data = {
                branchName: formData.get('branchName'),
                address: formData.get('address'),
                telephone: formData.get('telephone'),
                isPrimary: formData.get('isPrimary') === 'true'
            };

            const response = await fetch('/admin/add-branch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const result = await response.json();
            if (result.success) {
                showNotification('Branch added successfully!', 'success');
                setTimeout(() => location.reload(), 1500);
                } else {
                throw new Error(result.message || 'Something went wrong');
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification(error.message, 'error');
        }
    });

    document.getElementById('staffForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        try {
            const formData = new FormData(this);
            const data = {
                staffName: formData.get('staffName'),
                position: formData.get('position')
            };

            const response = await fetch('/admin/add-staff', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const result = await response.json();
            if (result.success) {
                showNotification('Staff member added successfully!', 'success');
                setTimeout(() => location.reload(), 1500);
                } else {
                throw new Error(result.message || 'Something went wrong');
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification(error.message, 'error');
        }
    });

    // Tab switching functionality
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabSections = document.querySelectorAll('.model-section');

    function switchTab(tabId) {
        // Remove active class from all buttons and sections
        tabButtons.forEach(button => button.classList.remove('active'));
        tabSections.forEach(section => section.classList.remove('active'));

        // Add active class to clicked button and corresponding section
        const activeButton = document.querySelector(`[data-tab="${tabId}"]`);
        const activeSection = document.getElementById(tabId);

        if (activeButton && activeSection) {
            activeButton.classList.add('active');
            activeSection.classList.add('active');
        }

        // Save active tab to localStorage
        localStorage.setItem('activeBusinessModelTab', tabId);
    }

    // Add click event listeners to tab buttons
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            switchTab(button.dataset.tab);
        });
    });

    // Restore active tab from localStorage or default to first tab
    const savedTab = localStorage.getItem('activeBusinessModelTab');
    if (savedTab && document.getElementById(savedTab)) {
        switchTab(savedTab);
    } else {
        switchTab('categories-section');
    }
});

// Notification helper function
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
        
        setTimeout(() => {
        notification.remove();
    }, 3000);
}