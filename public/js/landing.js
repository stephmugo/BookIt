document.addEventListener('DOMContentLoaded', function() {
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        const dropdowns = document.querySelectorAll('.dropdown');
        dropdowns.forEach(dropdown => {
            if (!dropdown.contains(e.target)) {
                const menu = dropdown.querySelector('.dropdown-menu');
                menu.style.opacity = '0';
                menu.style.visibility = 'hidden';
                menu.style.transform = 'translateY(-10px)';
            }
        });
    });

    // Handle mobile touch events
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('touchstart', function(e) {
            e.preventDefault();
            const menu = this.nextElementSibling;
            const isVisible = menu.style.visibility === 'visible';

            // Close all other dropdowns
            document.querySelectorAll('.dropdown-menu').forEach(m => {
                if (m !== menu) {
                    m.style.opacity = '0';
                    m.style.visibility = 'hidden';
                    m.style.transform = 'translateY(-10px)';
                }
            });

            // Toggle current dropdown
            menu.style.opacity = isVisible ? '0' : '1';
            menu.style.visibility = isVisible ? 'hidden' : 'visible';
            menu.style.transform = isVisible ? 'translateY(-10px)' : 'translateY(0)';
        });
    });
}); 