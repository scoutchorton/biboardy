function selectHandler(menuElement) {
	//Change selected item when clicked
	menuElement.addEventListener('click', (e) => {
		console.log(e.target);
	});
}

//Process DOM elements
window.addEventListener('load', () => {
	//Grab menu elements
	let menus = document.querySelectorAll('.menu');

	//Iterate through menus
	for(let menu of menus) {
		//Elements to modify
		let selects = menu.querySelectorAll('.select');
		let numbers = menu.querySelectorAll('.number');

		//Change selected item on click
		for(let select of selects) {
			for(let child of select.children) {
				child.addEventListener('click', (e) => {
					for(let deselect of e.target.parentElement.children)
						deselect.removeAttribute('selected');
					e.target.setAttribute('selected',true);
					e.target.parentElement.setAttribute('value', e.target.getAttribute('value'));
					e.target.parentElement.dispatchEvent(new Event('change', {
						value: e.target.parentElement.getAttribute('value')
					}));
				});
			}
			select.setAttribute('value', select.querySelector('span[selected]').getAttribute('value'));
		}

		//Edit number value
		for(let number of numbers) {
			number.innerHTML = `<input type="number" min="1" max="9999" value="${number.innerHTML}"></input>`;
			dataElement = number.firstElementChild;

			let decButton = document.createElement('BUTTON');
			decButton.innerText = '<';
			decButton.classList.add('dec');
			decButton.addEventListener('click', (e) => {
				e.target.nextElementSibling.value--;
			});
			number.insertBefore(decButton, dataElement);

			let incButton = document.createElement('BUTTON');
			incButton.innerText = '>';
			incButton.classList.add('inc');
			incButton.addEventListener('click', (e) => {
				e.target.previousElementSibling.value++;
			});
			number.insertBefore(incButton, dataElement.nextSibling);

			dataElement.addEventListener('change', (e) => {
				e.target.setAttribute('size', e.target.value.toString().length);
				e.target.parentElement.setAttribute('value', e.target.value);
			});

			number.dispatchEvent(new Event('change'));
		}
	}
});