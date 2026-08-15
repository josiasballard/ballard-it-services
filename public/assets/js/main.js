/* =========================================================
   MOBILE NAVIGATION
   ========================================================= */

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


/* =========================================================
   SUPPORT REQUEST FORM
   ========================================================= */

const supportForm = document.getElementById("support-form");

if (supportForm) {
    const submitButton = document.getElementById("support-submit");
    const statusMessage = document.getElementById("support-form-status");

    supportForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        // Use the browser's built-in form validation.
        if (!supportForm.checkValidity()) {
            supportForm.reportValidity();
            return;
        }

        const originalButtonText = submitButton.textContent;

        // Prevent duplicate submissions while the request is processing.
        submitButton.disabled = true;
        submitButton.textContent = "Sending...";

        statusMessage.textContent = "Sending your request...";
        statusMessage.classList.remove("is-success", "is-error");

        try {
            const formData = new FormData(supportForm);

            const response = await fetch(supportForm.action, {
                method: "POST",
                body: formData
            });

            let result;

            try {
                result = await response.json();
            } catch {
                throw new Error("Invalid response from support service.");
            }

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "Your request could not be sent."
                );
            }

            // Successful submission.
            statusMessage.textContent =
                "Support request sent. I'll be in touch shortly.";

            statusMessage.classList.add("is-success");

            // Clear the form only after a successful submission.
            supportForm.reset();

        } catch (error) {
            console.error("Support form submission error:", error);

            statusMessage.textContent =
                "Something went wrong. Please call (605) 646-8291 or email support@ballardit.com.";

            statusMessage.classList.add("is-error");

        } finally {
            // Restore the button whether the request succeeded or failed.
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    });
}