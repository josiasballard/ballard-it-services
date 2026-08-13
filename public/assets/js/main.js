const menuToggle = document.querySelector(".menu-toggle");
const mobileNav = document.querySelector("[data-mobile-nav]");

if (menuToggle && mobileNav) {
    menuToggle.addEventListener("click", () => {
        const isOpen = mobileNav.classList.toggle("is-open");

        menuToggle.setAttribute("aria-expanded", String(isOpen));
        menuToggle.setAttribute(
            "aria-label",
            isOpen ? "Close navigation" : "Open navigation"
        );
    });

    mobileNav.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
            mobileNav.classList.remove("is-open");
            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.setAttribute("aria-label", "Open navigation");
        });
    });
}