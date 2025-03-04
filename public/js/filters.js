document.addEventListener('DOMContentLoaded', function() {
    const filtersForm = document.getElementById('filters-form');
    const clearFiltersBtn = document.querySelector('.clear-filters');
    const industryCheckboxes = document.querySelectorAll('input[name="industry"]');
    
    // Update selected count
    function updateSelectedCount() {
        const selectedCount = document.querySelectorAll('input[name="industry"]:checked').length;
        const countElement = document.querySelector('.filter-section-header .selected-count');
        if (selectedCount > 0) {
            countElement.textContent = `${selectedCount} selected`;
        } else {
            countElement.textContent = '';
        }
    }

    // Handle checkbox changes
    industryCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            updateSelectedCount();
            applyFilters();
        });
    });

    // Clear filters
    clearFiltersBtn.addEventListener('click', () => {
        filtersForm.reset();
        updateSelectedCount();
        applyFilters();
    });

    // Apply filters function
    function applyFilters() {
        const formData = new FormData(filtersForm);
        const params = new URLSearchParams(formData);
        
        // Get current URL and update only the filter parameters
        const url = new URL(window.location.href);
        for (const [key, value] of params.entries()) {
            url.searchParams.set(key, value);
        }
        
        // Redirect to updated URL
        window.location.href = url.toString();
    }

    // Initialize selected count
    updateSelectedCount();
}); 