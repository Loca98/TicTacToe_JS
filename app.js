console.log("Hello, i'm server"); //Stampa su console

var express = require('express');
var socket = require('socket.io');
var mysql = require('mysql');
var socketList = {};
var onlineUser = {};
var roomName = [];
//App setup
var app = express(); // Applicazione express
var server = app.listen(3000, function(){
    console.log('listening on port 3000'); //In ascolto su porta 3000 con funzione da eseguire
});

//database connection
var connection = mysql.createConnection({
    host: 'mysql-loca.alwaysdata.net',
    user: 'loca',
    password: 'prova98',
    database: 'loca_tictactoe'
});

//Routing in particolare quando avviene una richiesta get si risponde con la pagina html
app.get('/', function(req, res){
    res.sendFile(__dirname + '/client/login.html');
});

//Static file
app.use('/client', express.static('client'));

//Connessione al db
connection.connect(function(error){
    if(!!error){
        console.log('Error connession to db');
    } else{
        console.log('Connected to db');
    }
});

//Socket setup
var io = socket(server);

io.on('connection', function(socket) { //quando si effettua una connessione esegue function()
    console.log('made socket connection', socket.id)
    socketList[socket.id] = socket;

    //DISCONNESSIONE UTENTE
    socket.on('disconnect', function () {
        if (socket.id in socketList) {
            delete socketList[socket.id];
            console.log("Guest Disconnesso");
        }
        for (var key in onlineUser) {
            if (onlineUser[key].userSocket.id == socket.id) {
                console.log("Utene: " + key + " Disconnesso");
                delete onlineUser[key];
                getList();
            }
        }
    });

    //RICHIESTA LOGIN
    socket.on('login', function (data) { //Appena mi arriva 'chat' eseguo callback passando data del client
        connection.query("SELECT * FROM UTENTE WHERE name like '" + data.logUsername + "' AND pwd like '" + data.logPwd + "'", function (error, rows, field) {
            if (error) {
                console.log('Error in the Query');
            } else {
                console.log('Success Query');
                //console.log(rows);
                if (rows.length > 0) { //Controllo che non sia già loggato
                    io.to(socket.id).emit('login', { //Rispondo a quella socket con evento login
                        status: true,
                        username: rows[0].name,
                    });
                    addUserOnline(rows[0].name, socket);
                    getRanking();
                } else {
                    io.to(socket.id).emit('login', { //rispondo allo specifico client
                        status: false,
                    });
                }
            }
        });
    });

    //RICHIESTA REGISTRAZIONE
    socket.on('signup', function (data) {
        connection.beginTransaction(function (err) {
            if (err) {
                console.log("Errore Trasazione");
            } else {
                connection.query("INSERT INTO UTENTE (name, pwd) VALUES ('" + data.signUsername + "','" + data.signPwd + "')", function (err, rows, field) {
                    if (err) {
                        console.log("Errore Query");
                        connection.rollback();
                        io.to(socket.id).emit('signup', { //rispondo allo specifico client
                            status: false,
                        });
                    } else {
                        connection.commit(function (err) { //commit transazione
                            if (err) {
                                connection.rollback(function () {
                                    console.log("Errore Commit");
                                });
                            } else {
                                console.log('Success Query, Transaction Complete.');
                                //connection.end();
                                io.to(socket.id).emit('signup', { //Rispondo a quella socket con evento login
                                    status: true,
                                    username: data.signUsername,
                                });
                                addUserOnline(data.signUsername, socket)
                                getRanking();
                            }
                        });
                    }
                });
            }
        });
    });

    //RICHIESTA SFIDA UN UTENTE
    socket.on('reqSfida', function (data) {
        for (var key in onlineUser) {
            if (key == data.reciverName) { //invio richiesta a specifico client
                setUserStatus(data.reciverName); //UTENTE IMPEGNATO
                setUserStatus(data.senderName); //UTENTE IMPEGNATO
                console.log("SFIDANTI: "+ data.reciverName + data.senderName)
                getList(); //Aggiorno lista
                onlineUser[key].userSocket.emit('reqSfida', {
                    senderName: data.senderName,
                    reciverName: data.reciverName,
                });
            }
        }
    });

    //SE SI ACCETTA LA SFIDA SI ENTRA NELLA STESSA ROOM
    socket.on('respSfida', function (data) {
        if(data.esito == true) {
            var nameRoom = getNameRoom();
            for (var key in onlineUser) {
                if (key == data.senderName || key == data.reciverName){
                    //console.log("JOIN: " + data.senderName + " " + data.reciverName)
                    onlineUser[key].userSocket.join(nameRoom);
                }
            }
            io.to(nameRoom).emit('inizialize', {
                roomName: nameRoom,
                simbolo: data.senderName, // COLUI CHE HA INIZIATO LA SFIDA AVRA' X
                esito:true, //Nel client controllerò che la sfida è stata accettata
            });
        }
        else {//SFIDA NON ACCETTATA
            onlineUser[data.senderName].userSocket.emit('inizialize', {
                esito: false, //Nel client controllerò che la sfida è stata accettata
            });
            //RIMETTERE UTENTI DISPONIBILI
            setUserStatus(data.reciverName); //UTENTE NON IMPEGNATO
            setUserStatus(data.senderName); //UTENTE NON IMPEGNATO
            getList();
        }
    });

    //AGGIUNGERE UTENTE ALLA LISTA UTENTI ONLINE DEL SEVER
    function addUserOnline(username, userSocket) {
        onlineUser[username] = {
            userSocket: userSocket,
            status: false, //Utilizzato per controllare se utente non impegnato
        };
        console.log("UTENTI ONLINE: " + Object.keys(onlineUser).length);
        getList(); // Invia Lista Utenti
    }

    //COMUNICA AI CLIENT LA NUOVA LISTA DI UTENTI ONLINE NON IMPEGNATI
    function getList() {
        var list = [];

        for (var key in onlineUser) {
            if (onlineUser.hasOwnProperty(key) && onlineUser[key].status == false ) { //Se status==false allora non è impegnato;
                list.push(key);
            }
        }

        io.sockets.emit('updateList', {
            userList: JSON.stringify(list),
        });
    }

    //COMUNICA CLASSIFICA DOPO LOGIN, REGISTRAZIONE;
    function getRanking() { //TODO: POSSO USARE UNO STATUS PER INDICARE SE PER TUTTI
        connection.query("SELECT * FROM SCORE order by win,draw",function (error, rows, field) {
            if (error) {
                console.log('Error in the Query');
            } else {
                //console.log('Success Query');
                //console.log(rows);
                if (rows.length > 0) {
                    io.sockets.emit('ranking', {
                        status: true,
                        rows: rows,
                    });
                } else {
                    io.sockets.emit(socket.id).emit('ranking', { //rispondo allo specifico client
                        status: false,
                    });
                }
            }
        });
    }

    function setUserStatus(nameuser){
        for (var key in onlineUser) {
            if (key == nameuser) { //invio richiesta a specifico client
                onlineUser[key].status = !onlineUser[key].status; //UTENTE IMPEGNATO
            }
        }
    }

    //TODO deallocare quando room non c'è più a fine partita if nome == key in io.sockets.adapter.rooms
    function getNameRoom(){
        if(roomName.length > 0){
            var newRoom = ""+ (parseInt(roomName[roomName.length - 1], 10) + 1); //Aumento di 1 la stanza
            roomName.push(newRoom);
        }
        else {
            newRoom = "1";
            roomName.push(newRoom);
        }
        return newRoom;
    }
});



