const loginForm = document.querySelector("#login-form");
const loginError = document.querySelector("#login-error");
const loginButton = loginForm.querySelector("button[type='submit']");

loginForm.addEventListener("submit", async (event) => {
	event.preventDefault();

	if (loginButton.disabled) return;

	loginError.textContent = "";
	loginButton.disabled = true;
	loginButton.textContent = "Connexion en cours…";

	// Limite l'attente si le serveur ne répond pas.
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 10000);

	try {
		const response = await fetch("http://localhost:5678/api/users/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				email: loginForm.elements.email.value.trim(),
				password: loginForm.elements.password.value,
			}),
			signal: controller.signal,
		});

		if (response.status === 401 || response.status === 404) {
			loginError.textContent = "E-mail ou mot de passe incorrect.";
			return;
		}

		if (!response.ok) {
			loginError.textContent = "La connexion est indisponible pour le moment. Veuillez réessayer plus tard.";
			return;
		}

		const data = await response.json();

		if (typeof data.token !== "string" || data.token.trim() === "") {
			loginError.textContent = "La connexion n’a pas pu être confirmée. Veuillez réessayer.";
			return;
		}

		// Conserve uniquement le token dans cet onglet pour les futures actions autorisées.
		sessionStorage.setItem("token", data.token);
		window.location.assign("./index.html");
	} catch (error) {
		loginError.textContent = "Impossible de se connecter. Vérifiez votre connexion et réessayez.";
	} finally {
		clearTimeout(timeout);
		loginButton.disabled = false;
		loginButton.textContent = "Se connecter";
	}
});
