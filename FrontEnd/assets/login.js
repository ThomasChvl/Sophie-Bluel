// Étape 2.1 : le formulaire reste sans envoi en attendant l'authentification.
document.querySelector("#login-form").addEventListener("submit", (event) => {
	event.preventDefault();
});
