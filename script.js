const form = document.getElementById("contact-form");
const emailInput = document.getElementById("email");
const emailError = document.getElementById("email-error");
const status = document.getElementById("form-status");

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  emailError.textContent = "";
  status.textContent = "";

  const email = emailInput.value.trim();
  if (!isValidEmail(email)) {
    emailError.textContent = "Ingresá un correo válido.";
    emailInput.focus();
    return;
  }

  status.textContent = "Listo — este es un POC, no se envió nada a ningún servidor.";
  form.reset();
});
