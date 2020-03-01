//Make connection
var socket = io.connect('http://localhost:3000');
var username ="" ;
//REGISTRAZIONE E LOGIN
//Query DOM
var signUsername = document.getElementById('signUsername');
var signPwd = document.getElementById('signPwd');
var btnSign = document.getElementById('btnSign');

var logUsername = document.getElementById('logUsername');
var logPwd = document.getElementById('logPwd');
var btnLogin = document.getElementById('btnLogin');

var loginDiv = document.getElementById('loginDiv');
var lobbyDiv = document.getElementById('lobbyDiv');
var btnSfida = document.getElementById('btnSfida');
var slct = document.getElementById('slct');

//Emit events
btnLogin.addEventListener('click' , function(){ //assegno evento al bottone
    socket.emit('login', { //passo nome dell'evento 'login' e parametri da inviare
        logUsername: logUsername.value,
        logPwd: logPwd.value,
    });
});

btnSign.addEventListener('click' , function(){ //assegno evento al bottone
    socket.emit('signup', { //passo nome dell'evento 'signup' e parametri da inviare
        signUsername: signUsername.value,
        signPwd: signPwd.value,
    });
});

btnSfida.addEventListener('click' , function(){
    if(select.selectedIndex >= 0){
        var strUser = slct.options[slct.selectedIndex].value;
        socket.emit('reqSfida', { //passo nome dell'evento 'signup' e parametri da inviare
            reciverName: strUser,
            senderName: username,
        });
        alert('RICHIESTA INVIATA ATTENDERE RISPOSTA');
    }
    else
        alert("SELEZIONARE UTENTE");
});


//List for events
socket.on('login', function(data){ //dalle socket prendo quella con evento 'login' e prendo i dati ricevuti
    if(data.status) {
        username = data.username;
        alert("LOGIN EFFETTUATO CON SUCCESSO");
        loginDiv.style.display = 'none';
        lobbyDiv.style.display = 'inline';
    } else {
        alert("USERNAME O PASSWORD ERRATI");
    };

});

socket.on('signup', function(data){ //dalle socket prendo quella con evento 'signup' e prendo i dati ricevuti
    if(data.status) {
        username = data.username;
        alert("REGISTRAZIONE EFFETTUATA CON SUCCESSO");
        loginDiv.style.display = 'none';
        lobbyDiv.style.display = 'inline';
    } else {
        alert("USERNAME GIA' ESISTENTE");
    };
});

//LOBBY DIV
var btnsfida = document.getElementById('btnsfida');
var select = document.getElementById("slct");
var tableRanking = document.getElementById("ranking");


//UPDATE USER ONLINE LIST
socket.on('updateList', function(data){ //dalle socket prendo quella con evento 'signup' e prendo i dati ricevuti
    var list = JSON.parse(data.userList);

    select.innerHTML = "";// pulisco select

    for (i = 0; i < list.length; i++) {
        if(list[i] != username) { //Controllo di non aggiungere il nome del seguente utente
            var option = document.createElement("option");
            option.text = list[i];
            option.value = list[i];
            select.add(option);
        }
    }
});

//Ranking
socket.on('ranking', function(data){ //dalle socket prendo quella con evento 'login' e prendo i dati ricevuti
    var rows = data.rows;
    var numberRow =  - 1;
    var tbody = document.getElementById("tableBody");
    tbody.innerHTML = "";// pulisco tbody
    if(data.status) {

        for (i = 0; i < rows.length; i++) {
            var row = tbody.insertRow(numberRow)
            var rank = row.insertCell(numberRow);
            var name =  row.insertCell(numberRow);
            var win =  row.insertCell(numberRow);
            var draw =  row.insertCell(numberRow);
            var lose =  row.insertCell(numberRow);
            rank.innerHTML = i+1;
            name.innerHTML = rows[i].userName;
            win.innerHTML = rows[i].win;
            draw.innerHTML = rows[i].draw;
            lose.innerHTML = rows[i].defeat;
        }

    } else {
        alert("Errore Caricamento Classifica");
    };

});

//Ricezione SFIDA
socket.on('reqSfida', function(data){
    var sfida = window.confirm('TI SFIDA : '+ data.senderName + ', ACCETTI ?');
    var esito;
    if (sfida == true) {
        esito = true;
    } else {
        esito = false;
    }
    socket.emit('respSfida', { //Rispondo alla sfida
        reciverName: data.reciverName,
        senderName: data.senderName,
        esito: esito,
    });
});