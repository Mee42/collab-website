let labStatus = null;
getStatus();
let isKicking = (typeof kicking === 'undefined' ) ? false : kicking;
setInterval(getStatus, 5000);

$('#kickModal').on('hidden.bs.modal', function () {
    $('#idNumber').val('');
    getStatus();
});

function login() {
    window.location.replace('/manage');
}

function getStatus() {
    getData('/lab/status', function (response) {
        updatePage(response);
    });
}

function updatePage(newStatus) {
    let isOpen = $('#isOpen');
	document.getElementById('isOpen').innerHTML = newStatus.open;
	const lookup = {
		OPEN: 'text-success',
		CLOSED: 'text-danger',
		LIMITED: 'text-warning'
	}
	isOpen.removeClass('text-success');
	isOpen.removeClass('text-danger');
	isOpen.removeClass('text-warning');
	isOpen.addClass(lookup[newStatus.open]);

    let newList = '';
        for (let index in newStatus.members) {
          if (isKicking) {
            newList += `<button class="list-group-item" onClick="kick('${index}')">${newStatus.members[index]}</button>`;
          } else {
            newList += `<li class="list-group-item">${newStatus.members[index]}</li>`;
          }
    }
    labStatus = newStatus;
    document.getElementById('who').innerHTML = newList;
}

function kick(username) {
    $("#kickName").html(labStatus.members[username]);
    $("#kickModal").modal();
    $('#idNumber').val(username);
}

function kickUser() {
    let idNumber = $('#idNumber').val();
    let data = {'idNumber': idNumber};
    postData('/lab/kick', JSON.stringify(data), function (statusCode) {
        switch (statusCode) {
            case 0:
                $.notify("Kick Successful!", {'className': 'success'});
                $('#kickModal').modal('hide');
                break;
        }
    });
}
