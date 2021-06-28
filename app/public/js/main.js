
const apiURL = 'http://127.0.0.1/api/';

///////////////////////////////////////////////////////////////////////////////////////////////////

const localStorage = window.localStorage;
const requestCodeBtn = $('#request-code-btn');
const usernameInput = $('#username-input');
const loginSpinner = $('#login-spinner');
const copyright = $('#copyright');
const accessCodeInput = $('#access-code-input');
const loginSpinner2 = $('#login-spinner-2');
const accessBtn = $('#access-btn');
const keepConnectedCheck = $('#keep-connected');
const loginP1 = $('#login-p1');
const loginP2 = $('#login-p2');
const returnBtn = $('#return-btn');
const mainContainer = $('#main-container');
const loginSection = $('#login-section');
const exitBtn = $('#exit-btn');
const notesContainer = $('#notes-container');
const loading = $('#loading');

let accessToken = '';

/** Al inicia se verifica si hay sesión iniciada */
if (checkAccessToken()) {
    accessToken = localStorage.getItem('accessToken');
    loadNotes();
    iziToast.success({
        message: 'Bienvenido(a) ' + localStorage.getItem('name'),
        close: true,
        timeout: 1500,
    });
    loginSection.addClass('d-none');
    mainContainer.removeClass('d-none');
}

copyright.html('Copyright &copy; ' + new Date().getFullYear() + '&mdash; Notes App');

requestCodeBtn.on('click', function () { requestAccessCode(); });

returnBtn.on('click', function () {
    loginP2.addClass('d-none');
    loginP1.removeClass('d-none');
});

accessBtn.on('click', function () { login() });

exitBtn.on('click', function () {
    Swal.fire({
        text: '¿Estás seguro(a) que quieres salir de la app?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, Salir',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.clear();
            loginSection.removeClass('d-none');
            mainContainer.addClass('d-none');
        }
    })
});

/** Ejecuta una petición a la API, requiere el tipo de petición, la ruta y los datos a enviar */
async function executeRequest(type, route, data, showLoading = true) {

    if (showLoading) loading.removeClass('d-none');

    return new Promise(function (resolve, reject) {

        $.ajax({
            type: type,
            url: apiURL + route,
            data: JSON.stringify(data),
            contentType: 'application/json; charset=utf-8',
            headers: { 'access-token': accessToken },
            success: function (data) {
                resolve(data);
            },
            complete: function (jqXHR, textStatus) {

                loading.addClass('d-none');

                if (jqXHR.status !== 200) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        confirmButtonText: 'Aceptar',
                        text: jqXHR.responseText,
                    });
                    reject()
                }

                if (jqXHR.status === 403) {
                    // Token expirado, dirige al inicio nuevamente
                    loginSection.removeClass('d-none');
                    mainContainer.addClass('d-none');
                }
            }
        });

    });
}

/** Verifica si el token de acceso aun es válido, devuelve un booleano que indica si aún es válido */
function checkAccessToken() {

    const tokenExpirationTime = localStorage.getItem('tokenExpirationTime');

    if (tokenExpirationTime) {
        if (Date.now() > parseInt(tokenExpirationTime)) return false
        else return true
    } else {
        return false
    }

}

/** Realiza el proceso para solicitar el código de acceso a la API */
async function requestAccessCode() {

    const username = usernameInput.val().trim();

    if (username === '') {
        iziToast.warning({
            message: 'Ingresa tu correo electrónico o tu número teléfono',
            close: true,
            timeout: 2000,
        });
        return
    }

    loginSpinner.removeClass('invisible');
    usernameInput.prop('disabled', true);
    requestCodeBtn.prop('disabled', true);

    executeRequest('POST', 'user/request-login-code', { username: username }, false).then(r => {

        iziToast.success({
            message: 'Código enviado',
            close: true,
            timeout: 1500,
        });

        loginP1.addClass('d-none');
        loginP2.removeClass('d-none');

    }).catch(() => {
        // Se maneja en la petición
    }).finally(() => {
        loginSpinner.addClass('invisible');
        usernameInput.prop('disabled', false);
        requestCodeBtn.prop('disabled', false);
    });

}

/** Ejecuta el proceso para iniciar sesión */
function login() {

    const accessCode = accessCodeInput.val().trim();

    if (accessCode === '' || accessCode.length != 6) {
        iziToast.warning({
            message: 'Ingresa un código de acceso válido',
            close: true,
            timeout: 2000,
        });
        return
    }

    loginSpinner2.removeClass('invisible');
    accessCodeInput.prop('disabled', true);
    accessBtn.prop('disabled', true);
    keepConnectedCheck.prop('disabled', true);
    returnBtn.addClass('d-none');

    executeRequest('POST', 'user/login', { username: usernameInput.val().trim(), accessCode: accessCode }, false).then(result => {

        accessToken = result.accessToken;
        loadNotes();

        iziToast.success({
            message: 'Bienvenido(a) ' + result.name,
            close: true,
            timeout: 1500,
        });

        loginP2.addClass('d-none');
        loginP1.removeClass('d-none');
        accessCodeInput.val('');

        loginSection.addClass('d-none');
        mainContainer.removeClass('d-none');

        if (keepConnectedCheck.is(':checked')) {
            localStorage.setItem('name', result.name);
            localStorage.setItem('accessToken', result.accessToken);
            localStorage.setItem('tokenExpirationTime', result.tokenExpirationTime);
        } else {
            localStorage.clear();
        }

        keepConnectedCheck.prop('checked', true); // Se regresa al estado inicial

    }).catch(() => {
        // Se maneja en la petición
    }).finally(() => {
        loginSpinner2.addClass('invisible');
        accessCodeInput.prop('disabled', false);
        accessBtn.prop('disabled', false);
        keepConnectedCheck.prop('disabled', false);
        returnBtn.removeClass('d-none');
    });

}

/** Carga las notas del usuario */
function loadNotes() {

    executeRequest('GET', 'notes/list', {}).then(result => {

        let htmlContent =
            `
        <div class='container-fluid'>
            <div class='table-responsive'>
                <table class='table'>
                 <thead class='table-dark'>
                       <tr>
                          <th scope='col'>Id</th>
                          <th scope='col'>Título</th>
                          <th scope='col'>Contenido</th>
                          <th scope='col' style='text-align: center;'>Fecha de Actualización</th>
                          <th scope='col'></th>
                       </tr>
                    </thead>
                    <tbody>
        `;

        result.forEach((note, index) => {
            htmlContent +=
                `
                        <tr>
                        <th scope='row'>${note.id}</th>
                        <td>${note.title}</td>
                        <td>${note.content}</td>
                        <td style='width: 200px; text-align: center;'>${new Date(note.datetime).toLocaleDateString()} ${new Date(note.datetime).toLocaleTimeString()}</td>
                        <td style='width: 90px'><input type='image' src='../../images/icons/edit.svg' /><input id='delete-${note.id}' type='image' src='../../images/icons/delete.svg' /></td>
                        </tr>
            `;

        });

        htmlContent +=
            `
                    </tbody>
                </table>
            </div>
        </div>
        `;

        notesContainer.html(htmlContent);

        // Se agregan los eventos para las filas de la tabla
        result.forEach((note, index) => {
            $(`#delete-${note.id}`).on('click', function () {
                deleteNote(note.id)
            });
        });

    }).catch(() => {
        // Se maneja en la petición
    });

}

/** Elimina la nota indicada, en base a su Id */
function deleteNote(noteId) {
    Swal.fire({
        title: 'Eliminar Nota',
        text: `¿Estás seguro(a) que quieres eliminar la nota ${noteId}?, esta acción no se puede deshacer.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, Eliminar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {

        }
    })
}
