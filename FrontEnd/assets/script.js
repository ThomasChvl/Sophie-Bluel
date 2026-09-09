const gallery = document.querySelector(".gallery");
const galleryMessage = document.querySelector("#gallery-message");
const filters = document.querySelector(".filters");

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

	galleryMessage.textContent = works.length === 0 ? "Aucun projet à afficher." : "";
}

// Les catégories sont déjà présentes dans les projets : on garde chacune une seule fois.
function displayFilters(works) {
	const categoryIds = new Set();
	const categories = [{ id: null, name: "Tous" }];

	works.forEach((work) => {
		if (!categoryIds.has(work.category.id)) {
			categoryIds.add(work.category.id);
			categories.push(work.category);
		}
	});

	filters.replaceChildren();

	categories.forEach((category) => {
		const button = document.createElement("button");
		button.type = "button";
		button.textContent = category.name;
		button.setAttribute("aria-pressed", String(category.id === null));
		button.setAttribute("aria-controls", "gallery");

		button.addEventListener("click", () => {
			// Le filtrage utilise les projets déjà chargés, sans rappeler l'API.
			const filteredWorks = category.id === null
				? works
				: works.filter((work) => work.categoryId === category.id);

			displayWorks(filteredWorks);

			filters.querySelectorAll("button").forEach((filterButton) => {
				filterButton.setAttribute("aria-pressed", String(filterButton === button));
			});
		});

		filters.appendChild(button);
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
		displayFilters(works);
		displayModalWorks(works);
	} catch (error) {
		console.error("Impossible de récupérer les projets :", error);
		galleryMessage.textContent = "Impossible de charger les projets. Veuillez réessayer plus tard.";
		document.querySelector("#modal-gallery-message").textContent = galleryMessage.textContent;
	}
}

loadWorks();
