const photoFile = document.querySelector("#photo-file");
const photoTitle = document.querySelector("#photo-title");
const photoPreview = document.querySelector("#photo-preview");
const photoUpload = document.querySelector(".photo-upload");
const uploadButton = document.querySelector("#upload-photo");
const uploadError = document.querySelector("#photo-upload-error");
const uploadLogin = document.querySelector("#photo-upload-login");
const photoFields = document.querySelector("#photo-fields");
let uploadInProgress = false;
let previewUrl = null;
let photoReady = false;

function getPhotoFileError(file) {
	if (!file) return "Choisissez une photo.";
	if (!["image/jpeg", "image/png"].includes(file.type)) return "Choisissez une image au format JPG ou PNG.";
	if (file.size === 0) return "Le fichier sélectionné est vide.";
	if (file.size > 4 * 1024 * 1024) return "La photo doit peser au maximum 4 Mo.";
	return "";
}

function getPhotoFormError() {
	const fileError = getPhotoFileError(photoFile.files[0]);
	if (fileError) return fileError;
	if (!photoReady) return "Veuillez attendre le chargement de la photo.";
	if (!photoTitle.value.trim()) return "Renseignez le titre du projet.";
	if (!photoCategories.some((category) => category.id === Number(categorySelect.value))) {
		return "Choisissez une catégorie.";
	}
	return "";
}

function updateUploadButton() {
	uploadButton.disabled = uploadInProgress || Boolean(getPhotoFormError());
}

function clearPhotoPreview() {
	photoReady = false;
	photoPreview.onload = null;
	photoPreview.onerror = null;
	photoPreview.removeAttribute("src");
	photoPreview.hidden = true;
	if (previewUrl) URL.revokeObjectURL(previewUrl);
	previewUrl = null;
	photoUpload.classList.remove("has-preview");
	document.querySelector(".photo-placeholder").hidden = false;
	document.querySelector("#photo-help").hidden = false;
	document.querySelector(".photo-upload-label").textContent = "+ Ajouter photo";
}

function resetPhotoForm() {
	addPhotoForm.reset();
	clearPhotoPreview();
	uploadError.textContent = "";
	uploadLogin.hidden = true;
	updateUploadButton();
}

photoFile.addEventListener("change", () => {
	clearPhotoPreview();
	const file = photoFile.files[0];
	uploadError.textContent = getPhotoFileError(file);
	updateUploadButton();
	if (uploadError.textContent) return;

	// L'aperçu reste local : le fichier sera envoyé uniquement à la validation.
	previewUrl = URL.createObjectURL(file);
	photoPreview.onload = () => {
		photoReady = true;
		photoPreview.hidden = false;
		photoUpload.classList.add("has-preview");
		document.querySelector(".photo-placeholder").hidden = true;
		document.querySelector("#photo-help").hidden = true;
		document.querySelector(".photo-upload-label").textContent = "Changer de photo";
		updateUploadButton();
	};
	photoPreview.onerror = () => {
		clearPhotoPreview();
		photoFile.value = "";
		uploadError.textContent = "Cette image ne peut pas être lue. Choisissez une autre photo.";
		updateUploadButton();
	};
	photoPreview.src = previewUrl;
});

photoTitle.addEventListener("input", updateUploadButton);
photoTitle.addEventListener("blur", () => {
	if (!photoTitle.value.trim()) uploadError.textContent = "Renseignez le titre du projet.";
	else uploadError.textContent = "";
});
categorySelect.addEventListener("change", () => {
	uploadError.textContent = getPhotoFormError();
	updateUploadButton();
});

addPhotoForm.addEventListener("submit", async (event) => {
	event.preventDefault();
	if (uploadInProgress) return;
	uploadError.textContent = getPhotoFormError();
	uploadLogin.hidden = true;
	if (uploadError.textContent) return;

	const category = photoCategories.find((item) => item.id === Number(categorySelect.value));
	const formData = new FormData();
	formData.append("image", photoFile.files[0]);
	formData.append("title", photoTitle.value.trim());
	formData.append("category", category.id);
	uploadInProgress = true;
	photoFields.disabled = true;
	uploadButton.textContent = "Envoi en cours…";
	updateUploadButton();
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 30000);

	try {
		const token = sessionStorage.getItem("token");
		if (!token) {
			uploadError.textContent = "Reconnectez-vous pour ajouter un projet.";
			uploadLogin.hidden = false;
			return;
		}

		const response = await fetch("http://localhost:5678/api/works", {
			method: "POST",
			headers: { Authorization: `Bearer ${token}` },
			body: formData,
			signal: controller.signal,
		});

		if (response.status === 401 || response.status === 403) {
			uploadError.textContent = "Votre session ne permet plus d’ajouter un projet. Veuillez vous reconnecter.";
			uploadLogin.hidden = false;
			return;
		}
		if (!response.ok) {
			uploadError.textContent = "Le projet n’a pas pu être ajouté. Vérifiez les champs puis réessayez.";
			return;
		}

		const work = await response.json();
		if (!Number.isInteger(work.id) || !work.imageUrl || typeof work.title !== "string") {
			throw new Error("Réponse incomplète");
		}
		// La réponse de création contient l'identifiant de catégorie, mais pas son nom.
		addWorkToPage({ ...work, categoryId: category.id, category });
		if (photoModal.open) photoModal.close();
		else resetPhotoForm();
		document.querySelector("#gallery-message").textContent = "Projet ajouté.";
		document.querySelector("#modal-gallery-message").textContent = "Projet ajouté.";
	} catch {
		uploadError.textContent = "L’ajout n’a pas pu être confirmé. Rechargez la galerie avant de réessayer.";
	} finally {
		clearTimeout(timeout);
		uploadInProgress = false;
		photoFields.disabled = false;
		uploadButton.textContent = "Valider";
		updateUploadButton();
	}
});
