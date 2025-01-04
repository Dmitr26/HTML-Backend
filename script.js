// *** Main functions ***

// Function for removing elements from a table

function deleteItem(id, config) {
    fetch(config.apiUrl + "/" + id, {
        method: 'DELETE'
    })
        .then(response => {
            return response.json();
        })
        .then(data => {
            console.log('Product deleted:', data);
            DataTable(config);
        })
}

// Asynchronous function for fetching data and creating a data table

async function DataTable(config) {

    const data = [];
    let keys = [];

    const getContainer = document.querySelector(config.parent).parentNode;
    const regex = /\bmodal-container\b/i;

    try {
        const fetchData = await fetch(config.apiUrl);
        const response = await fetchData.json();
        keys = Object.keys(response.data);
        for (let el of Object.values(response.data)) {
            data.push(el);
        }
        drawTable(config, data, keys);
        if (getContainer.innerHTML.search(regex) === -1) {
            drawModal(config);
        }
    } catch (error) {
        console.log(error);
    }
}

// Function for drawing a table

function drawTable(config, data, keys) {

    const getParent = document.querySelector(config.parent);

    if (getParent.innerHTML) {
        getParent.innerHTML = "";
    }

    const tableRows = Object.keys(data).length;

    // Creating the button

    let createButton = document.createElement('button');
    createButton.classList.add("create");
    createButton.textContent = "Додати";
    createButton.addEventListener('click', () => {
        openModal(config);
    })
    getParent.appendChild(createButton);

    // Creating the main table

    let mainTable = document.createElement('table');
    getParent.appendChild(mainTable);

    // Creating the table header

    let tableHeader = document.createElement('thead');
    mainTable.appendChild(tableHeader);

    let headRow = document.createElement('tr');
    let headNumber = document.createElement('th');
    headNumber.textContent = "№";
    headNumber.setAttribute("data-type", 'number');
    headNumber.setAttribute("data-order", config.order);
    headRow.appendChild(headNumber);

    for (const column of config.columns) {
        let headCol = document.createElement('th');
        headCol.textContent = column.title;
        headCol.setAttribute("data-type", column.type);
        headCol.setAttribute("data-order", config.order);
        headRow.appendChild(headCol);
    }

    let headDelete = document.createElement('th');
    headDelete.textContent = "Видалити";
    headRow.appendChild(headDelete);

    let headEdit = document.createElement('th');
    headEdit.textContent = "Редагувати";
    headRow.appendChild(headEdit);

    tableHeader.appendChild(headRow);

    // Creating the table body

    let tableBody = document.createElement('tbody');
    mainTable.appendChild(tableBody);

    for (let i = 0; i < tableRows; i++) {
        let row = document.createElement('tr');
        let number = document.createElement('td');
        number.textContent = i + 1;
        row.appendChild(number);

        for (const column of config.columns) {
            let col = document.createElement('td');
            col.innerHTML = typeof column.value === 'function' ? column.value(data[i]) : data[i][column.value];
            row.appendChild(col);
        }

        let deleteCol = document.createElement('td');
        deleteCol.innerHTML = `<button class="del" data-id="${keys[i]}">Delete</button>`;

        deleteCol.onclick = function (event) {
            let id = event.target.getAttribute("data-id");
            deleteItem(id, config);
        };
        row.appendChild(deleteCol);

        let editCol = document.createElement('td');
        editCol.innerHTML = `<button class="edit" data-id="${keys[i]}">Edit</button>`;

        editCol.onclick = function (event) {
            fetchForEdit(event, config);
        };

        row.appendChild(editCol);
        tableBody.appendChild(row);
    }
}

// Function to fetch the data we want to edit

function fetchForEdit(event, config) {
    let id = event.target.getAttribute("data-id");
    fetch(config.apiUrl + "/" + id)
        .then(response => {
            return response.json();
        })
        .then(data => {
            createModalForEditing(data.data, config, id);
        })
}

// Function for creating a modal window with data for editing

function createModalForEditing(data, config, id) {

    // Creating a new modal window

    const getContainer = document.querySelector(config.parent).parentNode;

    let createModalContainer = document.createElement('div');
    createModalContainer.classList.add("modal-container");
    getContainer.appendChild(createModalContainer);

    let createOverlay = document.createElement('div');
    createOverlay.classList.add("overlay");

    createOverlay.addEventListener('click', () => {
        closeModal(config);
    })

    createModalContainer.appendChild(createOverlay);

    let createModal = document.createElement('div');
    createModal.classList.add("modal");

    for (const column of config.columns) {
        if (column.input) {

            if (Array.isArray(column.input)) {

                for (let el of column.input) {
                    createInputs(el, createModal);
                }

            } else {
                createInputs(column.input, createModal);
            }
        }
    }

    createModalContainer.appendChild(createModal);

    // Adding data for editing to inputs

    let newData = data;

    createModalContainer.querySelectorAll(".inpt").forEach(el => {
        for (let key of Object.keys(newData)) {
            if (key == el.id) {
                el.value = newData[key];
                break;
            }
        }
    });

    createModalContainer.classList.add("active");

    // Registering all changes made by the user

    createModalContainer.querySelectorAll(".inpt").forEach(el => {
        el.addEventListener('input', function () {
            if (el.type === 'number') {
                newData[el.id] = +el.value;
            } else {
                newData[el.id] = el.value;
            }
        });
    });

    // Passing data to the API and deleting the modal window

    createModalContainer.querySelectorAll(".inpt").forEach(el => {
        el.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                console.log(newData);
                passData(config, newData, id);
                createModalContainer.remove();
            }
        });
    });

    // When you cancel changes and exit, the modal window is also removed

    createModalContainer.querySelector(".overlay").addEventListener('click', () => {
        createModalContainer.remove();
    });
}

// Function for creating a modal window for adding new items

function drawModal(config) {

    const getContainer = document.querySelector(config.parent).parentNode;

    // Creating a modal container with overlay and modal window

    let createModalContainer = document.createElement('div');
    createModalContainer.classList.add("modal-container");
    getContainer.appendChild(createModalContainer);

    let createOverlay = document.createElement('div');
    createOverlay.classList.add("overlay");

    createOverlay.addEventListener('click', () => {
        closeModal(config);
    })

    createModalContainer.appendChild(createOverlay);

    let createModal = document.createElement('div');
    createModal.classList.add("modal");

    // Creating inputs

    for (const column of config.columns) {
        if (column.input) {

            if (Array.isArray(column.input)) {

                for (let el of column.input) {
                    createInputs(el, createModal);
                }

            } else {
                createInputs(column.input, createModal);
            }
        }
    }

    createModalContainer.appendChild(createModal);

    // Transfer data when pressing the Enter key

    getContainer.querySelectorAll(".inpt").forEach(el => {
        el.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {

                let dataToPass = {};
                let valid = true;

                getContainer.querySelectorAll(".inpt").forEach(input => {
                    if (!input.value && input.required) {
                        input.style.border = "2px solid red";
                        valid = false;
                    } else {
                        input.style.border = "";

                        if (input.type === 'number') {
                            dataToPass[input.getAttribute('id')] = +input.value;
                        } else {
                            dataToPass[input.getAttribute('id')] = input.value;
                        }
                    }
                })

                if (valid) {
                    passData(config, dataToPass);
                    getContainer.querySelectorAll(".inpt").forEach(input => {
                        input.value = "";
                    })
                }
            }

        });
    });
}

// Function for creating input fields

function createInputs(el, parent) {

    if (el.label) {
        let label = document.createElement('label');
        label.innerText = el.label;
        label.for = el.name;
        parent.append(label);
    }

    if (el.type === 'select') {
        let createSelect = document.createElement('select');
        createSelect.classList.add("inpt");
        createSelect.id = el.name;
        for (let option of el.options) {
            let createOption = document.createElement('option');
            createOption.innerText = option;
            createSelect.append(createOption);
        }
        if (el.required !== false) {
            createSelect.required = true;
        }
        parent.append(createSelect);
    } else {
        let createInput = document.createElement('input');
        createInput.classList.add("inpt");
        createInput.type = el.type;
        createInput.id = el.name;
        if (el.placeholder) {
            createInput.placeholder = el.placeholder;
        }
        if (el.required !== false) {
            createInput.required = true;
        }
        parent.append(createInput);
    }
}

// Function for passing data to API
// If the element has an id, then it is already in the API - the program changes its contents
// If the element does not have an id, then it is not in the API - the program adds it to the API

function passData(config, data, id = -1) {

    if (id > -1) {
        fetch(config.apiUrl + "/" + id, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        })
            .then(response => {
                return response.json();
            })
            .then(() => {
                DataTable(config);
                closeModal(config);
            })
            .catch(error => {
                console.error(error);
            });
    } else {
        fetch(config.apiUrl, {
            method: "POST",
            body: JSON.stringify(data)
        })
            .then(response => {
                return response.json();
            })
            .then(() => {
                DataTable(config);
                closeModal(config);
            })
            .catch(error => {
                console.error(error);
            });
    }
}

// Function for opening a modal window

function openModal(config) {
    const getParent = document.querySelector(config.parent).parentNode;
    getParent.querySelector(".modal-container").classList.add("active");
}

// Function for closing a modal window

function closeModal(config) {
    const getParent = document.querySelector(config.parent).parentNode;
    getParent.querySelector(".modal-container").classList.remove("active");
}

// *** Functions of configs ***

// Function for obtaining age data

function getAge(date) {
    let result = "";
    let today = new Date();
    let birthDate = new Date(date);
    let year = today.getFullYear() - birthDate.getFullYear();

    if (year > 0) {
        result = year + " year(-s)";
    } else {
        let month = today.getMonth() - birthDate.getMonth();
        result = month + " month(-s)";
    }

    return result;
}

// Function for obtaining color

function getColorLabel(color) {
    return `<div style="height: 40px; width: 40px; background-color: ${color};"></div>`;
}

// *** Configs ***

const config1 = {
    parent: '#usersTable',
    columns: [
        { title: 'Ім’я', value: 'name', input: { type: 'text', name: 'name', label: 'Ім’я' } },
        { title: 'Прізвище', value: 'surname', input: { type: 'text', name: 'surname', label: 'Прізвище' } },
        { title: 'Вік', value: (user) => getAge(user.birthday), input: { type: 'name', name: 'birthday', label: 'Дата народження', placeholder: 'Рік, Місяць, День' } },
        { title: 'Фото', value: (user) => `<img src="${user.avatar}" alt="${user.name} ${user.surname}"/>`, input: { type: 'text', name: 'avatar', label: 'Фото', placeholder: 'URL' } }
    ],
    apiUrl: "https://mock-api.shpp.me/dshevkoplias/users"
};

DataTable(config1);

const config2 = {
    parent: '#productsTable',
    columns: [
        { title: 'Назва', value: 'title', input: { type: 'text', name: 'title', label: 'Назва' } },
        {
            title: 'Ціна', value: (product) => `${product.price} ${product.currency}`, input: [
                { type: 'number', name: 'price', label: 'Ціна' },
                { type: 'select', name: 'currency', label: 'Валюта', options: ['$', '€', '₴'], required: false }
            ]
        },
        { title: 'Колір', value: (product) => getColorLabel(product.color), input: { type: 'color', name: 'color', label: 'Колір' } },
    ],
    apiUrl: "https://mock-api.shpp.me/<nsurname>/products"
};

DataTable(config2);
