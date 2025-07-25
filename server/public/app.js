const socket = io('https://textapp-x1ik.onrender.com');


const msgInput = document.querySelector('#message');
const nameInput = document.querySelector('#name');
const chatRoom = document.querySelector('#room');
const activity = document.querySelector('.activity');
const userList = document.querySelector('.user-list');
const roomList = document.querySelector('.room-list');
const chatDisplay = document.querySelector('.chat-display');

//Submitting the form without reloading the page
function sendMessage(e) 
{ 
    e.preventDefault();
    if (nameInput.value && msgInput.value && chatRoom.value)
    {
        socket.emit('message', 
            {
                name: nameInput.value,
                text: msgInput.value
            })
        msgInput.value = '';
    }
    msgInput.focus();
}

function enterRoom(e)
{
    e.preventDefault();
    if (nameInput.value && chatRoom.value)
    {
        socket.emit('enterRoom', 
            {
                name: nameInput.value,
                room: chatRoom.value
            })
        
    }
}

document.querySelector('.form-chat').addEventListener('submit', sendMessage);
document.querySelector('.form-join').addEventListener('submit', enterRoom);

msgInput.addEventListener('keydown', () =>
{
    socket.emit('activity', nameInput.value);
});

//Listening for messages from the server
socket.on('message', (data) => 
{
    activity.textContent = '';
    const {name, text, time} = data;
    const li = document.createElement('li');
    li.className = 'post';
    
    if (name === nameInput.value) li.className = 'post post--right';
    if (name !== nameInput.value && name !== 'Admin') li.className = 'post post--left';
    if (name !== 'Admin') 
    {
        li.innerHTML = `<div class="post__header ${name === nameInput.value ? 'post__header--user' : 'post__header--reply'}">
        <span class="post__header--name">${name}</span>
        <span class="post__header--time">${time}</span>
        </div>
        <div class="post__text">${text}</div>`;
    }
    else
    {
        li.innerHTML = `<div class="post__text">${text}</div>`;
    }
    document.querySelector('.chat-display').appendChild(li);

    chatDisplay.scrollTop = chatDisplay.scrollHeight;
});



let activityTimer;
//Listening for activity from the server
socket.on('activity', (name) =>
{
    activity.textContent = `${name} is typing...`;
    clearTimeout(activityTimer);
    activityTimer = setTimeout(() => 
    {
        activity.textContent = '';
    }, 3000);
});

socket.on('userList', ({users}) =>
{
    showUsers(users);
});

socket.on('roomList', ({rooms}) =>
{
    showRooms(rooms);
});

function showUsers(users)
{
    if(users && users.length)
    {
        const names = users.map(user => user.name).join(', ');
        userList.innerHTML = `<em>Users in ${chatRoom.value}</em><br>${names}`;
    }
    else
    {
        userList.innerHTML = '';
    }
}

function showRooms(rooms)
{
    if(rooms && rooms.length)
    {
        const roomNames = rooms.join(', ');
        roomList.innerHTML = `<em>Active Rooms</em><br>${roomNames}`;
    }
    else
    {
        roomList.innerHTML = '';
    }
}
