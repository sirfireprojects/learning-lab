// ==========================================
// GITHUB BUTTON INTERACTION
// ==========================================

const githubLink = document.querySelector("#github-link");

githubLink.addEventListener("click", function () {

    if (githubLink.textContent.trim() === "View GitHub Profile") {
        githubLink.textContent = "Thanks for visiting!";
    } else {
        githubLink.textContent = "View GitHub Profile";
    }

});
