/**
 * Module dependencies.
 */

var express = require('express')
  , stylus = require('stylus')
  , nib = require('nib')
  , sio = require('socket.io');

/**
 * App.
 */

var app = express.createServer();

/**
 * App configuration.
 */

app.configure(function () {
  app.use(stylus.middleware({ src: __dirname + '/public', compile: compile }));
  app.use(express.static(__dirname + '/public'));
  app.set('views', __dirname);
  app.set('view engine', 'jade');

  function compile (str, path) {
    return stylus(str)
      .set('filename', path)
      .use(nib());
  };
});

/**
 * App routes.
 */

//app.get('/', function (req, res) {
//  res.render('index', { layout: false });
//});

/**
 * App listen.
 */

app.listen(process.env.port || 3000, function () {
  var addr = app.address();
  console.log('   app listening on http://' + addr.address + ':' + addr.port);
});

/**
 * Socket.IO server (single process only)
 */

var io = sio.listen(app)

io.configure(function () {
    io.set("transports", [
        "xhr-polling",
        "jsonp-polling",
        "htmlfile"
    ]);
    io.set("polling duration", 10);
});

// TODO: break this up into activeUsers and userSubscribers so you don't have to distinguish between a user
// who isn't connected but is subscribed to by a connected user and one that is fully connected by weird socket checks
var users = {};
var addSocketToUser = function server$addSocketToUser (socketToAdd, user) {
    var id = user.nextSocketId;
    user.nextSocketId++;
    if (!user.sockets) { user.sockets = {}; }
    user.sockets[id] = socketToAdd;
    return id;
}

var addSubscribedToNames = function server$addSubscribedToNames (names, user, socket) {
    user.subscribedToNames = names;

    for (var i = 0; i < names.length; i++) {
        // First add ourself as a subscriber to the users defined by names
        if (!users.hasOwnProperty(names[i])) {
            users[names[i]] = { name: names[i], subscribers: {}, status: "offline" }
        }
        var subscribedTo = users[names[i]];
        subscribedTo.subscribers[user.name] = user;
        if (socket) {
            console.log("Sending StatusChange packet due to an initial subscription.");
            socket.send(JSON.stringify({ messageId: "StatusChange", user: subscribedTo.name, status: subscribedTo.status }));
        }
    }
}

var statusChange = function server$statusChange (newStatus, user) {
    if (user.subscribers && user.status != newStatus) {
        user.status = newStatus;

        // Notify any subscribers
        for (var subscriberName in user.subscribers) {
            if (user.subscribers.hasOwnProperty(subscriberName)) {
                var sockets = user.subscribers[subscriberName].sockets;

                if (sockets) {
                    for (var socketId in sockets) {
                        if (sockets.hasOwnProperty(socketId) && sockets[socketId]) {
                            sockets[socketId].send(JSON.stringify({ messageId: "StatusChange", user: user.name, status: newStatus }));
                        }
                    }
                }
            }
        }
    }
}

var hasAnyOwnPropertyHelper = function server$hasAnyOwnPropertyHelper (obj) {
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop) && obj[prop] !== undefined) {
            return true;
        }
    }
    return false;
}

var removeUser = function server$removeUser(user) {
    statusChange("offline", user);
    // remove it as a subscriber of the users it's subscribed to
    if (user.subscribedToNames) {
        var names = user.subscribedToNames;
        for (var i = 0; i < names; i++) {
            var name = names[i];
            if (users.hasOwnProperty(name) && users[name]) {
                var user = users[name];
                delete user.subscribers[user.name];
            }
        }
    }

    // check if it has any subscribers 
    var hasSubscribers = hasAnyOwnPropertyHelper(user.subscribers);

    if (!hasSubscribers) {
        delete users[user.name];
    } else {
        user.subscribedToNames = undefined;
        user.sockets = {};
        user.status = "offline";
    }
}

var removeSocket = function server$removeSocket (user, socketId) {
    if (user.sockets && user.sockets.hasOwnProperty(socketId) && user.sockets[socketId]) {
        delete user.sockets[socketId];
    }

    var hasAnySockets = hasAnyOwnPropertyHelper(user.sockets);

    if (!hasAnySockets) {
        removeUser(user);
    }
}

var sendMessageToUser = function server$sendMessageToUser (toUser, fromUser, messageText) {
    if (toUser.sockets) {
        for (var socketId in toUser.sockets) {
            if (toUser.sockets.hasOwnProperty(socketId) && toUser.sockets[socketId]) {
                var messageObj = { messageId: "ChatMessage", fromUser: fromUser.name, messageText: messageText };
                console.log("sending message: ");
                console.dir(messageObj);
                toUser.sockets[socketId].send(JSON.stringify(messageObj));
            }
        }
    }
}

io.sockets.on('connection', function server$io$on$connection (socket) {
    var user = undefined;
    var socketId = 0;
    socket.on('message', function server$io$on$message(message, ackCallback) {

        var messageObj;
        try {
            messageObj = JSON.parse(message);
        } catch (e) {
            console.error("Problem parsing messageObj: " + e.description);
        }

        if (messageObj.messageId) {
            switch (messageObj.messageId) {
                case "Initialize":
                    console.log("Received initialize packet with an obj of: ");
                    console.dir(messageObj);
                    // Only allow initialize if it hasn't been called
                    if (socketId === 0) {
                        // TODO: validate messageObj
                        if (!users.hasOwnProperty(messageObj.user.name)) {
                            user = {
                                name: messageObj.user.name,
                                nextSocketId: 1,
                                sockets: {},
                                subscribers: {},
                                status: "online"
                            }
                            users[messageObj.user.name] = user;
                        } else {
                            user = users[messageObj.user.name];
                        }
                        socketId = addSocketToUser(socket, user);
                        statusChange("online", user);

                        // Only using subscription info from the first person to connect
                        // TODO: if the same person connects more than once, synchronize contacts
                        if (!user.subscribedToNames) {
                            console.log("Adding subscribedToNames");
                            addSubscribedToNames(messageObj.user.subscribedToNames, user, socket);
                        }

                        user = users[messageObj.user.name];
                    }
                    break;
                case "ChatMessage":
                    if (messageObj.targetName && users[messageObj.targetName]) {
                        var targetUser = users[messageObj.targetName];
                        sendMessageToUser(targetUser, user, messageObj.messageText);
                    }
                    else {
                        console.error("Invalid username: '" + message.targetName +  "' target for a message.");
                    }
                    break;
                default:
                    console.error("Invalid message id: " + messageObj.messageId);
                    break;
            }
        }
        else {
            console.error("Invalid message object.");
        }
    });

    socket.on('disconnect', function server$io$on$disconnect() {
        console.log("Processing disconnect from user: ")
        console.dir(user);
        if (user) {
            removeSocket(user, socketId);
            user = undefined;
        }
    });
});
