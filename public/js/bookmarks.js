document.addEventListener('DOMContentLoaded', function() {
    // Handle bookmark button clicks
    document.querySelectorAll('.bookmark-btn').forEach(button => {
        button.addEventListener('click', async function() {
            const businessId = this.dataset.id;
            
            try {
                const response = await fetch('/api/toggle-bookmark', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ businessId })
                });

                const data = await response.json();
                
                if (data.success) {
                    // Remove the card with animation
                    const card = this.closest('.business-card');
                    card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.9)';
                    
                    setTimeout(() => {
                        card.remove();
                        
                        // Check if there are no more cards
                        const remainingCards = document.querySelectorAll('.business-card');
                        if (remainingCards.length === 0) {
                            location.reload(); // Reload to show empty state
                        }
                    }, 300);
                }
            } catch (error) {
                console.error('Error toggling bookmark:', error);
            }
        });
    });
}); 