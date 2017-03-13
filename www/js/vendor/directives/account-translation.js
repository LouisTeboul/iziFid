accountApp.config(['$translateProvider', function ($translateProvider) {

	// register english translation table
	$translateProvider.translations('en_EN', {
		"Valider": "Valid",
		"VALIDER": "VALID",
		"Rechercher": "Search",
		"RECHERCHER": "SEARCH",
		"Veuillez saisir": "Please enter",
		"Veuillez saisir votre numéro de carte": "Please enter your card number",
		"N° de carte": "Card number",
		"Ce numéro de carte n'est pas valide": "Invalid card number",
		"Montant d'achat": "Purchase amount",
		"AJOUTER UN PASSAGE": "ADD A PASSAGE",
		"Solde disponible": "Available balance",
		"Paiement en avoir": "Asset payment",
		"Enregistrer Ma Carte": "Card registration",
		"Tous les champs sont obligatoires": "All fields are required",
		"Carte n°": "Card no",
		"Prénom": "Firstname",
		"Nom": "Name",
		"Email":"Email",
		"Téléphone": "Phone",
		"Dernier passage": "Last visit",
		"Utilisateur anonyme": "Anonymous user",
		"Sexe": "Gender",
		"Homme": "Man",
		"Femme": "Woman",
		"Ce champ doit comporter au moins": "This field must have at least",
		"caractères": "characters",
		"Date de naissance": "Birth date",
		"Cette adresse email ne semble pas être valide": "This email address does not seem valid",
		"Ce numéro de téléphone ne semble pas être valide": "This number does not appear to be valid",
		"Adresse": "Address",
		"Code Postal": "Zip code",
		"Ville": "City",
		"Société": "Organisation",
		"Mot de passe": "Password",
		"Mot de passe (confirmation)": "Retype password",
		"Le mot de passe ne correspond pas": "Password does not match",
		"Rechercher un client": "Search customer",
		"Nom, prénom ou email": "Name, firstname or email",
		"Aucun résultat": "No result",
		"Cumul depuis la création": "Since creation",
		"Voulez-vous quitter la fiche client ?": "Exit customer registration ?",
		"Voulez-vous effectuer cette action ?": "Would you do this ?",
		"Voulez-vous utiliser cette offre ?": "Want to use this offer ?",
		"L'action a bien été effectuée sur cette carte": "Action was successful",
		"Le paiement en avoir a bien été effectué": "Asset payment successful",
		"L'offre a bien été utilisée": "Offer has been used",
		"Une erreur ": "An error ",
		" est survenue !": " has occurred !",
		"Cette carte est déjà enregistrée !": "This card is already registered !",
		"Confirmez-vous que ce client est passé en caisse sans utiliser d'offre et/ou d'avoir fidélité ?": "Can you confirm that customer doesn't use loyalty and/or asset ?",
		"Oui": "Yes",
		"Non": "No",
		"Appuyez une autre fois pour quitter": "Push back button another time to exit",
		"Carte inconnue !": "Invalid card !",
		"La carte est enregistrée": "This card is registered",
		"J'accepte de recevoir par mail les informations concernant mon compte et les offres de fidélité": "I agree to receive by email my account information and loyalty offers",
		"Vous dépassez la limite, le montant maximun est de": "You exceed the limit, the maximum amount is",
		"Ce montant est supérieur au total de la cagnotte": "This amount is greater than the total of the pot"
	});

	$translateProvider.translations('fr_FR', {
	});

	// which language to use?
	var currentLanguage = window.localStorage.getItem("CurrentLanguage");
	if (currentLanguage) {
		try{
			$translateProvider.use(currentLanguage);
		} catch (err) {
			window.localStorage.setItem("CurrentLanguage",undefined);
		}
	}
}])