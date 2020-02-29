console.log("Hello, i'm server"); //Stampa su console

var express = require('express');
var socket = require('socket.io');
var mysql = require('mysql');
var socketList = {};
var onlineUser = {};

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
        ;
        if (socket.id in onlineUser) {
            console.log("Utene: " + onlineUser[socket.id].username + " Disconnesso");
            delete onlineUser[socket.id];
            getList(onlineUser);
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
                            }
                        });
                    }
                });
            }
        });
    });

    //AGGIUNGERE UTENTE ALLA LISTA UTENTI ONLINE DEL SEVER
    function addUserOnline(username, userSocket) {
        onlineUser[userSocket.id] = {
            userSocket: userSocket,
            username: username,
        };
        console.log("UTENTI ONLINE: " + Object.keys(onlineUser).length);
        getList(onlineUser); // Invia Lista Utenti
    }

    //COMUNICA AI CLIENT LA NUOVA LISTA DI UTENTI ONLINE
    function getList(onlineUser) {
        var list = [];

        for (var key in onlineUser) {
            if (onlineUser.hasOwnProperty(key)) {
                list.push(onlineUser[key].username);
            }
        }

        io.sockets.emit('updateList', {
            userList: JSON.stringify(list),
        });
    }

    function getRanking() {
        connection.query("SELECT * FROM SCORE order by win,draw",function (error, rows, field) {
            if (error) {
                console.log('Error in the Query');
            } else {
                console.log('Success Query');
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

});


