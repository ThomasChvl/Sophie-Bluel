const gallery = document.querySelector(".gallery");
const galleryMessage = document.querySelector("#gallery-message");

// Crée une carte pour chaque projet reçu depuis l'API.
function displayWorks(works) {
	gallery.replaceChildren();

	works.forEach((work) => {
		const figure = document.createElement("figure");
		const image = document.createElement("img");
		const caption = document.createElement("figcaption");

		image.src = work.imageUrl;
		image.alt = work.title;
		caption.textContent = work.title;

		figure.append(image, caption);
		gallery.appendChild(figure);
	});
}

// Récupère les projets et signale un éventuel problème de chargement.
async function loadWorks() {
	galleryMessage.textContent = "Chargement des projets…";

	try {
		const response = await fetch("http://localhost:5678/api/works");

		if (!response.ok) {
			throw new Error(`Erreur HTTP : ${response.status}`);
		}

		const works = await response.json();
		displayWorks(works);
		galleryMessage.textContent = works.length === 0 ? "Aucun projet à afficher." : "";
	} catch (error) {
		console.error("Impossible de récupérer les projets :", error);
		galleryMessage.textContent = "Impossible de charger les projets. Veuillez réessayer plus tard.";
	}
}

loadWorks();
