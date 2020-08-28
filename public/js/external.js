var labStatus = null;
getStatus();
var kicking = kicking || false;
setInterval(getStatus, 5000);

$('#kickModal').on('hidden.bs.modal', function(){
  $('#idNumber').val('');
  getStatus();
});


function getStatus(){
  getData('/lab/status', function(response){
    updatePage(response);
  });
}

function updatePage(newStatus){
  if(newStatus.open){
    document.getElementById('isOpen').innerHTML = 'OPEN';
    $('#isOpen').removeClass('text-danger');
    $('#isOpen').addClass('text-success');
  }else{
    document.getElementById('isOpen').innerHTML = 'CLOSED';
    $('#isOpen').removeClass('text-success');
    $('#isOpen').addClass('text-danger');
  }
}

function login(){
  window.location.replace('/manage');
}

function kick(username){
  $("#kickName").html(labStatus.members[username]);
  $("#kickModal").modal();
  $('#idNumber').val(username);
}

function kickUser(){
  var idNumber = $('#idNumber').val();
  var data = {'idNumber':idNumber};
  postData('/lab/kick',JSON.stringify(data), function(statusCode){
    console.log(statusCode);
    switch(statusCode){
      case 0:
        $.notify("Kick Successful!", {'className':'success'});
        $('#kickModal').modal('hide');
      break;
    }
  });
}
