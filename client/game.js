var c0 = document.getElementById("c0");
var c1 = document.getElementById("c1");
var c2 = document.getElementById("c2");
var c3 = document.getElementById("c3");
var c4 = document.getElementById("c4");
var c5 = document.getElementById("c5");
var c6 = document.getElementById("c6");
var c7 = document.getElementById("c7");
var c8 = document.getElementById("c8");

function addRed(cell){
    cell.addEventListener('mouseover', function(event) {
        if(cell.textContent !== "X" && cell.textContent !== "O"){
            cell.style.backgroundColor = "red";
        }
    });
}

function addBlue(cell){
    cell.addEventListener('mouseout', function(event) {
        if(cell.textContent !== "X" && cell.textContent !== "O"){
           cell.style.backgroundColor = "#268";
        }
    });
}

function addClick(cell){
    cell.addEventListener('click', function(event) {
        if(cell.textContent !== "X" && cell.textContent !== "O") {
            if (turno == true) {
                turno = false;
                socket.emit('mossa', { //passo nome dell'evento 'signup' e parametri da inviare
                    roomName: roomName,
                    idCella: cell.id,
                    simbolo: simbolo,
                });
                /*cell.style.backgroundColor = "#268";
                cell.innerHTML = simbolo;
                clearAll();*/
            } else
                alert("NON E' IL TUO TURNO");
        }
    });
}

socket.on('mossa', function(data){
    myCella = document.getElementById(data.idCella);
    myCella.style.backgroundColor = "#268";
    myCella.innerHTML = data.simbolo;
    if(data.simbolo !== simbolo)
        turno = true;
});

//PULISCE LA CELLA
function clear(cell){
cell.style.backgroundColor = "#268"
cell.innerHTML = "";
}

//PULISCE LA TABELLA ALLA FINE DELLA PARTITA
function clearAll(){

if(c0.textContent == "" || c1.textContent == "" || c2.textContent == "" || c3.textContent == "" || c4.textContent == "" || c5.textContent == "" || c6.textContent == "" || c7.textContent == "" || c8.textContent == "" )
{
}
else {
clear(c0);
clear(c1);
clear(c2);
clear(c3);
clear(c4);
clear(c5);
clear(c6);
clear(c7);
clear(c8);
}

}


//AGGIUNGO EVENTO CLICK
addClick(c0);
addClick(c1);
addClick(c2);
addClick(c3);
addClick(c4);
addClick(c5);
addClick(c6);
addClick(c7);
addClick(c8);
//AGGIUNGO EVENTO MOUSEOVER RED
addRed(c0);
addRed(c1);
addRed(c2);
addRed(c3);
addRed(c4);
addRed(c5);
addRed(c6);
addRed(c7);
addRed(c8);
//AGGIUNGO EVENTO MOUSEOUT BLU
addBlue(c0);
addBlue(c1);
addBlue(c2);
addBlue(c3);
addBlue(c4);
addBlue(c5);
addBlue(c6);
addBlue(c7);
addBlue(c8);