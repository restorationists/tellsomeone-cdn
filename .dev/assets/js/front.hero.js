// Smooth hero text animation with proper timing
const texts = [
    "NO, WE WON'T SHUT UP.",
    "NO, WE WON'T GO AWAY.",
    "NO, WE'RE NOT MOVING ON.",
    "NO, IT'S NOT JUST US.",
    "NO, WE'RE NOT OVERREACTING.",
    "NO, WE'RE NOT MAKING IT UP.",
    "NO, IT'S NOT ANCIENT HISTORY.",
    "NO, IT'S NOT 'RACIST.'",
    "YES, LITTLE GIRLS MATTER.",
    "YES, YOU WILL LISTEN."
];

let currentIndex = 0;
const heroText = document.getElementById('heroText');

function animateTextChange() {
    // Check if we're on the last statement
    const nextIndex = (currentIndex + 1) % texts.length;
    const isLastStatement = nextIndex === (texts.length - 1);
    
    // Start fade out
    heroText.style.transition = 'opacity 0.4s ease-out, transform 0.4s ease-out';
    heroText.style.opacity = '0';
    heroText.style.transform = 'translateY(30px) scale(0.9)';
    
    // Change text after fade out completes
    setTimeout(() => {
        currentIndex = nextIndex;
        heroText.textContent = texts[currentIndex];
        
        // Start fade in
        setTimeout(() => {
            heroText.style.transition = 'opacity 0.6s ease-in, transform 0.6s ease-in';
            heroText.style.opacity = '1';
            heroText.style.transform = 'translateY(0) scale(1)';
        }, 50); // Small delay for smooth transition
        
    }, 400); // Wait for fade out to complete
    
    // Return whether this is the last statement (for timing)
    return isLastStatement;
}

// Initialize with first text
heroText.textContent = texts[0];
heroText.style.opacity = '1';
heroText.style.transform = 'translateY(0) scale(1)';

// Start the animation cycle after initial delay
setTimeout(() => {
    function runCycle() {
        const isLastStatement = animateTextChange();
        
        // Set next timeout based on whether it's the last statement
        const nextDelay = isLastStatement ? 8000 : 4000; // Double time for "YES, YOU WILL LISTEN"
        
        setTimeout(runCycle, nextDelay);
    }
    
    runCycle();
}, 3000); // Show first text for 3 seconds before starting cycle