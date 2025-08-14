        const texts = [
            "NO, WE WON'T SHUT UP.",
            "NO, WE WON'T GO AWAY.",
            "NO, WE'RE NOT MOVING ON.",
            "NO, IT'S NOT JUST US.",
            "YES, YOU WILL LISTEN."
        ];
        
        let currentIndex = 0;
        const heroText = document.getElementById('heroText');
        
        function changeText() {
            setTimeout(() => {
                heroText.textContent = texts[currentIndex];
                currentIndex = (currentIndex + 1) % texts.length;
            }, 500);
        }
        
        // Initial text
        heroText.textContent = texts[0];
        
        // Change text every 6 seconds (longer display time)
        setInterval(changeText, 6000);