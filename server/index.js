//Creating a simple WebSocket server using ws library
//This server listens for incoming WebSocket connections and echoes back any messages it receives.
import express from "express";
import {Server} from "socket.io";
import path from "path";
import {fileURLToPath} from "url";
import { time } from "console";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3500;
const ADMIN = "Admin";
const app = express();

app.use(express.static(path.join(__dirname, "public")));

const expressServer = app.listen(PORT, () => 
{
    console.log(`Express server is running on port ${PORT}`);
});

//State
const usersState = 
{
    users: [],
    setUsers: function (newUsersArray)
    {
        this.users = newUsersArray;
    }
}

const io = new Server(expressServer, 
{
    cors: {
        origin: process.env.NODE_ENV === "production" ? false : 
        ["http://localhost:5500", "http://127.0.0.1:5500"]
    }
});

io.on('connection', (socket) => 
{
    console.log(`User ${socket.id} connected`);

    //Going to a specific user.
    socket.emit('message', buildMsg(ADMIN, `Welcome to the chat`));

    socket.on('enterRoom', ({name, room}) =>
    {
        //User will leave the previous room
        const prevRoom = getUser(socket.id)?.room;
        if (prevRoom)
        {
            socket.leave(prevRoom);
            io.to(prevRoom).emit('message', buildMsg(ADMIN, `${name} has left the room`));
        }

        const user = activateUser(socket.id, name, room);

        //Update state user list
        if(prevRoom)
        {
            io.to(prevRoom).emit('userList', 
                {
                    users: getUsersInRoom(prevRoom)
                });
        }

        //Joining the new room
        socket.join(user.room);

        //Notice of joining the new room
        socket.emit('message', buildMsg(ADMIN, `You have joined ${user.room} chat room`));

        //Notice of joining the new room to all users
        socket.broadcast.to(user.room).emit('message', buildMsg(ADMIN, `${user.name} has joined the room`));

        //Update user list in the new room
        io.to(user.room).emit('userList', 
            {
                users: getUsersInRoom(user.room)
            });

        //Update room list
        io.emit('roomList', 
            {
                rooms: getActiveRooms()
            });


    });

     //When a user disconnects
    socket.on('disconnect', () =>
    {
        const user = getUser(socket.id);
        userLeaves(socket.id);
       if(user)
       {
        io.to(user.room).emit('message', buildMsg(ADMIN, `${user.name} has left the room`));

        io.to(user.room).emit('userList',
            {
                users: getUsersInRoom(user.room)
            });

        io.emit('roomList', 
            {
                rooms: getActiveRooms()
            });
       }

       console.log(`User ${socket.id} disconnected`);

    });

    //Listening for activity
    socket.on('message', ({name, text}) => 
        {
            const room = getUser(socket.id)?.room;
            if (room)
            {
                io.to(room).emit('message', buildMsg(name, text));
            }
            
        });


    //Listening for activity
    socket.on('activity', (name) => 
    {
        const room = getUser(socket.id)?.room;
        if (room)
        {
            socket.broadcast.to(room).emit('activity', name);
        }
        
    });
});

function buildMsg(name, text)
{
    return {
        name, 
        text,
        time: new Intl.DateTimeFormat('default',
            {
                hour: '2-digit',
                minute: '2-digit'
            }).format(new Date())
    };
}

//User functions
function activateUser(id, name, room)
{
    const user = {id, name, room};
    usersState.setUsers([
        ...usersState.users.filter(user => user.id !== id),
        user
    ]);
    return user;
}

function userLeaves(id)
{
    usersState.setUsers(usersState.users.filter(user => user.id !== id));
}

function getUser(id)
{
    return usersState.users.find(user => user.id === id);
}

function getUsersInRoom(room)
{
    return usersState.users.filter(user => user.room === room);
}

function getActiveRooms()
{
    return Array.from(new Set(usersState.users.map(user => user.room)));
}