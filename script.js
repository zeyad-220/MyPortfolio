document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger');
    const nav = document.querySelector('nav');

    hamburger.addEventListener('click', () => {
        nav.classList.toggle('active');
    });

    const homeLink = document.querySelector('a[href="#home"]');
    homeLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    const toggleButton = document.getElementById('toggleButton');
    const moreText = document.getElementById('moreText');

    toggleButton.addEventListener('click', () => {
        if (moreText.style.display === 'none') {
            moreText.style.display = 'inline';
            toggleButton.textContent = ' Show Less';
        } else {
            moreText.style.display = 'none';
            toggleButton.textContent = ' Show More ';
        }
    });

    const typingElement = document.getElementById('typing');
    const words = ["Front-End Web Developer", "Computer Technician", "Hr Recruiter", "Cold Caller", "Voice Actor"];
    let wordIndex = 0;
    let letterIndex = 0;
    let currentWord = '';
    let currentLetters = '';
    let isDeleting = false;

    function type() {
        if (isDeleting) {
            currentLetters = currentWord.substring(0, letterIndex - 1);
            letterIndex--;
        } else {
            currentLetters = currentWord.substring(0, letterIndex + 1);
            letterIndex++;
        }

        typingElement.innerHTML = currentLetters;

        let typeSpeed = 200;
        if (isDeleting) {
            typeSpeed /= 2;
        }

        if (!isDeleting && letterIndex === currentWord.length) {
            typeSpeed = 2000;
            isDeleting = true;
        } else if (isDeleting && letterIndex === 0) {
            isDeleting = false;
            wordIndex++;
            if (wordIndex === words.length) {
                wordIndex = 0;
            }
            currentWord = words[wordIndex];
            typeSpeed = 500;
        }

        setTimeout(type, typeSpeed);
    }

    currentWord = words[wordIndex];
    type();

    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        const logo = document.getElementById('logo');
        const profile = document.getElementById('profile');
        if (document.body.classList.contains('light-mode')) {
            logo.src = 'logo-light.png'; // Update to your light mode logo
            profile.src = 'profile-light.jpg'; // Update to your light mode profile image
        } else {
            logo.src = 'logo-dark.png'; // Update to your dark mode logo
            profile.src = 'profile-dark.jpg'; // Update to your dark mode profile image
        }
    });
});
    emailjs.init("bVz_AOZpAbCR2gADo");

    function sendMessage() {
    var name = document.getElementById("name").value;
    var email = document.getElementById("email").value;
    var message = document.getElementById("message").value;
    var responseMessage = document.getElementById("response-message");

    // Check if fields are filled
    if (!name || !email || !message) {
        responseMessage.style.display = "block";
        responseMessage.innerText = "Please fill in all fields.";
        responseMessage.style.backgroundColor = "orange";
        return;
    }

    // Send email via EmailJS
    emailjs.send("service_ug6050e", "template_bge8w3g", {
        name: name,
        email: email,
        message: message
    }).then(function(response) {
        responseMessage.style.display = "block";
        responseMessage.innerText = "Message sent successfully!";
        responseMessage.style.backgroundColor = "green";
    }, function(error) {
        responseMessage.style.display = "block";
        responseMessage.innerText = "Failed to send message. Check console for details.";
        responseMessage.style.backgroundColor = "red";
        console.error("EmailJS Error:", error);
    });
}
