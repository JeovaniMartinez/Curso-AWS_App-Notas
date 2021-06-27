
const apiURL = 'http://127.0.0.1/api/';

///////////////////////////////////////////////////////////////////////////////////////////////////

const requestCodeBtn = $('#request-code-btn');
const usernameInput = $('#username-input');
const loginSpinner = $('#login-spinner');
const copyright = $('#copyright');

copyright.html('Copyright &copy; ' + new Date().getFullYear() + '&mdash; Notes App');

requestCodeBtn.on('click', function () { requestAccessCode(); });

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

    executeRequest('POST', 'user/request-login-code', { username: username }).then(r => {

    }).catch(() => {
        // Se maneja en la petición
    }).finally(() => {
        loginSpinner.addClass('invisible');
        usernameInput.prop('disabled', false);
        requestCodeBtn.prop('disabled', false);
    });

}

/** Ejecuta una petición a la API, requiere el tipo de petición, la ruta y los datos a enviar */
async function executeRequest(type, route, data) {

    return new Promise(function (resolve, reject) {

        $.ajax({
            type: type,
            url: apiURL + route,
            data: JSON.stringify(data),
            contentType: "application/json; charset=utf-8",
            success: function (data) {
                resolve(data);
            },
            complete: function (jqXHR, textStatus) {
                if (jqXHR.status !== 200) {


                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        confirmButtonText: 'Aceptar',
                        text: jqXHR.responseText,
                    });

                    reject()

                }
            }
        });

    });
}
