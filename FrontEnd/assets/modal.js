const photoModal = document.querySelector("#photo-modal");
const editGalleryButton = document.querySelector("#edit-gallery");
const modalTitle = document.querySelector("#modal-title");
const modalBackButton = document.querySelector("#modal-back");
const galleryView = document.querySelector("#modal-gallery-view");
const addView = document.querySelector("#modal-add-view");
const addPhotoForm = document.querySelector("#add-photo-form");
const categorySelect = document.querySelector("#photo-category");
const formMessage = document.querySelector("#modal-form-message");
let categoriesLoaded = false;
let categoriesLoading = false;

// Le token détermine l'affichage du mode édition. L'API contrôlera les actions autorisées.
function hasSession() {
	try {
		return Boolean(sessionStorage.getItem("token"));
	} catch {
		return false;
	}
}

const isLoggedIn = hasSession();
document.querySelector("#edit-banner").hidden = !isLoggedIn;
editGalleryButton.hidden = !isLoggedIn;
document.querySelector(".filters").hidden = isLoggedIn;
document.body.classList.toggle("editing", isLoggedIn);

if (isLoggedIn) {
	const loginLink = document.querySelector("#login-link");
	loginLink.textContent = "logout";
	loginLink.href = "./index.html";
	loginLink.addEventListener("click", () => {
		sessionStorage.removeItem("token");
	});
}

// Réutilise les projets déjà récupérés pour remplir la galerie de la modale.
function displayModalWorks(works) {
	const modalGallery = document.querySelector("#modal-gallery");
	modalGallery.replaceChildren();

	works.forEach((work) => {
		const figure = document.createElement("figure");
		const image = document.createElement("img");
		image.src = work.imageUrl;
		image.alt = work.title;

		const deleteButton = document.createElement("button");
		deleteButton.type = "button";
		deleteButton.className = "delete-photo";
		deleteButton.setAttribute("aria-label", `Supprimer ${work.title}`);
		// La suppression sera branchée à l'étape 3.2.
		deleteButton.disabled = true;
		const icon = document.createElement("img");
		icon.src = "./assets/icons/trash.svg";
		icon.alt = "";
		deleteButton.appendChild(icon);

		figure.append(image, deleteButton);
		modalGallery.appendChild(figure);
	});

	document.querySelector("#modal-gallery-message").textContent = works.length === 0
		? "Aucun projet à afficher."
		: "";
}

function showModalView(view) {
	const showAdd = view === "add";
	galleryView.hidden = showAdd;
	addView.hidden = !showAdd;
	modalBackButton.hidden = !showAdd;
	modalTitle.textContent = showAdd ? "Ajout photo" : "Galerie photo";
	photoModal.scrollTop = 0;
	if (photoModal.open) modalTitle.focus();
}

async function loadPhotoCategories() {
	if (categoriesLoaded || categoriesLoading) return;
	categoriesLoading = true;
	categorySelect.disabled = true;
	formMessage.textContent = "Chargement des catégories…";

	try {
		const response = await fetch("http://localhost:5678/api/categories");
		if (!response.ok) throw new Error(`Erreur HTTP : ${response.status}`);
		const categories = await response.json();

		categories.forEach((category) => {
			const option = document.createElement("option");
			option.value = category.id;
			option.textContent = category.name;
			categorySelect.appendChild(option);
		});

		categoriesLoaded = true;
		formMessage.textContent = "";
	} catch {
		formMessage.textContent = "Impossible de charger les catégories. Revenez à la galerie puis réessayez.";
	} finally {
		categoriesLoading = false;
		categorySelect.disabled = false;
	}
}

editGalleryButton.addEventListener("click", () => {
	if (!hasSession() || photoModal.open) return;
	showModalView("gallery");
	photoModal.showModal();
	document.body.classList.add("modal-open");
});

document.querySelector("#modal-close").addEventListener("click", () => photoModal.close());
modalBackButton.addEventListener("click", () => showModalView("gallery"));
document.querySelector("#show-add-photo").addEventListener("click", () => {
	showModalView("add");
	loadPhotoCategories();
});

// Un clic sur le fond ferme la modale ; un clic dans son contenu la laisse ouverte.
let clickStartedOutside = false;
photoModal.addEventListener("pointerdown", (event) => {
	const bounds = photoModal.getBoundingClientRect();
	clickStartedOutside = event.clientX < bounds.left || event.clientX > bounds.right
		|| event.clientY < bounds.top || event.clientY > bounds.bottom;
});
photoModal.addEventListener("click", (event) => {
	const bounds = photoModal.getBoundingClientRect();
	const outside = event.clientX < bounds.left || event.clientX > bounds.right
		|| event.clientY < bounds.top || event.clientY > bounds.bottom;
	if (clickStartedOutside && outside) photoModal.close();
	clickStartedOutside = false;
});

// Le dialogue natif gère Échap et garde la navigation au clavier dans la modale.
photoModal.addEventListener("close", () => {
	document.body.classList.remove("modal-open");
	addPhotoForm.reset();
	showModalView("gallery");
	editGalleryButton.focus();
});

// L'envoi de la photo sera ajouté à l'étape 3.3.
addPhotoForm.addEventListener("submit", (event) => event.preventDefault());
