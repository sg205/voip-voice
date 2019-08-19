"use strict";
console.log("VoIP-Test loading...");

var BASE_URL = "https://matrix.org";

// accessToken of tf001:
var TOKEN = "MDAxOGxvY2F0aW9uIG1hdHJpeC5vcmcKMDAxM2lkZW50aWZpZXIga2V5CjAwMTBjaWQgZ2VuID0gMQowMDI0Y2lkIHVzZXJfaWQgPSBAdGYwMDE6bWF0cml4Lm9yZwowMDE2Y2lkIHR5cGUgPSBhY2Nlc3MKMDAyMWNpZCBub25jZSA9IE1rZEVjZ1NIaXJ6M2lCXksKMDAyZnNpZ25hdHVyZSAS7IR5qcvcqswWFAEq0feE8A7qD3UueE_1Q1HdJ_CFDgo";

// Room "talent-factory":
var ROOM_ID = "!IDTxyVLBWnjXswzvrA:matrix.org";

var USER_ID;
var PASSWD;
var client;
var call;

function logRooms() {
    var rooms = client.getRooms();
    rooms.forEach(room => {
        console.log(room.roomId);
    });
}

function disableButtons(place, answer, hangup) {
    document.getElementById("hangup").disabled = hangup;
    document.getElementById("answer").disabled = answer;
    document.getElementById("call-video").disabled = place;
    document.getElementById("call-audio").disabled = place;
}

function addListeners(call) {
    var lastError = "";
    call.on("hangup", function() {
        disableButtons(false, true, true);
        document.getElementById("result").innerHTML = (
            "<p>Call ended. Last error: "+lastError+"</p>"
        );
    });
    call.on("error", function(err) {
        lastError = err.message;
        call.hangup();
        disableButtons(false, true, true);
    });
}

//window.onloadend = function() {
$(document).ready(function () {
    console.log("Document ready...");
    disableButtons(true, true, true);
    document.getElementById("tf001").onclick = function() {
        initClient("@tf001:matrix.org");
    };
    document.getElementById("tf002").onclick = function() {
        initClient("@tf002:matrix.org");
    };
    document.getElementById("tf003").onclick = function() {
        initClient("@tf003:matrix.org");
    };
});


function initClient(user) {
    USER_ID = user;
    console.log("Selected user: " + USER_ID);

    client = matrixcs.createClient({
        baseUrl: BASE_URL,
        //accessToken: TOKEN,
        //userId: USER_ID
    });

    PASSWD = "Berna-" + USER_ID.substr(1,5);
    console.log(PASSWD);
    client.login("m.login.password", {"user": USER_ID, "password": PASSWD}).then((response) => {
        TOKEN = response.access_token;
        console.log(response.access_token);

        client.startClient();
    });


    document.getElementById("result").innerHTML = "<p>Please wait. Syncing...</p>";
    document.getElementById("config").innerHTML = "<p>" +
        "Homeserver: <code>"+BASE_URL+"</code><br/>"+
        "Room: <code>"+ROOM_ID+"</code><br/>"+
        "User: <code>"+USER_ID+"</code><br/>"+
        "AccessToken: <code>"+TOKEN+"</code><br/>"+
        "</p>";

    client.on("sync", function(state, prevState, data) {
        switch (state) {
            case "PREPARED":
                syncComplete();
                break;
        }
    });
}

function syncComplete() {
    document.getElementById("result").innerHTML = "<p>Ready for calls.</p>";
    disableButtons(false, true, true);
    logRooms();

    document.getElementById("call-video").onclick = function() {
        console.log("Placing video call...");
        call = matrixcs.createNewMatrixCall(client, ROOM_ID);
        console.log("Call => %s", call);
        addListeners(call);
        call.placeVideoCall(
            document.getElementById("remote"),
            document.getElementById("local")
        );
        document.getElementById("result").innerHTML = "<p>Placed video call.</p>";
        disableButtons(true, true, false);
    };

    document.getElementById("call-audio").onclick = function() {
        console.log("Placing audio call...");
        call = matrixcs.createNewMatrixCall(client, ROOM_ID);
        console.log("Call => %s", call);
        addListeners(call);
        call.placeVoiceCall();
        document.getElementById("result").innerHTML = "<p>Placed voice call.</p>";
        disableButtons(true, true, false);
    };

    document.getElementById("hangup").onclick = function() {
        console.log("Hanging up call...");
        console.log("Call => %s", call);
        call.hangup();
        document.getElementById("result").innerHTML = "<p>Hungup call.</p>";
    };

    document.getElementById("answer").onclick = function() {
        console.log("Answering call...");
        console.log("Call => %s", call);
        call.answer();
        disableButtons(true, true, false);
        document.getElementById("result").innerHTML = "<p>Answered call.</p>";
    };

    client.on("Call.incoming", function(c) {
        console.log("Call ringing");
        disableButtons(true, false, false);
        document.getElementById("result").innerHTML = "<p>Incoming call...</p>";
        call = c;
        addListeners(call);
    });
}

