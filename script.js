// *** Main functions ***

// Function for removing elements from a table

function deleteItem(event, config) {

    let id = event.target.getAttribute("data-id");

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

    const data = {};

    const getContainer = document.querySelector(config.parent).parentNode;
    const regex = /\bmodal-container\b/i;

    try {
        const fetchData = await fetch(config.apiUrl);
        const response = await fetchData.json();
        let keys = Object.keys(response.data);
        let values = Object.values(response.data);

        for (let i = 0; i < keys.length; i++) {
            data[keys[i]] = values[i];
        }

        drawTable(config, data);
        if (getContainer.innerHTML.search(regex) === -1) {
            drawModal(config);
        }
    } catch (error) {
        console.log(error);
    }
}

// Function for drawing a table

function drawTable(config, data) {

    const getParent = document.querySelector(config.parent);
    getParent.innerHTML = "";

    // Creating the add button

    drawButton(getParent, "create", "Додати", openModal, [config]);

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
    headRow.appendChild(headNumber);

    for (const column of config.columns) {
        let headCol = document.createElement('th');
        headCol.textContent = column.title;
        headCol.setAttribute("data-type", column.type);
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

    let count = 1;

    for (let el of Object.keys(data)) {
        let row = document.createElement('tr');
        let number = document.createElement('td');
        number.textContent = count++;
        row.appendChild(number);

        for (const column of config.columns) {
            let col = document.createElement('td');
            col.innerHTML = typeof column.value === 'function' ? column.value(data[el]) : data[el][column.value];
            row.appendChild(col);
        }

        let deleteCol = document.createElement('td');
        drawOnclickButton(deleteCol, "del", "Delete", el, config, deleteItem);
        row.appendChild(deleteCol);

        let editCol = document.createElement('td');
        drawOnclickButton(editCol, "edit", "Edit", el, config, fetchForEdit);
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

    drawModal(config);
    const getContainer = document.querySelector(config.parent).parentNode;
    let containerList = getContainer.querySelectorAll(".modal-container");
    let thisContainer = containerList[containerList.length - 1];

    // Adding data for editing to inputs

    let newData = data;

    thisContainer.querySelectorAll(".inpt").forEach(el => {
        for (let key of Object.keys(newData)) {
            if (key == el.id) {
                el.value = newData[key];
                break;
            }
        }
    });

    thisContainer.classList.add("active");

    // Registering all changes made by the user

    thisContainer.querySelectorAll(".inpt").forEach(el => {
        el.addEventListener('input', function () {
            newData[el.id] = el.type === 'number' ? +el.value : el.value;
        });
    });

    // Passing data to the API and deleting the modal window

    thisContainer.querySelector(".save").addEventListener('click', function () {
        putData(config, newData, id);
        thisContainer.remove();
    });

    // When you cancel changes and exit, the modal window is also removed

    thisContainer.querySelector(".close").addEventListener('click', function () {
        thisContainer.remove();
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

    // Creating buttons for saving data and for closing the modal window

    let createButtonSpace = document.createElement('div');
    createButtonSpace.classList.add("button-space");
    drawButton(createButtonSpace, "save", "Зберегти", getInputValues, [config, getContainer]);
    drawButton(createButtonSpace, "close", "Закрити", closeModal, [config]);
    createModal.appendChild(createButtonSpace);

    createModalContainer.appendChild(createModal);
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

// Function to get input field values

function getInputValues(config, parent) {
    let dataToPass = {};
    let valid = true;

    parent.querySelectorAll(".inpt").forEach(input => {
        if (!input.value && input.required) {
            input.style.border = "2px solid red";
            valid = false;
        } else {
            input.style.border = "";
            dataToPass[input.getAttribute('id')] = input.type === 'number' ? +input.value : input.value;
        }
    })

    if (valid) {
        postData(config, dataToPass);
        parent.querySelectorAll(".inpt").forEach(input => {
            input.value = "";
        })
    }
}

// Function for adding data to API

function postData(config, data) {
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

// Function for changing the content of elements that already exist in the API

function putData(config, data, id) {
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
}

// Function for creating buttons

function drawButton(parent, className, textContent, clickFunction, args) {
    let createButton = document.createElement('button');
    createButton.classList.add(className);
    createButton.textContent = textContent;
    createButton.addEventListener('click', () => {
        clickFunction(...args);
    })
    parent.appendChild(createButton);
}

// Function for creating onclick buttons

function drawOnclickButton(parent, className, buttonText, id, config, functionName) {
    parent.innerHTML = `<button class="${className}" data-id="${id}">${buttonText}</button>`;
    parent.getElementsByClassName(className)[0].onclick = function (event) {
        functionName(event, config);
    };

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

    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();

    if (months < 0) {
        years -= 1;
        months += 12;
    }

    result = years + " year(-s), " + months + " month(-s)";
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
